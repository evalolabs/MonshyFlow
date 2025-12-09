/**
 * Workflow Run Controller
 * 
 * Handles /v1/workflows/:id/runs API endpoints
 */

import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { runStorageService } from '../services/runStorageService';
import { queueService } from '../services/queueService';
import { schemaValidationService } from '../services/schemaValidationService';
import { webhookService } from '../services/webhookService';
import { executionService } from '../services/executionService';
import { WorkflowRun, RunStatus } from '../models/run';

/**
 * Create and start a workflow run
 * POST /v1/workflows/:id/runs
 */
export async function createRun(req: Request, res: Response) {
    const requestId = req.headers['x-request-id'] as string || randomUUID();
    const idempotencyKey = req.headers['idempotency-key'] as string;

    try {
        const workflowId = req.params.id;
        const {
            input,
            options = {},
            webhook_url,
            metadata = {},
            workflow_version = 'live'
        } = req.body;

        // Validate required fields
        if (!input) {
            return res.status(400).json({
                error: {
                    type: 'invalid_request',
                    message: 'input is required',
                    code: 'MISSING_INPUT'
                },
                request_id: requestId
            });
        }

        // Check idempotency
        if (idempotencyKey) {
            const existingRun = await runStorageService.getRunByIdempotencyKey(idempotencyKey);
            if (existingRun) {
                console.log(`♻️  Idempotent request, returning existing run: ${existingRun.run_id}`);
                return res.status(200).json(formatRunResponse(existingRun, requestId));
            }
        }

        // TODO: Load workflow and validate schemas
        // For now, skip schema validation
        // const workflow = await workflowService.getWorkflow(workflowId);
        // schemaValidationService.validate(input, workflow.input_schema);

        const runId = `run_${randomUUID().replace(/-/g, '').substring(0, 16)}`;

        // Parse options
        const {
            stream = false,
            background = false,
            store = true,
            timeout_ms = 120000
        } = options;

        // Create run record
        const run: Partial<WorkflowRun> = {
            run_id: runId,
            workflow_id: workflowId,
            workflow_version,
            status: background ? 'queued' : 'running',
            input,
            options: { stream, background, store, timeout_ms },
            metadata,
            webhook_url,
            idempotency_key: idempotencyKey,
            request_id: requestId,
            created_at: new Date()
        };

        await runStorageService.createRun(run);

        console.log(`🚀 Run created: ${runId} (workflow: ${workflowId}, mode: ${background ? 'background' : stream ? 'stream' : 'sync'})`);

        // BACKGROUND MODE - Queue for later processing
        if (background) {
            await queueService.publishRun({
                run_id: runId,
                workflow_id: workflowId,
                workflow_version,
                input,
                timeout_ms,
                webhook_url,
                metadata,
                request_id: requestId
            });

            return res.status(200).json({
                run_id: runId,
                workflow_id: workflowId,
                workflow_version,
                status: 'queued',
                background: true,
                poll_url: `/v1/runs/${runId}/status`,
                request_id: requestId
            });
        }

        // STREAMING MODE - SSE
        if (stream) {
            return handleStreamingRun(req, res, runId, workflowId, input, requestId);
        }

        // SYNC MODE - Execute and wait
        return handleSyncRun(req, res, runId, workflowId, input, timeout_ms, requestId);

    } catch (error: any) {
        console.error('❌ Create run error:', error);

        return res.status(500).json({
            error: {
                type: 'internal_error',
                message: error.message || 'Failed to create run',
                code: 'RUN_CREATE_FAILED'
            },
            request_id: requestId
        });
    }
}

/**
 * Handle synchronous run execution
 */
async function handleSyncRun(
    req: Request,
    res: Response,
    runId: string,
    workflowId: string,
    input: any,
    timeout_ms: number,
    requestId: string
) {
    const startTime = Date.now();
    const workflowFromBody = (req.body as any)?.workflow;
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
        abortController.abort();
    }, timeout_ms);

    try {
        // Execute workflow with timeout using AbortController
        // If workflow is provided in request body, use it directly; otherwise load by ID

        const result = await Promise.race([
            workflowFromBody 
                ? executionService.executeWorkflowWithObject(workflowFromBody, input, abortController.signal)
                : executionService.executeWorkflowById(workflowId, input, abortController.signal),
            new Promise((_, reject) => {
                abortController.signal.addEventListener('abort', () => {
                    reject(new Error('Timeout'));
                });
            })
        ]) as any;

        clearTimeout(timeoutId);

        const latency = Date.now() - startTime;

            // Update run with result
            await runStorageService.updateRun(runId, {
                status: 'completed',
                output: result.output,
                completed_at: new Date(),
                usage: {
                    nodes: result.trace?.length || 0,
                    latency_ms: latency
                }
            });

            const updatedRun = await runStorageService.getRun(runId);

            console.log(`✅ Sync run completed: ${runId} (${latency}ms)`);

            return res.status(200).json(formatRunResponse(updatedRun!, requestId));

    } catch (error: any) {
        clearTimeout(timeoutId);
        console.error(`❌ Sync run failed: ${runId}`, error);

        // Update run with error
        await runStorageService.updateRun(runId, {
            status: error.message === 'Timeout' ? 'timeout' : 'failed',
            error: {
                type: 'execution_error',
                message: error.message,
                code: error.message === 'Timeout' ? 'TIMEOUT' : 'EXECUTION_FAILED'
            },
            completed_at: new Date()
        });

        return res.status(400).json({
            error: {
                type: 'execution_error',
                message: error.message,
                code: error.message === 'Timeout' ? 'TIMEOUT' : 'EXECUTION_FAILED'
            },
            run_id: runId,
            request_id: requestId
        });
    }
}

/**
 * Handle streaming run execution (SSE)
 */
async function handleStreamingRun(
    req: Request,
    res: Response,
    runId: string,
    workflowId: string,
    input: any,
    requestId: string
) {
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Request-Id', requestId);

    // Send initial event
    sendSSE(res, 'run.created', {
        run_id: runId,
        workflow_id: workflowId,
        status: 'running'
    });

    try {
        // Execute workflow with event streaming
        const result = await executionService.executeWorkflowById(workflowId, input);

        // Update run
        await runStorageService.updateRun(runId, {
            status: 'completed',
            output: result.output,
            completed_at: new Date()
        });

        // Send completion event
        sendSSE(res, 'run.completed', {
            run_id: runId,
            output: result.output,
            usage: {
                nodes: result.trace?.length || 0
            }
        });

        console.log(`✅ Stream run completed: ${runId}`);

    } catch (error: any) {
        console.error(`❌ Stream run failed: ${runId}`, error);

        await runStorageService.updateRun(runId, {
            status: 'failed',
            error: {
                type: 'execution_error',
                message: error.message,
                code: 'EXECUTION_FAILED'
            },
            completed_at: new Date()
        });

        sendSSE(res, 'run.failed', {
            run_id: runId,
            error: {
                type: 'execution_error',
                message: error.message
            }
        });
    } finally {
        res.end();
    }
}

/**
 * Get run status
 * GET /v1/runs/:id/status
 */
export async function getRunStatus(req: Request, res: Response) {
    const requestId = req.headers['x-request-id'] as string || randomUUID();

    try {
        const runId = req.params.id;
        const run = await runStorageService.getRun(runId);

        if (!run) {
            return res.status(404).json({
                error: {
                    type: 'not_found',
                    message: 'Run not found',
                    code: 'RUN_NOT_FOUND'
                },
                request_id: requestId
            });
        }

        return res.status(200).json(formatRunResponse(run, requestId));

    } catch (error: any) {
        console.error('❌ Get run status error:', error);

        return res.status(500).json({
            error: {
                type: 'internal_error',
                message: error.message,
                code: 'GET_STATUS_FAILED'
            },
            request_id: requestId
        });
    }
}

/**
 * Cancel a running workflow
 * POST /v1/runs/:id/cancel
 */
export async function cancelRun(req: Request, res: Response) {
    const requestId = req.headers['x-request-id'] as string || randomUUID();

    try {
        const runId = req.params.id;
        const run = await runStorageService.getRun(runId);

        if (!run) {
            return res.status(404).json({
                error: {
                    type: 'not_found',
                    message: 'Run not found',
                    code: 'RUN_NOT_FOUND'
                },
                request_id: requestId
            });
        }

        // Only cancel if still running/queued
        if (['running', 'queued'].includes(run.status)) {
            await runStorageService.updateRunStatus(runId, 'cancelled');
            console.log(`🛑 Run cancelled: ${runId}`);
        }

        return res.status(200).json({
            run_id: runId,
            status: 'cancelled',
            request_id: requestId
        });

    } catch (error: any) {
        console.error('❌ Cancel run error:', error);

        return res.status(500).json({
            error: {
                type: 'internal_error',
                message: error.message,
                code: 'CANCEL_FAILED'
            },
            request_id: requestId
        });
    }
}

/**
 * Get workflow runs history
 * GET /v1/workflows/:id/runs
 */
export async function getWorkflowRuns(req: Request, res: Response) {
    const requestId = req.headers['x-request-id'] as string || randomUUID();

    try {
        const workflowId = req.params.id;
        const limit = parseInt(req.query.limit as string) || 50;

        const runs = await runStorageService.getWorkflowRuns(workflowId, limit);

        return res.status(200).json({
            workflow_id: workflowId,
            runs: runs.map(run => formatRunResponse(run, requestId)),
            count: runs.length,
            request_id: requestId
        });

    } catch (error: any) {
        console.error('❌ Get workflow runs error:', error);

        return res.status(500).json({
            error: {
                type: 'internal_error',
                message: error.message,
                code: 'GET_RUNS_FAILED'
            },
            request_id: requestId
        });
    }
}

/**
 * Format run for API response
 */
function formatRunResponse(run: WorkflowRun, requestId: string): any {
    return {
        run_id: run.run_id,
        workflow_id: run.workflow_id,
        workflow_version: run.workflow_version,
        status: run.status,
        input: run.input,
        output: run.output,
        error: run.error,
        metadata: run.metadata,
        created_at: run.created_at,
        started_at: run.started_at,
        completed_at: run.completed_at,
        progress: run.progress,
        usage: run.usage,
        request_id: requestId
    };
}

/**
 * Send SSE event
 */
function sendSSE(res: Response, event: string, data: any): void {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
}

