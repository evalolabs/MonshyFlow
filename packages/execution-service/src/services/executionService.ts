import { Agent, run, tool, hostedMcpTool } from '@openai/agents';
import OpenAI from 'openai';
import axios, { AxiosError, Method } from 'axios';
import { z, type ZodTypeAny, type ZodObject } from 'zod';
import { randomUUID } from 'crypto';
import { getFunctionHandler } from '../functions';
import { getMcpHandler } from '../mcp';
import { getWebSearchHandler } from '../webSearch';
import type { WebSearchQuery, WebSearchResponse } from '../webSearch';
import { config } from '../config/config';
import { Execution, ExecutionRequest } from '../models/execution';
import { workflowService } from './workflowService';
import { redisService } from './redisService';
import { executionStorageService } from './executionStorageService';
import { generateSchemaFromNodeData } from '../utils/schemaGenerator';
import type { NodeData } from '../models/nodeData';
import { getNodeProcessor } from '../nodes';
import { getToolCreator } from '../tools';
import { schemaValidationService } from './schemaValidationService';
import { getInputSchemaJson, getOutputSchemaJson } from '../models/nodeSchemaRegistry';
import { createErrorNodeData } from '../models/nodeData';
import { ExpressionResolutionService } from './expressionResolutionService';

class ExecutionService {
    private openai: OpenAI;
    private traceUpdateQueue: Map<string, NodeJS.Timeout> = new Map();
    private traceUpdateQueueTimestamps: Map<string, number> = new Map(); // Track when timeout was created
    private traceEntryQueue: Map<string, any[]> = new Map(); // Queue for trace entries per execution (prevents race conditions)
    private traceUpdateInProgress: Set<string> = new Set(); // Track which executions are currently updating
    private executionAbortControllers: Map<string, AbortController> = new Map(); // Track abort controllers for cancellations

    constructor() {
        this.openai = new OpenAI({
            apiKey: config.openaiApiKey,
        });

        // Cleanup stale trace updates every 5 minutes to prevent memory leaks
        setInterval(() => {
            this.cleanupStaleTraceUpdates();
        }, 5 * 60 * 1000); // 5 minutes
    }

    /**
     * Add trace entry and update MongoDB (with queue-based updates to prevent race conditions)
     * Uses a queue per execution to ensure trace entries are processed sequentially
     */
    private async addTraceEntry(executionId: string, traceEntry: any, execution: Execution): Promise<void> {
        // Add to local execution object (if execution object exists)
        if (execution) {
            execution.trace.push(traceEntry);
        }

        // Add to queue for this execution (prevents race conditions)
        if (!this.traceEntryQueue.has(executionId)) {
            this.traceEntryQueue.set(executionId, []);
        }
        this.traceEntryQueue.get(executionId)!.push(traceEntry);

        // Batch MongoDB updates (debounce: update after 500ms of inactivity)
        const existingTimeout = this.traceUpdateQueue.get(executionId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        const timeout = setTimeout(async () => {
            await this.processTraceUpdateQueue(executionId, execution);
        }, 500); // 500ms debounce

        this.traceUpdateQueue.set(executionId, timeout);
        this.traceUpdateQueueTimestamps.set(executionId, Date.now());
    }

    /**
     * Process trace update queue for an execution (prevents race conditions)
     * Ensures all queued trace entries are applied sequentially
     */
    private async processTraceUpdateQueue(executionId: string, execution: Execution): Promise<void> {
        // Prevent concurrent updates for the same execution
        if (this.traceUpdateInProgress.has(executionId)) {
            // Reschedule update
            const timeout = setTimeout(() => this.processTraceUpdateQueue(executionId, execution), 100);
            this.traceUpdateQueue.set(executionId, timeout);
            return;
        }

        this.traceUpdateInProgress.add(executionId);

        try {
            // Get all queued trace entries
            const queuedEntries = this.traceEntryQueue.get(executionId) || [];
            
            if (queuedEntries.length === 0) {
                // No entries to process
                this.traceUpdateInProgress.delete(executionId);
                this.traceUpdateQueue.delete(executionId);
                this.traceUpdateQueueTimestamps.delete(executionId);
                return;
            }

            // Get current execution from MongoDB to get latest trace
            const currentExecution = await executionStorageService.getExecution(executionId);
            if (!currentExecution) {
                console.warn(`[ExecutionService] Execution ${executionId} not found in MongoDB, skipping trace update`);
                this.traceEntryQueue.delete(executionId);
                this.traceUpdateInProgress.delete(executionId);
                this.traceUpdateQueue.delete(executionId);
                this.traceUpdateQueueTimestamps.delete(executionId);
                return;
            }

            // Merge queued entries with current trace (avoid duplicates)
            const currentTraceIds = new Set(currentExecution.trace.map((t: any) => 
                `${t.nodeId}-${t.timestamp?.getTime() || t.timestamp}`
            ));
            
            const newEntries = queuedEntries.filter(entry => {
                const entryId = `${entry.nodeId}-${entry.timestamp?.getTime() || entry.timestamp}`;
                return !currentTraceIds.has(entryId);
            });

            // Update trace with all entries
            const updatedTrace = [...currentExecution.trace, ...newEntries];
            await executionStorageService.updateTrace(executionId, updatedTrace);

            // Update local execution object
            if (execution) {
                execution.trace = updatedTrace;
            }

            // Clear queue
            this.traceEntryQueue.delete(executionId);
            this.traceUpdateQueue.delete(executionId);
            this.traceUpdateQueueTimestamps.delete(executionId);
        } catch (error) {
            console.error(`[ExecutionService] Failed to update trace in MongoDB:`, error);
            // Clean up even on error to prevent memory leak
            this.traceEntryQueue.delete(executionId);
            this.traceUpdateQueue.delete(executionId);
            this.traceUpdateQueueTimestamps.delete(executionId);
        } finally {
            this.traceUpdateInProgress.delete(executionId);
        }
    }

    /**
     * Force immediate trace update to MongoDB
     */
    private async flushTraceUpdate(executionId: string, execution: Execution): Promise<void> {
        const existingTimeout = this.traceUpdateQueue.get(executionId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            this.traceUpdateQueue.delete(executionId);
            this.traceUpdateQueueTimestamps.delete(executionId);
        }

        // Process any queued trace entries immediately
        await this.processTraceUpdateQueue(executionId, execution);
    }

    /**
     * Cleanup stale trace update timeouts (prevent memory leaks)
     * Should be called periodically (e.g., every 5 minutes)
     */
    private cleanupStaleTraceUpdates(): void {
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes

        for (const [executionId, timestamp] of this.traceUpdateQueueTimestamps.entries()) {
            if (now - timestamp > maxAge) {
                const timeout = this.traceUpdateQueue.get(executionId);
                if (timeout) {
                    clearTimeout(timeout);
                    console.warn(`[ExecutionService] Cleaned up stale trace update timeout for execution: ${executionId}`);
                }
                this.traceUpdateQueue.delete(executionId);
                this.traceUpdateQueueTimestamps.delete(executionId);
            }
        }
    }

    private normalizeSecrets(secretsContainer: any): Record<string, string> {
        const result: Record<string, string> = {};

        if (!secretsContainer) {
            return result;
        }

        if (Array.isArray(secretsContainer)) {
            for (const entry of secretsContainer) {
                const key = (entry?.name || entry?.key || entry?.id || entry?.secretName || '').toString();
                const value = entry?.value ?? entry?.secret ?? entry?.secretValue ?? entry?.apiKey;
                if (key && typeof value === 'string' && value.trim()) {
                    result[key] = value.trim();
                }
            }
            return result;
        }

        if (typeof secretsContainer === 'object') {
            for (const [key, value] of Object.entries(secretsContainer)) {
                if (!key) continue;

                if (typeof value === 'string' && value.trim()) {
                    result[key] = value.trim();
                } else if (value && typeof value === 'object') {
                    const nestedValue = (value as any)?.value ?? (value as any)?.secret ?? (value as any)?.apiKey;
                    if (typeof nestedValue === 'string' && nestedValue.trim()) {
                        result[key] = nestedValue.trim();
                    }
                }
            }
        }

        return result;
    }

    private resolveOpenAIApiKey(workflow: any, nodeData?: any): string {
        const secrets = this.normalizeSecrets(workflow?.secrets);
        const data = nodeData || {};
        console.log('[ExecutionService] resolveOpenAIApiKey: normalized secret keys =', Object.keys(secrets));

        if (typeof data.apiKey === 'string' && data.apiKey.trim()) {
            return data.apiKey.trim();
        }

        const secretName = data.apiKeySecret || data.openaiSecret || data.openAiSecret;
        if (secretName && typeof secrets[secretName] === 'string' && secrets[secretName].trim()) {
            return secrets[secretName].trim();
        }

        const openAiSecret =
            secrets.openai ||
            secrets.OPENAI_API_KEY ||
            secrets.OpenAI ||
            secrets['openai-api-key'] ||
            secrets['OPENAI_API_KEY'];
        if (typeof openAiSecret === 'string' && openAiSecret.trim()) {
            return openAiSecret.trim();
        }

        if (typeof workflow?.openaiApiKey === 'string' && workflow.openaiApiKey.trim()) {
            return workflow.openaiApiKey.trim();
        }

        if (config.openaiApiKey) {
            return config.openaiApiKey;
        }

        throw new Error('OpenAI API key is not configured. Provide a key via workflow secrets or configuration.');
    }

    private createOpenAIClient(workflow: any, nodeData?: any): OpenAI {
        const apiKey = this.resolveOpenAIApiKey(workflow, nodeData);

        if (apiKey === config.openaiApiKey) {
            return this.openai;
        }

        return new OpenAI({ apiKey });
    }

    private ensureOpenAIEnvironment(workflow: any, nodeData?: any): string {
        const apiKey = this.resolveOpenAIApiKey(workflow, nodeData);
        process.env.OPENAI_API_KEY = apiKey;
        const snippet = apiKey ? `${apiKey.substring(0, Math.min(apiKey.length, 6))}...` : '(empty)';
        console.log('[ExecutionService] OPENAI_API_KEY resolved. Snippet:', snippet);
        return apiKey;
    }

    /**
     * Execute workflow by ID with input (for queue service)
     */
    async executeWorkflowById(workflowId: string, input: any, abortSignal?: AbortSignal): Promise<Execution> {
        return this.executeWorkflow(workflowId, { input }, abortSignal);
    }

    /**
     * Execute workflow with workflow object directly (avoids API call)
     */
    async executeWorkflowWithObject(workflow: any, input: any, abortSignal?: AbortSignal): Promise<Execution> {
        return this.executeWorkflowInternal(workflow, { input }, abortSignal);
    }

    async executeWorkflow(workflowId: string, request: ExecutionRequest, abortSignal?: AbortSignal): Promise<Execution> {
        // Use workflow from request if provided (for webhook/scheduled executions with secrets)
        // Otherwise load from API
        let workflow = (request as any).workflow;
        
        if (!workflow) {
            // Load workflow from API
            workflow = await workflowService.getWorkflowById(workflowId);
            if (!workflow) {
                throw new Error(`Workflow ${workflowId} not found`);
            }
        } else {
            console.log('[ExecutionService] Using workflow from request body (includes secrets)');
        }
        
        return this.executeWorkflowInternal(workflow, request, abortSignal);
    }

    private async executeWorkflowInternal(workflow: any, request: ExecutionRequest, abortSignal?: AbortSignal): Promise<Execution> {
        // Extract workflowId from workflow object
        const workflowId = workflow.id || workflow._id || workflow.workflowId || '';
        
        // Validate input against schema if defined
        // Skip validation for scheduled executions (source === 'scheduler')
        const startNode = workflow.nodes?.find((n: any) => n.type === 'start');
        const isScheduledExecution = request.input?._metadata?.source === 'scheduler' || 
                                     request.input?._metadata?.skipSchemaValidation === true;
        
        console.log('[ExecutionService] Checking for inputSchema in startNode');
        console.log('[ExecutionService] StartNode found:', !!startNode);
        console.log('[ExecutionService] Is scheduled execution:', isScheduledExecution);
        console.log('[ExecutionService] StartNode.data:', startNode?.data ? JSON.stringify(startNode.data, null, 2) : 'null');
        console.log('[ExecutionService] StartNode.data.inputSchema:', startNode?.data?.inputSchema ? JSON.stringify(startNode.data.inputSchema, null, 2) : 'null');
        
        if (startNode?.data?.inputSchema && !isScheduledExecution) {
            try {
                // Prefer _originalInput (original request body) over transformed input for validation
                let dataToValidate = request.input?._originalInput || request.input;
                
                // Get the schema
                const schema = startNode.data.inputSchema;
                
                // Check if schema expects a nested structure with "input" property
                // If schema has properties.input, it expects { input: {...} } format
                // Otherwise, it expects the input data directly
                const schemaExpectsNestedInput = schema?.properties?.input && typeof schema.properties.input === 'object';
                
                console.log('[ExecutionService] Validating input against schema');
                console.log('[ExecutionService] Schema:', JSON.stringify(schema, null, 2));
                console.log('[ExecutionService] Schema expects nested input:', schemaExpectsNestedInput);
                console.log('[ExecutionService] Original dataToValidate:', JSON.stringify(dataToValidate, null, 2));
                
                // If schema expects nested structure but we have direct input, wrap it
                if (schemaExpectsNestedInput && dataToValidate && typeof dataToValidate === 'object' && !dataToValidate.input) {
                    console.log('[ExecutionService] Schema expects nested input, wrapping data');
                    dataToValidate = { input: dataToValidate };
                }
                // If schema expects direct input but we have nested structure, extract it
                else if (!schemaExpectsNestedInput && dataToValidate && typeof dataToValidate === 'object' && dataToValidate.input && Object.keys(dataToValidate).length === 1) {
                    console.log('[ExecutionService] Schema expects direct input, extracting from nested structure');
                    dataToValidate = dataToValidate.input;
                }
                
                console.log('[ExecutionService] Data to validate (final):', JSON.stringify(dataToValidate, null, 2));
                console.log('[ExecutionService] Has _originalInput:', !!request.input?._originalInput);
                console.log('[ExecutionService] Full request.input:', JSON.stringify(request.input, null, 2));
                
                const validation = schemaValidationService.validate(schema, dataToValidate);
                
                console.log('[ExecutionService] Validation result:', validation.valid, validation.errors);
                
                if (!validation.valid) {
                    // Provide more detailed error message
                    const errorDetails = validation.errors?.join('; ') || 'Unknown validation error';
                    console.error('[ExecutionService] Validation failed:', {
                        schema: schema,
                        data: dataToValidate,
                        errors: validation.errors,
                        schemaExpectsNestedInput
                    });
                    throw new Error(`Input validation failed: ${errorDetails}`);
                }
            } catch (error: any) {
                console.error('[ExecutionService] Schema validation error:', error);
                // Preserve original error message if it's already a validation error
                if (error.message && error.message.includes('validation failed')) {
                    throw error;
                }
                throw new Error(`Input validation failed: ${error.message}`);
            }
        } else {
            if (isScheduledExecution) {
                console.log('[ExecutionService] Skipping schema validation for scheduled execution');
            } else {
                console.log('[ExecutionService] No inputSchema found in startNode.data');
            }
        }
        
        // Create execution with UUID to prevent collisions
        const executionId = `exec_${randomUUID().replace(/-/g, '').substring(0, 16)}`;
        
        // Create abort controller for this execution (for timeout/cancellation)
        const abortController = new AbortController();
        this.executionAbortControllers.set(executionId, abortController);
        
        let execution: Execution = {
            id: executionId,
            workflowId,
            status: 'running',
            input: request.input,
            trace: [],
            startedAt: new Date(),
        };

        // Store execution in MongoDB
        await executionStorageService.createExecution(execution);

        // Publish execution started event
        await redisService.publish('execution.started', {
            executionId,
            workflowId,
            startedAt: execution.startedAt,
        });

        // Execute workflow using Agents SDK
        try {
            // Check if aborted before starting
            if (abortController.signal.aborted) {
                throw new Error('Execution was cancelled');
            }

            const output = await this.processWorkflow(workflow, request.input, execution, abortController.signal);
            
            // Flush any pending trace updates
            await this.flushTraceUpdate(executionId, execution);

            // Update execution in MongoDB
            await executionStorageService.updateExecution(executionId, {
                status: 'completed',
                output: output,
                completedAt: new Date()
            });

            // Reload execution for return
            const updatedExecution = await executionStorageService.getExecution(executionId);
            if (!updatedExecution) {
                throw new Error('Failed to retrieve updated execution');
            }
            execution = updatedExecution;

            // Publish execution completed event
            await redisService.publish('execution.completed', {
                executionId,
                workflowId,
                output,
                completedAt: execution.completedAt,
            });

            // Clean up abort controller
            this.executionAbortControllers.delete(executionId);

            return execution;
        } catch (error: any) {
            // Check if error is due to abort
            const isAborted = error.name === 'AbortError' || abortController.signal.aborted || error.message === 'Execution was cancelled';
            
            // Flush any pending trace updates before marking as failed
            await this.flushTraceUpdate(executionId, execution);

            // Update execution in MongoDB
            await executionStorageService.updateExecution(executionId, {
                status: 'failed',
                error: isAborted ? 'Execution was cancelled or timed out' : error.message,
                completedAt: new Date()
            });

            // Clean up abort controller
            this.executionAbortControllers.delete(executionId);

            // Reload execution for error handling
            const failedExecution = await executionStorageService.getExecution(executionId);
            if (failedExecution) {
                execution = failedExecution;
            } else {
                execution.status = 'failed';
                execution.error = error.message;
                execution.completedAt = new Date();
            }

            // Publish execution failed event
            await redisService.publish('execution.failed', {
                executionId,
                workflowId,
                error: error.message,
                completedAt: execution.completedAt,
            });

            throw error;
        }
    }

    private async processWorkflow(workflow: any, input: any, execution: Execution, abortSignal?: AbortSignal): Promise<any> {
        // Check if aborted
        if (abortSignal?.aborted) {
            throw new Error('Execution was cancelled');
        }

        // Check if workflow should use Agents SDK orchestration
        const useAgentsSDK = this.shouldUseAgentsSDK(workflow);
        
        if (useAgentsSDK) {
            return await this.processWorkflowWithAgentsSDK(workflow, input, execution, abortSignal);
        } else {
            return await this.processWorkflowSequentially(workflow, input, execution, abortSignal);
        }
    }

    /**
     * Determine if workflow should use Agents SDK orchestration
     */
    private shouldUseAgentsSDK(workflow: any): boolean {
        // Use Agents SDK only if:
        // 1. Workflow explicitly has useAgentsSDK flag set to true
        // OR
        // 2. Workflow has multiple agent nodes that need orchestration
        
        const hasAgentsSDKFlag = workflow.useAgentsSDK === true;
        const agentNodes = workflow.nodes?.filter((n: any) => n.type === 'agent') || [];
        const hasMultipleAgents = agentNodes.length > 1;
        
        // If useAgentsSDK is explicitly false, don't use it (even with multiple agents)
        if (workflow.useAgentsSDK === false) {
            console.log(`[ExecutionService] useAgentsSDK is false, using sequential processing`);
            return false;
        }
        
        // Use Agents SDK if explicitly enabled OR if multiple agents need orchestration
        const shouldUse = hasAgentsSDKFlag || hasMultipleAgents;
        console.log(`[ExecutionService] shouldUseAgentsSDK: ${shouldUse} (useAgentsSDK=${workflow.useAgentsSDK}, agentCount=${agentNodes.length})`);
        return shouldUse;
    }

    /**
     * Process workflow using Agents SDK orchestration
     */
    private async processWorkflowWithAgentsSDK(workflow: any, input: any, execution: Execution, abortSignal?: AbortSignal): Promise<any> {
        // Check if aborted
        if (abortSignal?.aborted) {
            throw new Error('Execution was cancelled');
        }

        console.log('🚀 Processing workflow with Agents SDK orchestration');
        this.ensureOpenAIEnvironment(workflow);
        
        // Build all agents from workflow
        const agents = await this.buildAgentsFromWorkflow(workflow);
        
        if (agents.length === 0) {
            console.log('⚠️ No agent nodes found, falling back to sequential processing');
            return await this.processWorkflowSequentially(workflow, input, execution, abortSignal);
        }

        // Create orchestrator agent
        const orchestrator = new Agent({
            name: workflow.name || 'Workflow Orchestrator',
            instructions: this.buildOrchestratorInstructions(workflow),
            model: 'gpt-4o',
            tools: agents.map(agent => agent.asTool({
                toolName: agent.name,
                toolDescription: `Agent: ${agent.name}`,
            })),
        });

        // Execute with Agents SDK
        const result = await run(orchestrator, typeof input === 'string' ? input : JSON.stringify(input));
        
        // Debug: Log result structure
        console.log(`[ExecutionService] 🔍 Agents SDK result structure:`);
        console.log(`[ExecutionService]   - result.newItems: ${result.newItems?.length || 0} items`);
        console.log(`[ExecutionService]   - result.finalOutput: ${typeof result.finalOutput} (${result.finalOutput?.substring?.(0, 100) || JSON.stringify(result.finalOutput).substring(0, 100)})`);
        if (result.newItems && result.newItems.length > 0) {
            console.log(`[ExecutionService]   - First item type: ${result.newItems[0].type}`);
        }
        
        // Convert Agents SDK trace to our execution format
        await this.convertAgentsSDKTraceToExecution(result, execution, workflow);
        
        // After Agents SDK execution, continue with remaining nodes in the workflow
        // (e.g., HTTP Request, End nodes that come after the agent)
        
        // Find the agent node(s) to determine where to continue
        const agentNodes = workflow.nodes.filter((n: any) => n.type === 'agent');
        if (agentNodes.length > 0) {
            const agentNodeId = agentNodes.length === 1 ? agentNodes[0].id : 'orchestrator';
            const agentNodeName = agentNodes.length === 1 ? (agentNodes[0].data?.label || agentNodes[0].id) : 'orchestrator';
            
            // Debug: Log all trace entries after convertAgentsSDKTraceToExecution
            console.log(`[ExecutionService] 🔍 Trace entries after convertAgentsSDKTraceToExecution: ${execution.trace.length}`);
            execution.trace.forEach((t: any, index: number) => {
                console.log(`[ExecutionService]   Trace[${index}]: nodeId=${t.nodeId}, type=${t.type}, hasOutput=${!!t.output}`);
            });
            
            // ✅ FIX: Get the actual agent output from trace (created by convertAgentsSDKTraceToExecution)
            // instead of using result.finalOutput (which is the orchestrator's response)
            // Priority:
            // 1. Agent trace entries (type: 'agent', nodeId matches agent node)
            // 2. Tool trace entries (type: 'tool', nodeId/toolName matches agent name - when agent is used as tool)
            // 3. Fallback to result.finalOutput
            
            let agentNodeData: any = null;
            
            // First, try to find agent trace entries
            const agentTraceEntries = execution.trace.filter((t: any) => 
                (t.nodeId === agentNodeId || (agentNodes.length === 1 && t.nodeId === agentNodes[0].id)) && 
                t.type === 'agent' && 
                t.output
            );
            
            console.log(`[ExecutionService] 🔍 Searching for agent trace entries: nodeId=${agentNodeId}, found=${agentTraceEntries.length}`);
            
            if (agentTraceEntries.length > 0) {
                // Use the LAST agent trace entry (most recent output)
                const lastAgentTraceEntry = agentTraceEntries[agentTraceEntries.length - 1];
                agentNodeData = lastAgentTraceEntry.output;
                console.log(`[ExecutionService] ✅ Using agent output from trace (type: agent) for node ${lastAgentTraceEntry.nodeId} (found ${agentTraceEntries.length} entries, using last one)`);
            } else {
                // Second, try to find tool trace entries (when agent is used as tool)
                const toolTraceEntries = execution.trace.filter((t: any) => 
                    t.type === 'tool' && 
                    t.output &&
                    (t.nodeId === agentNodeName || 
                     t.nodeId === agentNodeId ||
                     (t.toolCalls && t.toolCalls.some((tc: any) => tc.toolName === agentNodeName)))
                );
                
                console.log(`[ExecutionService] 🔍 Searching for tool trace entries: name=${agentNodeName}, found=${toolTraceEntries.length}`);
                
                if (toolTraceEntries.length > 0) {
                    // Use the LAST tool trace entry (most recent output)
                    const lastToolTraceEntry = toolTraceEntries[toolTraceEntries.length - 1];
                    agentNodeData = lastToolTraceEntry.output;
                    console.log(`[ExecutionService] ✅ Using agent output from trace (type: tool) for ${lastToolTraceEntry.nodeId} (found ${toolTraceEntries.length} entries, using last one)`);
                }
            }
            
            if (!agentNodeData) {
                // Fallback: Use result.finalOutput if trace entry doesn't exist
                console.warn(`[ExecutionService] ⚠️ No trace entry found for agent node ${agentNodeId} (name: ${agentNodeName}), using result.finalOutput as fallback`);
                console.log(`[ExecutionService] Available trace entries:`, execution.trace.map((t: any) => `${t.nodeId}(${t.type})`).join(', '));
                const agentOutput = result.finalOutput;
                console.log('[ExecutionService] Raw agent output (fallback):', JSON.stringify(agentOutput, null, 2));
                const normalizedAgentOutput = this.normalizeAgentOutput(agentOutput);
                console.log('[ExecutionService] Normalized agent output (fallback):', JSON.stringify(normalizedAgentOutput, null, 2));
                agentNodeData = this.ensureNodeData(normalizedAgentOutput, agentNodeId, 'agent');
                
                // Create trace entry if it doesn't exist
                const traceEntry = {
                    nodeId: agentNodeId,
                    type: 'agent',
                    input: undefined,
                    output: agentNodeData,
                    timestamp: new Date(),
                    duration: 0,
                };
                this.addSchemaToTraceEntry(traceEntry);
                await this.addTraceEntry(execution.id!, traceEntry, execution);
                console.log(`[ExecutionService] Created trace entry for agent node ${agentNodeId} with NodeData format. Trace length: ${execution.trace.length}`);
            } else {
                console.log(`[ExecutionService] Agent output from trace:`, JSON.stringify(agentNodeData, null, 2));
            }
            
            // Find nodes that come after agent nodes
            const nodesAfterAgent = this.findNodesAfterAgent(workflow, agentNodes);
            
            if (nodesAfterAgent.length > 0) {
                console.log(`[ExecutionService] Found ${nodesAfterAgent.length} nodes after agent, continuing execution...`);
                console.log(`[ExecutionService] Trace before processing nodes: length=${execution.trace.length}, entries=${execution.trace.map((t: any) => `${t.nodeId}(${t.type})`).join(', ')}`);
                // Continue execution with remaining nodes
                let currentInput: any = agentNodeData;
                for (const node of nodesAfterAgent) {
                    // Check if aborted
                    if (abortSignal?.aborted) {
                        throw new Error('Execution was cancelled');
                    }

                    const nodeStartTime = Date.now();
                    try {
                        
                        // Send node.start event for real-time animation
                        try {
                            await redisService.publish('node.start', {
                                executionId: execution.id,
                                nodeId: node.id,
                                nodeType: node.type,
                                nodeLabel: node.data?.label,
                                startedAt: new Date().toISOString()
                            });
                        } catch (err) {
                            console.warn('[ExecutionService] Failed to publish node.start event:', err);
                        }
                        
                        const nodeOutput = await this.processNode(node, currentInput, workflow, execution);
                        
                        const nodeDuration = Date.now() - nodeStartTime;
                        
                        // Send node.end event with duration for real-time animation
                        try {
                            await redisService.publish('node.end', {
                                executionId: execution.id,
                                nodeId: node.id,
                                nodeType: node.type,
                                nodeLabel: node.data?.label,
                                status: 'completed',
                                duration: nodeDuration,
                                output: nodeOutput,
                                completedAt: new Date().toISOString()
                            });
                        } catch (err) {
                            console.warn('[ExecutionService] Failed to publish node.end event:', err);
                        }
                        
                        // Add trace entry with schema generation
                        const traceEntry = {
                            nodeId: node.id,
                            type: node.type,
                            input: currentInput,
                            output: nodeOutput,
                            timestamp: new Date(),
                            duration: nodeDuration,
                        };
                        this.addSchemaToTraceEntry(traceEntry);
                        await this.addTraceEntry(execution.id!, traceEntry, execution);
                        
                        // Ensure currentInput is NodeData for next iteration
                        currentInput = this.ensureNodeData(nodeOutput, node.id, node.type);
                        
                        // Stop at end node
                        if (node.type === 'end') {
                            return nodeOutput;
                        }
                    } catch (error: any) {
                        const nodeDuration = Date.now() - (nodeStartTime || Date.now());
                        
                        // Send node.end event with error for real-time animation
                        try {
                            await redisService.publish('node.end', {
                                executionId: execution.id,
                                nodeId: node.id,
                                nodeType: node.type,
                                nodeLabel: node.data?.label,
                                status: 'failed',
                                duration: nodeDuration,
                                error: error.message,
                                completedAt: new Date().toISOString()
                            });
                        } catch (err) {
                            console.warn('[ExecutionService] Failed to publish node.end event (error):', err);
                        }
                        
                        // STANDARDIZED: Create error NodeData for trace
                        const errorNodeData = createErrorNodeData(
                            error.message,
                            node.id,
                            node.type,
                            'EXECUTION_ERROR',
                            { originalError: error.toString() }
                        );
                        
                        const errorTraceEntry = {
                            nodeId: node.id,
                            type: node.type,
                            input: currentInput,
                            output: errorNodeData, // ← NodeData mit Error, nicht null!
                            error: error.message,
                            timestamp: new Date(),
                            duration: nodeDuration,
                        };
                        this.addSchemaToTraceEntry(errorTraceEntry);
                        await this.addTraceEntry(execution.id!, errorTraceEntry, execution);
                        await this.flushTraceUpdate(execution.id!, execution); // Flush before error
                        throw error;
                    }
                }
                
                return currentInput;
            } else {
                // No nodes after agent, return agent output directly
                return agentNodeData;
            }
        }
        
        // Fallback: return result.finalOutput if no agent nodes found
        return this.ensureNodeData(result.finalOutput, 'orchestrator', 'agent');
    }

    /**
     * Process workflow sequentially (legacy method)
     */
    private async processWorkflowSequentially(workflow: any, input: any, execution: Execution, abortSignal?: AbortSignal): Promise<any> {
        // Check if aborted
        if (abortSignal?.aborted) {
            throw new Error('Execution was cancelled');
        }

        console.log('🔄 Processing workflow sequentially');
        
        // Find start node
        const startNode = workflow.nodes.find((n: any) => n.type === 'start');
        if (!startNode) {
            throw new Error('No start node found in workflow');
        }

        // Execute workflow node by node
        let currentInput: any = this.ensureNodeData(input, startNode.id, startNode.type);
        let currentNode = startNode;
        const visitedNodes = new Set<string>();

        while (currentNode) {
            // Check if aborted
            if (abortSignal?.aborted) {
                throw new Error('Execution was cancelled');
            }

            // Prevent infinite loops
            if (visitedNodes.has(currentNode.id)) {
                throw new Error(`Circular dependency detected at node ${currentNode.id}`);
            }
            visitedNodes.add(currentNode.id);

            // Process current node based on type
            const startTime = Date.now();
            let nodeOutput: any;

            // Send node.start event for real-time animation
            try {
                await redisService.publish('node.start', {
                    executionId: execution.id,
                    nodeId: currentNode.id,
                    nodeType: currentNode.type,
                    nodeLabel: currentNode.data?.label,
                    startedAt: new Date().toISOString()
                });
            } catch (err) {
                console.warn('[ExecutionService] Failed to publish node.start event:', err);
            }

            try {
                nodeOutput = await this.processNode(currentNode, currentInput, workflow, execution);
                
                const duration = Date.now() - startTime;
                
                // Send node.end event with duration for real-time animation
                try {
                    await redisService.publish('node.end', {
                        executionId: execution.id,
                        nodeId: currentNode.id,
                        nodeType: currentNode.type,
                        nodeLabel: currentNode.data?.label,
                        status: 'completed',
                        duration: duration,
                        output: nodeOutput,
                        completedAt: new Date().toISOString()
                    });
                } catch (err) {
                    console.warn('[ExecutionService] Failed to publish node.end event:', err);
                }
                
                // Add trace entry with debug info and schema generation
                const traceEntry = {
                    nodeId: currentNode.id,
                    type: currentNode.type,
                    input: currentInput,
                    output: nodeOutput,
                    timestamp: new Date(),
                    duration: duration,
                    debugInfo: this.generateDebugInfo(currentInput, nodeOutput),
                };
                this.addSchemaToTraceEntry(traceEntry);
                await this.addTraceEntry(execution.id!, traceEntry, execution);

                // If this is an end node, we're done
                if (currentNode.type === 'end') {
                    return nodeOutput;
                }

                // Apply output mapping if configured
                let mappedOutput = nodeOutput;
                if (nodeOutput && currentNode.data) {
                    const outputMapping = currentNode.data.outputMapping || 'full';
                    const outputMappingPath = currentNode.data.outputMappingPath || 'json';

                    if (outputMapping !== 'full') {
                        mappedOutput = this.applyOutputMapping(nodeOutput, outputMapping, outputMappingPath);
                    }
                }

                // Move to next node
                // Special handling for ForEach nodes: execute loop body for each array item
                if (currentNode.type === 'foreach') {
                    // Extract array from foreach output
                    const foreachOutput = mappedOutput?.json || mappedOutput?.data || {};
                    const array = foreachOutput.results || foreachOutput.data || [];
                    
                    if (!Array.isArray(array) || array.length === 0) {
                        console.log(`[ExecutionService] ForEach node ${currentNode.id}: Empty array, skipping loop body`);
                    } else {
                        console.log(`[ExecutionService] ForEach node ${currentNode.id}: Executing loop body for ${array.length} items`);
                        
                        // Find loop edge (edge with sourceHandle === 'loop')
                        const loopEdge = workflow.edges.find((e: any) => 
                            e.source === currentNode.id && 
                            (e.sourceHandle === 'loop' || e.SourceHandle === 'loop')
                        );
                        
                        if (loopEdge) {
                            // Execute loop body for each array item
                            for (let index = 0; index < array.length; index++) {
                                const currentItem = array[index];
                                
                                // Create loop context input for loop body nodes
                                const loopContext = {
                                    current: currentItem,
                                    index: index,
                                    array: array,
                                };
                                
                                let loopInput = this.ensureNodeData({
                                    ...(currentInput?.json || {}),
                                    loop: loopContext,
                                    current: currentItem,
                                    index: index,
                                }, loopEdge.target, 'loop-body');
                                
                                // Execute loop body nodes
                                let loopBodyNode = workflow.nodes.find((n: any) => n.id === loopEdge.target);
                                if (!loopBodyNode) {
                                    throw new Error(`Loop body node ${loopEdge.target} not found`);
                                }
                                
                                // Track loop body execution
                                const loopBodyVisited = new Set<string>();
                                
                                while (loopBodyNode) {
                                    // Check for infinite loops in loop body
                                    if (loopBodyVisited.has(loopBodyNode.id)) {
                                        throw new Error(`Circular dependency detected in loop body at node ${loopBodyNode.id}`);
                                    }
                                    loopBodyVisited.add(loopBodyNode.id);
                                    
                                    // Process loop body node
                                    const loopBodyStartTime = Date.now();
                                    try {
                                        await redisService.publish('node.start', {
                                            executionId: execution.id,
                                            nodeId: loopBodyNode.id,
                                            nodeType: loopBodyNode.type,
                                            nodeLabel: loopBodyNode.data?.label,
                                            startedAt: new Date().toISOString()
                                        });
                                    } catch (err) {
                                        console.warn('[ExecutionService] Failed to publish node.start event:', err);
                                    }
                                    
                                    try {
                                        const loopBodyOutput = await this.processNode(loopBodyNode, loopInput, workflow, execution);
                                        const loopBodyDuration = Date.now() - loopBodyStartTime;
                                        
                                        try {
                                            await redisService.publish('node.end', {
                                                executionId: execution.id,
                                                nodeId: loopBodyNode.id,
                                                nodeType: loopBodyNode.type,
                                                nodeLabel: loopBodyNode.data?.label,
                                                status: 'completed',
                                                duration: loopBodyDuration,
                                                output: loopBodyOutput,
                                                completedAt: new Date().toISOString()
                                            });
                                        } catch (err) {
                                            console.warn('[ExecutionService] Failed to publish node.end event:', err);
                                        }
                                        
                                        // Add trace entry for loop body node
                                        const loopBodyTraceEntry = {
                                            nodeId: loopBodyNode.id,
                                            type: loopBodyNode.type,
                                            input: loopInput,
                                            output: loopBodyOutput,
                                            timestamp: new Date(),
                                            duration: loopBodyDuration,
                                            debugInfo: this.generateDebugInfo(loopInput, loopBodyOutput),
                                            _loopIteration: index,
                                            _loopNodeId: currentNode.id,
                                        };
                                        this.addSchemaToTraceEntry(loopBodyTraceEntry);
                                        await this.addTraceEntry(execution.id!, loopBodyTraceEntry, execution);
                                        
                                        // Find next node in loop body (look for back edge or next node)
                                        const backEdge = workflow.edges.find((e: any) => 
                                            e.source === loopBodyNode.id && 
                                            e.target === currentNode.id &&
                                            (e.targetHandle === 'back' || e.TargetHandle === 'back')
                                        );
                                        
                                        if (backEdge) {
                                            // Loop back to foreach node - iteration complete
                                            break;
                                        }
                                        
                                        // Find next node in loop body
                                        const nextLoopEdge = workflow.edges.find((e: any) => 
                                            e.source === loopBodyNode.id &&
                                            e.target !== currentNode.id // Don't go back to foreach yet
                                        );
                                        
                                        if (!nextLoopEdge) {
                                            // No more nodes in loop body, iteration complete
                                            break;
                                        }
                                        
                                        loopBodyNode = workflow.nodes.find((n: any) => n.id === nextLoopEdge.target);
                                        if (!loopBodyNode) {
                                            throw new Error(`Next loop body node ${nextLoopEdge.target} not found`);
                                        }
                                        
                                        loopInput = this.ensureNodeData(loopBodyOutput, loopBodyNode.id, loopBodyNode.type);
                                        
                                    } catch (error: any) {
                                        const loopBodyDuration = Date.now() - loopBodyStartTime;
                                        
                                        try {
                                            await redisService.publish('node.end', {
                                                executionId: execution.id,
                                                nodeId: loopBodyNode.id,
                                                nodeType: loopBodyNode.type,
                                                nodeLabel: loopBodyNode.data?.label,
                                                status: 'failed',
                                                duration: loopBodyDuration,
                                                error: error.message,
                                                completedAt: new Date().toISOString()
                                            });
                                        } catch (err) {
                                            console.warn('[ExecutionService] Failed to publish node.end event (error):', err);
                                        }
                                        
                                        const errorNodeData = createErrorNodeData(
                                            error.message,
                                            loopBodyNode.id,
                                            loopBodyNode.type,
                                            'EXECUTION_ERROR',
                                            { originalError: error.toString() }
                                        );
                                        
                                        const errorTraceEntry = {
                                            nodeId: loopBodyNode.id,
                                            type: loopBodyNode.type,
                                            input: loopInput,
                                            output: errorNodeData,
                                            error: error.message,
                                            timestamp: new Date(),
                                            duration: loopBodyDuration,
                                            _loopIteration: index,
                                            _loopNodeId: currentNode.id,
                                        };
                                        this.addSchemaToTraceEntry(errorTraceEntry);
                                        await this.addTraceEntry(execution.id!, errorTraceEntry, execution);
                                        throw error;
                                    }
                                }
                            }
                        } else {
                            console.warn(`[ExecutionService] ForEach node ${currentNode.id}: No loop edge found, skipping loop body`);
                        }
                    }
                }
                
                // Special handling for If-Else nodes: choose branch based on condition result
                let nextEdge: any;
                if (currentNode.type === 'ifelse') {
                    // Extract condition result from node output
                    const conditionResult = mappedOutput?.json?.result ?? mappedOutput?.result ?? false;
                    const targetHandle = conditionResult ? 'true' : 'false';
                    
                    // Find edge with matching sourceHandle
                    nextEdge = workflow.edges.find((e: any) => 
                        e.source === currentNode.id && 
                        (e.sourceHandle === targetHandle || e.SourceHandle === targetHandle)
                    );
                    
                    if (!nextEdge) {
                        // No matching branch found, return current output
                        console.warn(`[ExecutionService] If-Else node ${currentNode.id}: No ${targetHandle} branch found`);
                        return mappedOutput;
                    }
                } else if (currentNode.type === 'foreach') {
                    // For foreach nodes, skip the loop edge and find the normal output edge
                    nextEdge = workflow.edges.find((e: any) => 
                        e.source === currentNode.id && 
                        e.sourceHandle !== 'loop' && 
                        e.SourceHandle !== 'loop'
                    );
                } else {
                    // For other nodes, find first outgoing edge
                    nextEdge = workflow.edges.find((e: any) => e.source === currentNode.id);
                }
                
                if (!nextEdge) {
                    // No more nodes, return current output
                    return mappedOutput;
                }

                const nextNode = workflow.nodes.find((n: any) => n.id === nextEdge.target);
                if (!nextNode) {
                    throw new Error(`Next node ${nextEdge.target} not found`);
                }

                currentNode = nextNode;
                // Ensure currentInput is NodeData for next iteration
                currentInput = this.ensureNodeData(mappedOutput, currentNode.id, currentNode.type);

            } catch (error: any) {
                const duration = Date.now() - startTime;
                
                // Send node.end event with error for real-time animation
                try {
                    await redisService.publish('node.end', {
                        executionId: execution.id,
                        nodeId: currentNode.id,
                        nodeType: currentNode.type,
                        nodeLabel: currentNode.data?.label,
                        status: 'failed',
                        duration: duration,
                        error: error.message,
                        completedAt: new Date().toISOString()
                    });
                } catch (err) {
                    console.warn('[ExecutionService] Failed to publish node.end event (error):', err);
                }
                
                // STANDARDIZED: Create error NodeData for trace
                const errorNodeData = createErrorNodeData(
                    error.message,
                    currentNode.id,
                    currentNode.type,
                    'EXECUTION_ERROR',
                    { originalError: error.toString() }
                );
                
                // Add error trace with schema generation
                const errorTraceEntry = {
                    nodeId: currentNode.id,
                    type: currentNode.type,
                    input: currentInput,
                    output: errorNodeData, // ← NodeData mit Error, nicht null!
                    error: error.message,
                    timestamp: new Date(),
                    duration: duration,
                };
                this.addSchemaToTraceEntry(errorTraceEntry);
                await this.addTraceEntry(execution.id!, errorTraceEntry, execution);
                await this.flushTraceUpdate(execution.id!, execution); // Flush before error
                throw error;
            }
        }

        return currentInput;
    }

    /**
     * Generate schema from NodeData and add to trace entry
     * Implements dynamic schema generation approach
     */
    private addSchemaToTraceEntry(traceEntry: any): void {
        try {
            // Generate schema from output data
            if (traceEntry.output) {
                traceEntry.outputSchema = generateSchemaFromNodeData(traceEntry.output);
            }
            
            // Also generate schema from input data
            if (traceEntry.input) {
                traceEntry.inputSchema = generateSchemaFromNodeData(traceEntry.input);
            }
        } catch (error: any) {
            // Don't fail execution if schema generation fails
            console.warn(`[ExecutionService] Failed to generate schema for trace entry ${traceEntry.nodeId}:`, error);
        }
    }

    /**
     * Public method to execute a single node directly (for testing/debugging)
     */
    async processNodeDirectly(node: any, input: any, workflow: any, execution: Execution): Promise<any> {
        return await this.processNode(node, input, workflow, execution);
    }

    /**
     * Central node router - dispatches to specific processor based on node type
     * Uses registry system for automatic node type discovery
     * Now supports standardized NodeData flow
     */
    private async processNode(node: any, input: any, workflow: any, execution: Execution): Promise<any> {
        const nodeData = node.data || {};
        const nodeType = node.type;

        // Convert input to NodeData if not already
        const inputNodeData = this.convertToNodeData(input, node.id, nodeType);

        // Special handling for agent nodes (complex logic)
        if (nodeType === 'agent') {
            const result = await this.processAgentNode(node, input, workflow, execution);
            return this.convertToNodeData(result, node.id, nodeType, inputNodeData?.metadata.nodeId);
        }

        // Try to get processor from registry
        const processor = getNodeProcessor(nodeType);
        if (processor) {
            // Debug logging for end nodes
            if (nodeType === 'end') {
                console.log(`[ExecutionService] 🔍 Processing End Node: ${node.id}`);
                console.log(`[ExecutionService] 🔍 node.data:`, JSON.stringify(node.data, null, 2));
                console.log(`[ExecutionService] 🔍 node.data?.result:`, node.data?.result);
            }
            
            const secrets = this.normalizeSecrets(workflow?.secrets);
            const context = {
                workflow,
                node,
                execution,
                secrets,
                input, // Legacy support
                nodeData: inputNodeData, // New standardized input
            };
            
            try {
                // Validate input schema if defined
                // Skip validation for scheduled executions (check execution.input._metadata or input._metadata)
                const isScheduledExecution = execution?.input?._metadata?.source === 'scheduler' || 
                                             execution?.input?._metadata?.skipSchemaValidation === true ||
                                             input?._metadata?.source === 'scheduler' ||
                                             input?._metadata?.skipSchemaValidation === true;
                
                const inputSchema = this.getInputSchemaForNode(node, nodeType);
                if (inputSchema && inputNodeData && !isScheduledExecution) {
                    const validationResult = this.validateNodeData(inputNodeData, inputSchema);
                    if (!validationResult.valid) {
                        console.warn(`[ExecutionService] Input validation failed for node ${node.id} (${nodeType}):`, validationResult.errors);
                        return createErrorNodeData(
                            `Input validation failed: ${validationResult.errors?.join(', ')}`,
                            node.id,
                            nodeType,
                            'VALIDATION_ERROR'
                        );
                    }
                } else if (inputSchema && isScheduledExecution) {
                    console.log(`[ExecutionService] Skipping schema validation for node ${node.id} (${nodeType}) - scheduled execution`);
                }

                // Try new processNodeData method first
                if (processor.processNodeData) {
                    const result = await processor.processNodeData(node, inputNodeData, context);
                    // Return full NodeData (not just data) for proper flow
                    const finalResult = result ?? inputNodeData;
                    
                    // Validate output schema if defined
                    const outputSchema = this.getOutputSchemaForNode(node, nodeType);
                    if (outputSchema && finalResult) {
                        const validationResult = this.validateNodeData(finalResult, outputSchema);
                        if (!validationResult.valid) {
                            console.warn(`[ExecutionService] Output validation failed for node ${node.id} (${nodeType}):`, validationResult.errors);
                            // Add warning but don't fail - output validation is informational
                            finalResult.error = {
                                message: `Output validation warning: ${validationResult.errors?.join(', ')}`,
                                code: 'OUTPUT_VALIDATION_WARNING',
                                details: { errors: validationResult.errors }
                            };
                        }
                    }
                    
                    return finalResult; // Return NodeData or fallback to input
                }
                
                // Fallback to legacy process method
                if (processor.process) {
                    const result = await processor.process(node, input, context);
                    // Convert result to NodeData for consistency
                    return this.convertToNodeData(result, node.id, nodeType, inputNodeData?.metadata.nodeId);
                }
                
                throw new Error(`Processor ${processor.name} has neither processNodeData nor process method`);
            } catch (error: any) {
                console.error(`[ExecutionService] Error processing node ${node.id} with processor ${processor.name}:`, error);
                throw error;
            }
        }

        // Fallback: warn and pass through
        console.warn(`[ExecutionService] No processor found for node type: ${nodeType}, passing through input`);
        return input;
    }

    /**
     * Normalize agent outputs so expressions work everywhere
     * Uses json as the only field
     * Flattens the structure to avoid nested data.data
     * 
     * Strategy: Extract actual data content and create a clean, flat structure
     * If response is a string, return it directly. Otherwise, return a clean object without nested data.
     */
    private normalizeAgentOutput(agentOutput: any): any {
        if (agentOutput && typeof agentOutput === 'object') {
            if (Array.isArray(agentOutput)) {
                return agentOutput;  // Return array directly
            }

            // Extract the actual data content
            // Priority: response (if string) > clean object (without nested data) > entire object
            let actualData: any = agentOutput;
            
            // If it has a 'response' field and it's a string, use that directly (most common case)
            if ('response' in agentOutput && typeof agentOutput.response === 'string') {
                return agentOutput.response;  // Return string directly
            }
            // If response is an object, use it but clean it
            else if ('response' in agentOutput && agentOutput.response != null) {
                actualData = agentOutput.response;
            }
            // If it has a 'json' field, use that
            else if ('json' in agentOutput && agentOutput.json != null) {
                actualData = agentOutput.json;
            }
            // Unwrap nested data structures: { data: "..." } or { data: { data: "..." } }
            else if ('data' in agentOutput) {
                if (typeof agentOutput.data === 'string') {
                    // Direct string: { data: "response text" }
                    return agentOutput.data;  // Return string directly
                } else if (typeof agentOutput.data === 'object' && agentOutput.data !== null) {
                    // Object: check for nested data
                    if ('data' in agentOutput.data && typeof agentOutput.data.data === 'string') {
                        // Nested: { data: { data: "..." } } -> extract the inner data
                        return agentOutput.data.data;  // Return string directly
                    } else if ('response' in agentOutput.data && typeof agentOutput.data.response === 'string') {
                        // { data: { response: "..." } } -> extract response
                        return agentOutput.data.response;  // Return string directly
                    } else {
                        // Object with other fields: use the object itself but remove nested data
                        const { data: nestedData, ...rest } = agentOutput.data;
                        actualData = { ...rest };
                        // If nestedData has a string value, prefer that
                        if (typeof nestedData === 'string') {
                            return nestedData;  // Return string directly
                        }
                    }
                } else {
                    actualData = agentOutput.data;
                }
            }
            // If it has 'raw' field and it's a string, use that
            else if ('raw' in agentOutput && typeof agentOutput.raw === 'string') {
                return agentOutput.raw;  // Return string directly
            }
            else if ('raw' in agentOutput && agentOutput.raw != null) {
                actualData = agentOutput.raw;
            }
            // Otherwise, use the entire object but clean it up (remove nested data fields)
            else {
                // Remove nested 'data' fields to avoid confusion
                const { data: nestedData, ...rest } = agentOutput;
                actualData = { ...rest };
            }

            // If actualData is still an object, clean it up by removing nested data fields
            if (typeof actualData === 'object' && actualData !== null && !Array.isArray(actualData)) {
                const { data: nestedData, ...cleanedData } = actualData;
                // If nestedData is a string, prefer it; otherwise use cleaned object
                if (typeof nestedData === 'string') {
                    return nestedData;
                }
                // Return cleaned object (without nested data field)
                return cleanedData;
            }

            // Return the actual data directly (will be wrapped in NodeData.json by createNodeData)
            return actualData;
        }

        // Primitive value (string, number, etc.) - return directly
        return agentOutput ?? '';
    }

    /**
     * Helper: Convert any input to NodeData format
     * Uses json as the only field
     */
    private convertToNodeData(
        data: any,
        nodeId: string,
        nodeType: string,
        previousNodeId?: string
    ): NodeData {
        // If already NodeData, ensure it has json field
        if (data && typeof data === 'object' && 'metadata' in data) {
            // Ensure json field exists
            if (!('json' in data)) {
                // If it has old 'data' field, migrate it to 'json'
                if ('data' in data) {
                    data.json = data.data;
                    delete data.data; // Remove old field
                } else {
                    data.json = null;
                }
            }
            return data as NodeData;
        }

        // If data is a normalized object (has json field but no metadata),
        // extract the actual data to avoid double-wrapping
        if (data && typeof data === 'object' && !Array.isArray(data) && 'json' in data && !('metadata' in data)) {
            // Extract the actual data from json field
            const actualData = data.json ?? data;
            // Import createNodeData helper (now only sets json)
            const { createNodeData } = require('../models/nodeData');
            return createNodeData(actualData, nodeId, nodeType, previousNodeId);
        }

        // Import createNodeData helper (now only sets json)
        const { createNodeData } = require('../models/nodeData');
        return createNodeData(data, nodeId, nodeType, previousNodeId);
    }

    /**
     * Helper: Ensure data is NodeData format
     */
    private ensureNodeData(
        data: any,
        nodeId: string,
        nodeType: string
    ): NodeData {
        return this.convertToNodeData(data, nodeId, nodeType);
    }

    /**
     * Get input schema for node (from registry or node config)
     */
    private getInputSchemaForNode(node: any, nodeType: string): any {
        // Priority 1: Node-specific schema (from node.data.inputSchema)
        if (node.data?.inputSchema) {
            return typeof node.data.inputSchema === 'string' 
                ? JSON.parse(node.data.inputSchema) 
                : node.data.inputSchema;
        }

        // Priority 2: Registry schema (from shared/registry.json)
        const schemaJson = getInputSchemaJson(nodeType);
        return schemaJson ? JSON.parse(schemaJson) : null;
    }

    /**
     * Get output schema for node (from registry or node config)
     */
    private getOutputSchemaForNode(node: any, nodeType: string): any {
        // Priority 1: Node-specific schema (from node.data.outputSchema)
        if (node.data?.outputSchema) {
            return typeof node.data.outputSchema === 'string' 
                ? JSON.parse(node.data.outputSchema) 
                : node.data.outputSchema;
        }

        // Priority 2: Registry schema (from shared/registry.json)
        const schemaJson = getOutputSchemaJson(nodeType);
        return schemaJson ? JSON.parse(schemaJson) : null;
    }

    /**
     * Validate NodeData against schema
     * Validates json field
     */
    private validateNodeData(nodeData: NodeData, schema: any): { valid: boolean; errors?: string[] } {
        try {
            // Use json field
            const dataToValidate = nodeData.json;
            return schemaValidationService.validate(schema, dataToValidate);
        } catch (error: any) {
            return {
                valid: false,
                errors: [error.message || 'Schema validation error']
            };
        }
    }

    // ========================================
    // LLM Node Processor (Standard OpenAI SDK)
    // ========================================
    private async processLLMNode(node: any, input: any, workflow: any): Promise<any> {
        const nodeData = node.data || {};
        const model = nodeData.model || 'gpt-4o';
        const instructions = nodeData.instructions || 'You are a helpful assistant.';

        const messages: any[] = [];

        // Add system message if instructions provided
        if (instructions) {
            messages.push({
                role: 'system',
                content: instructions,
            });
        }

        // Add user message
        messages.push({
            role: 'user',
            content: typeof input === 'string' ? input : JSON.stringify(input),
        });

        const openaiClient = this.createOpenAIClient(workflow, nodeData);

        const response = await openaiClient.chat.completions.create({
            model,
            messages,
        });

        return response.choices[0].message.content;
    }

    // ========================================
    // Agent Node Processor (Agents SDK)
    // ========================================
    private async processAgentNode(node: any, input: any, workflow: any, execution?: Execution): Promise<any> {
        const nodeData = node.data || {};
        
        // Build tools for this agent from connected nodes
        const agentTools = await this.buildToolsForAgent(node, workflow);
        
        // Validate input guardrails if configured
        if (nodeData.guardrails?.input) {
            const inputValidation = this.validateGuardrails(
                typeof input === 'string' ? input : JSON.stringify(input),
                nodeData.guardrails.input
            );
            if (!inputValidation.valid) {
                throw new Error(`Input guardrails validation failed: ${inputValidation.error}`);
            }
        }
        
        // Ensure OpenAI API key available
        const apiKey = this.ensureOpenAIEnvironment(workflow, nodeData);
        const normalizedSecrets = this.normalizeSecrets(workflow?.secrets);
        const availableSecretKeys = Object.keys(normalizedSecrets);
        const secretSnippet = apiKey ? `${apiKey.substring(0, Math.min(apiKey.length, 6))}...` : '(empty)';
        console.log(`[ExecutionService] Agent node ${node.id} - available secret keys: ${availableSecretKeys.join(', ') || 'none'}, selected key snippet: ${secretSnippet}`);

        // Resolve expressions in systemPrompt and userPrompt
        const expressionResolver = new ExpressionResolutionService();
        let resolvedSystemPrompt = nodeData.systemPrompt || nodeData.instructions || 'You are a helpful assistant.';
        let resolvedUserPrompt = nodeData.userPrompt || '';
        
        // Build expression context from execution
        if (execution) {
            const expressionContext = {
                steps: execution.trace.reduce((acc: any, step: any) => {
                    if (step.nodeId && step.nodeId !== node.id) {
                        acc[step.nodeId] = step.output || step;
                    }
                    return acc;
                }, {}),
                input: execution.input,
                secrets: normalizedSecrets,
            };
            
            // Resolve systemPrompt if it contains expressions
            if (typeof resolvedSystemPrompt === 'string' && resolvedSystemPrompt.includes('{{')) {
                const result = expressionResolver.resolveExpressions(
                    resolvedSystemPrompt,
                    expressionContext,
                    { execution, currentNodeId: node.id }
                );
                resolvedSystemPrompt = typeof result === 'string' ? result : result.result;
            }
            
            // Resolve userPrompt if it contains expressions
            if (typeof resolvedUserPrompt === 'string' && resolvedUserPrompt.includes('{{')) {
                console.log(`[Agent ${node.id}] 🔍 Resolving userPrompt expression: ${resolvedUserPrompt}`);
                console.log(`[Agent ${node.id}] 🔍 Available steps in trace:`, Object.keys(expressionContext.steps));
                console.log(`[Agent ${node.id}] 🔍 Steps data:`, JSON.stringify(Object.keys(expressionContext.steps).reduce((acc: any, key) => {
                    acc[key] = expressionContext.steps[key] ? 'has data' : 'no data';
                    return acc;
                }, {}), null, 2));
                
                const result = expressionResolver.resolveExpressions(
                    resolvedUserPrompt,
                    expressionContext,
                    { execution, currentNodeId: node.id }
                );
                resolvedUserPrompt = typeof result === 'string' ? result : result.result;
                console.log(`[Agent ${node.id}] ✅ Resolved userPrompt: ${resolvedUserPrompt.substring(0, 200)}...`);
            }
        }

        // Prepare agent configuration
        const agentConfig: any = {
            name: nodeData.agentName || nodeData.label || node.id,
            instructions: resolvedSystemPrompt,
            model: nodeData.model || 'gpt-4o',
            tools: agentTools,
        };
        
        // Add temperature if specified
        if (nodeData.temperature !== undefined && nodeData.temperature !== null) {
            agentConfig.temperature = parseFloat(nodeData.temperature);
        }
        
        // Add reasoning effort if specified (GPT-5 feature)
        if (nodeData.reasoningEffort) {
            agentConfig.reasoningEffort = nodeData.reasoningEffort;
        }
        
        // Include chat history if enabled
        if (nodeData.includeChatHistory !== false) {
            // Get conversation history from context if available
            const conversationHistory = this.getConversationHistory(workflow, node.id);
            if (conversationHistory && conversationHistory.length > 0) {
                agentConfig.conversationHistory = conversationHistory;
            }
        }
        
        // Create agent with Agents SDK
        const openaiClient = this.createOpenAIClient(workflow, nodeData);
        console.log(`[ExecutionService] Running agent ${agentConfig.name} with model ${agentConfig.model}`);
        const agent = new Agent(agentConfig);

        // Prepare input - support structured input objects with userPrompt
        // Priority: userPrompt > prompt > message > query > text > input > messages array
        let agentInput = '';
        let contextSummary = '';

        if (typeof input === 'string') {
            agentInput = input.trim();
        } else if (input && typeof input === 'object') {
            // Check for userPrompt first (highest priority - from webhook or explicit)
            if (typeof input.userPrompt === 'string' && input.userPrompt.trim()) {
                agentInput = input.userPrompt.trim();
            } 
            // Then check for prompt
            else if (typeof input.prompt === 'string' && input.prompt.trim()) {
                agentInput = input.prompt.trim();
            }
            // Then check for common message fields (from webhook)
            else if (typeof input.message === 'string' && input.message.trim()) {
                agentInput = input.message.trim();
            }
            else if (typeof input.query === 'string' && input.query.trim()) {
                agentInput = input.query.trim();
            }
            else if (typeof input.text === 'string' && input.text.trim()) {
                agentInput = input.text.trim();
            }
            else if (typeof input.input === 'string' && input.input.trim()) {
                agentInput = input.input.trim();
            }
            // Then check for messages array
            else if (Array.isArray(input.messages)) {
                const userMessages = input.messages
                    .filter((m: any) => m && m.role === 'user' && typeof m.content === 'string')
                    .map((m: any) => m.content.trim())
                    .filter((m: string) => m.length > 0)
                    .join('\n');
                if (userMessages) {
                    agentInput = userMessages;
                }
            }

            try {
                contextSummary = JSON.stringify(input);
            } catch (err) {
                contextSummary = '';
            }
        }

        console.log(`[Agent ${node.id}] 🔍 agentInput after extraction: "${agentInput}"`);
        console.log(`[Agent ${node.id}] 🔍 resolvedUserPrompt: "${resolvedUserPrompt}"`);
        
        if ((!agentInput || agentInput.trim() === '') && resolvedUserPrompt) {
            const trimmedPrompt = resolvedUserPrompt.trim();
            if (trimmedPrompt) {
                console.log(`[Agent ${node.id}] ✅ Using resolvedUserPrompt as agentInput`);
                agentInput = trimmedPrompt;
            }
        }
        
        console.log(`[Agent ${node.id}] 🔍 Final agentInput: "${agentInput.substring(0, 200)}..."`);

        if ((!agentInput || agentInput.trim() === '') && contextSummary) {
            agentInput = contextSummary;
        }

        if (!agentInput || agentInput.trim() === '') {
            throw new Error('Agent user prompt is required. Provide a user prompt in the agent configuration or supply userPrompt in the node input.');
        }
        
        // Apply verbosity settings to logging
        const verbosity = nodeData.verbosity || 'medium';
        if (verbosity === 'high') {
            console.log(`[Agent ${node.id}] High verbosity: Detailed execution logging enabled`);
        }
        
        // Run agent with input
        let result: any;
        try {
            result = await run(agent, agentInput);
            
            // Log tool calls if present
            if (result.newItems) {
                const toolCalls = result.newItems.filter((item: any) => item.type === 'tool_call' || item.type === 'tool_call_item');
                if (toolCalls.length > 0) {
                    console.log(`[Agent ${node.id}] Tool calls made: ${toolCalls.length}`);
                    toolCalls.forEach((item: any, index: number) => {
                        const toolName = item.toolCall?.toolName || item.tool_name || 'unknown';
                        const toolInput = item.toolCall?.input || item.input || {};
                        const toolOutput = item.toolCall?.output || item.output || {};
                        console.log(`[Agent ${node.id}] Tool call ${index + 1}: ${toolName}`);
                        console.log(`[Agent ${node.id}] Tool input:`, JSON.stringify(toolInput).slice(0, 200));
                        console.log(`[Agent ${node.id}] Tool output:`, JSON.stringify(toolOutput).slice(0, 200));
                    });
                }
            }
            
            // Log any errors in result
            if (result.error) {
                console.error(`[Agent ${node.id}] Agent result contains error:`, result.error);
            }
            
        } catch (error: any) {
            console.error(`[Agent ${node.id}] Agent execution error:`, error.message, error.stack);
            // Check if we should continue on error
            if (nodeData.continueOnError === true) {
                console.warn(`Agent ${node.id} encountered error but continuing:`, error.message);
                return {
                    error: error.message,
                    partialOutput: null,
                    continued: true
                };
            }
            throw error;
        }

        // Format output if specified
        let finalOutput = result.finalOutput;
        if (nodeData.outputFormat) {
            finalOutput = this.formatOutput(finalOutput, nodeData.outputFormat);
        }
        
        // Generate summary if requested
        if (nodeData.summary && nodeData.summary !== 'manual') {
            finalOutput = this.addSummary(finalOutput, result, nodeData.summary, verbosity);
        }
        
        // Validate output guardrails if configured
        if (nodeData.guardrails?.output) {
            const outputValidation = this.validateGuardrails(
                typeof finalOutput === 'string' ? finalOutput : JSON.stringify(finalOutput),
                nodeData.guardrails.output
            );
            if (!outputValidation.valid) {
                throw new Error(`Output guardrails validation failed: ${outputValidation.error}`);
            }
        }

        // STANDARDIZED: Normalize final output so {{steps.agent.data.data}} works consistently
        // We always ensure there is a nested `data` property even for plain strings
        let normalizedData: any;
        if (typeof finalOutput === 'object' && finalOutput !== null) {
            if (Array.isArray(finalOutput)) {
                normalizedData = { data: finalOutput };
            } else {
                normalizedData = { ...finalOutput };
            }
        } else {
            normalizedData = { data: finalOutput };
        }

        // Ensure the normalizedData itself has a `data` property for legacy expressions
        if (!('data' in normalizedData)) {
            normalizedData.data = finalOutput;
        }

        // Return only the response string directly
        // This ensures normalizeAgentOutput receives a simple string, not a structured object
        const responseValue = typeof normalizedData === 'object' && normalizedData !== null && 'response' in normalizedData
            ? (normalizedData as any).response
            : finalOutput;
        
        // Always return the string value directly (will be wrapped in NodeData.json by createNodeData)
        return typeof responseValue === 'string' ? responseValue : (typeof finalOutput === 'string' ? finalOutput : JSON.stringify(finalOutput));
    }
    
    /**
     * Validate content against guardrails rules
     */
    private validateGuardrails(content: string, rules: string): { valid: boolean; error?: string } {
        // Simple validation - can be extended with more sophisticated rule parsing
        try {
            // Check for common validation rules
            if (rules.toLowerCase().includes('must be json')) {
                try {
                    JSON.parse(content);
                } catch {
                    return { valid: false, error: 'Output must be valid JSON' };
                }
            }
            
            if (rules.toLowerCase().includes('must not contain profanity')) {
                const profanityWords = ['badword1', 'badword2']; // Add actual profanity list
                const lowerContent = content.toLowerCase();
                for (const word of profanityWords) {
                    if (lowerContent.includes(word)) {
                        return { valid: false, error: 'Content contains prohibited words' };
                    }
                }
            }
            
            // Add more validation rules as needed
            return { valid: true };
        } catch (error: any) {
            return { valid: false, error: error.message };
        }
    }
    
    /**
     * Format output according to specified format
     */
    private formatOutput(output: any, format: string): any {
        switch (format.toLowerCase()) {
            case 'json':
                return typeof output === 'string' ? JSON.parse(output) : output;
            case 'text':
                return typeof output === 'string' ? output : JSON.stringify(output, null, 2);
            case 'string':
                return String(output);
            default:
                return output;
        }
    }
    
    /**
     * Get conversation history for agent
     */
    private getConversationHistory(workflow: any, nodeId: string): any[] {
        // TODO: Implement conversation history retrieval from execution context
        // For now, return empty array - this should be populated from previous executions
        return [];
    }
    
    /**
     * Add summary to output based on summary mode
     */
    private addSummary(output: any, result: any, summaryMode: string, verbosity: string): any {
        const summary: any = {
            output: output,
            summary: {
                mode: summaryMode,
                timestamp: new Date().toISOString(),
            }
        };
        
        if (summaryMode === 'auto' || summaryMode === 'detailed') {
            // Generate automatic summary
            const outputStr = typeof output === 'string' ? output : JSON.stringify(output);
            summary.summary.text = outputStr.length > 200 
                ? outputStr.substring(0, 200) + '...' 
                : outputStr;
            summary.summary.length = outputStr.length;
        }
        
        if (summaryMode === 'detailed') {
            // Add detailed information
            summary.summary.details = {
                toolCalls: result.toolCalls || [],
                steps: result.steps || [],
                verbosity: verbosity
            };
        }
        
        return summary;
    }


    // ========================================
    // Legacy Methods (keep for Agent Node tools)
    // ========================================

    private async buildAgentsFromWorkflow(workflow: any): Promise<Agent[]> {
        const agents: Agent[] = [];

        // Find all agent nodes
        const agentNodes = workflow.nodes.filter((n: any) => n.type === 'agent');

        for (const node of agentNodes) {
            const agentData = node.data || {};
            this.ensureOpenAIEnvironment(workflow, agentData);
            
            // Build tools for this agent
            const agentTools = await this.buildToolsForAgent(node, workflow);
            
            const agent = new Agent({
                name: agentData.label || node.id,
                instructions: agentData.instructions || 'You are a helpful assistant.',
                model: agentData.model || 'gpt-4o',
                tools: agentTools,
            });

            agents.push(agent);
        }

        return agents;
    }

    /**
     * Build orchestrator instructions based on workflow structure
     */
    private buildOrchestratorInstructions(workflow: any): string {
        const agentNames = workflow.nodes
            .filter((n: any) => n.type === 'agent')
            .map((n: any) => n.data?.label || n.id);
        
        const toolNames = workflow.nodes
            .filter((n: any) => n.type?.startsWith('tool-'))
            .map((n: any) => n.data?.label || n.type);

        return `You are the orchestrator for the "${workflow.name}" workflow.

Available agents: ${agentNames.join(', ')}
Available tools: ${toolNames.join(', ')}

Workflow description: ${workflow.description || 'No description provided'}

Your job is to:
1. Understand the user's request
2. Coordinate between the available agents and tools
3. Ensure the workflow executes properly
4. Return the final result

Use the available agents and tools as needed to complete the task.`;
    }

    /**
     * Find nodes that come after agent nodes in the workflow
     * (nodes connected to agent output, but not tools)
     */
    private findNodesAfterAgent(workflow: any, agentNodes: any[]): any[] {
        const nodesAfterAgent: any[] = [];
        const agentNodeIds = new Set(agentNodes.map((n: any) => n.id));
        const toolHandles = new Set(['tool', 'tool-output', 'chat-model', 'memory']);
        
        // Find edges that start from agent nodes (but not tool edges)
        const edgesFromAgent = workflow.edges?.filter((e: any) => {
            return agentNodeIds.has(e.source) && 
                   !toolHandles.has(e.sourceHandle) && 
                   !toolHandles.has(e.targetHandle);
        }) || [];
        
        // Get target nodes
        const targetNodeIds = new Set<string>(edgesFromAgent.map((e: any) => e.target as string));
        
        // Build execution order starting from first target node
        const visited = new Set<string>();
        const queue: string[] = [...targetNodeIds];
        
        while (queue.length > 0) {
            const nodeId = queue.shift()!;
            if (visited.has(nodeId)) continue;
            visited.add(nodeId);
            
            const node = workflow.nodes.find((n: any) => n.id === nodeId);
            if (node && node.type !== 'agent' && node.type !== 'tool') {
                nodesAfterAgent.push(node);
                
                // Find next nodes
                const nextEdges = workflow.edges?.filter((e: any) => e.source === nodeId) || [];
                for (const edge of nextEdges) {
                    if (!visited.has(edge.target)) {
                        queue.push(edge.target);
                    }
                }
            }
        }
        
        return nodesAfterAgent;
    }

    /**
     * Convert Agents SDK trace to our execution format
     * STANDARDIZED: All trace entries now use NodeData format
     */
    private async convertAgentsSDKTraceToExecution(result: any, execution: Execution, workflow?: any): Promise<void> {
        console.log(`[ExecutionService] 🔍 convertAgentsSDKTraceToExecution: result.newItems=${result.newItems?.length || 0}`);
        
        if (!result.newItems || !Array.isArray(result.newItems)) {
            console.log(`[ExecutionService] ⚠️ No result.newItems found or not an array`);
            return;
        }

        // Track the last agent output for mapping to actual agent nodes
        let lastAgentOutput: any = null;
        const agentNodes = workflow?.nodes?.filter((n: any) => n.type === 'agent') || [];
        console.log(`[ExecutionService] 🔍 Found ${agentNodes.length} agent nodes in workflow`);

        // Debug: Log all item types
        console.log(`[ExecutionService] 🔍 All item types in result.newItems:`, result.newItems.map((item: any) => `${item.type}${item.message?.role ? ` (${item.message.role})` : ''}${item.toolCall?.toolName ? ` (${item.toolCall.toolName})` : ''}`).join(', '));
        
        let assistantMessageCount = 0;
        for (const item of result.newItems) {
            // Debug: Log each item
            console.log(`[ExecutionService] 🔍 Processing item: type=${item.type}, hasMessage=${!!item.message}, hasToolCall=${!!item.toolCall}`);
            
            if (item.type === 'message' && item.message) {
                // For assistant messages, this is the agent output
                if (item.message.role === 'assistant') {
                    assistantMessageCount++;
                    console.log(`[ExecutionService] 📨 Processing assistant message #${assistantMessageCount}`);
                    console.log('[ExecutionService] Raw item.message.content:', JSON.stringify(item.message.content, null, 2));
                    const normalizedAgentOutput = this.normalizeAgentOutput(item.message.content);
                    console.log('[ExecutionService] Normalized from item.message.content:', JSON.stringify(normalizedAgentOutput, null, 2));
                    lastAgentOutput = normalizedAgentOutput;
                    
                    // Map to actual agent node if we have one
                    const agentNodeId = agentNodes.length === 1 ? agentNodes[0].id : 'orchestrator';
                    console.log(`[ExecutionService] 📝 Creating trace entry for agent node: ${agentNodeId}`);
                    
                    // STANDARDIZED: Create NodeData for agent output
                    // Agent output is a string, wrap it in NodeData structure
                    const agentOutputNodeData = this.ensureNodeData(
                        normalizedAgentOutput,
                        agentNodeId,
                        'agent'
                    );
                    
                    await this.addTraceEntry(execution.id!, {
                        nodeId: agentNodeId,
                        type: 'agent',
                        input: undefined, // Input was the user prompt
                        output: agentOutputNodeData, // ← NodeData, nicht String!
                        response: normalizedAgentOutput, // Legacy alias (String/object)
                        timestamp: new Date(),
                        duration: 0,
                        agentName: agentNodes.length === 1 ? (agentNodes[0].data?.label || agentNodeId) : 'Orchestrator',
                    }, execution);
                    console.log(`[ExecutionService] ✅ Trace entry created for agent node ${agentNodeId}. Trace length now: ${execution.trace.length}`);
                } else if (item.message.role === 'user') {
                    // User message is the input
                    // STANDARDIZED: Create NodeData for user input
                    const userInputNodeData = this.ensureNodeData(
                        item.message.content,
                        'orchestrator',
                        'agent'
                    );
                    
                    await this.addTraceEntry(execution.id!, {
                        nodeId: 'orchestrator',
                        type: 'agent',
                        input: userInputNodeData, // ← NodeData, nicht String!
                        output: undefined,
                        timestamp: new Date(),
                        duration: 0,
                        agentName: 'Orchestrator',
                    }, execution);
                }
            } else if ((item.type === 'tool_call' || item.type === 'tool_call_item') && (item.toolCall || item.tool_call)) {
                // Handle both tool_call and tool_call_item formats
                const toolCall = item.toolCall || item.tool_call;
                const toolName = toolCall?.toolName || toolCall?.tool_name || toolCall?.name || 'unknown';
                const toolInput = toolCall?.input || toolCall?.arguments || {};
                const toolOutput = toolCall?.output || toolCall?.result || {};
                
                console.log(`[ExecutionService] 🔧 Processing tool call: ${toolName}`);
                console.log(`[ExecutionService] 🔧 Tool output:`, JSON.stringify(toolOutput, null, 2));
                
                // STANDARDIZED: Create NodeData for tool output
                const toolOutputNodeData = this.ensureNodeData(
                    toolOutput,
                    toolName,
                    'tool'
                );
                
                await this.addTraceEntry(execution.id!, {
                    nodeId: toolName,
                    type: 'tool',
                    input: toolInput,
                    output: toolOutputNodeData, // ← NodeData, nicht plain object!
                    timestamp: new Date(),
                    duration: 0,
                    toolCalls: [{
                        toolName: toolName,
                        input: toolInput,
                        output: toolOutput,
                    }],
                }, execution);
            }
        }
        
        console.log(`[ExecutionService] ✅ convertAgentsSDKTraceToExecution completed. Created ${execution.trace.length} trace entries`);
    }

    /**
     * Builds tools for an agent node by finding nodes connected to the agent's bottom input handles.
     * 
     * Architecture:
     * - Main input (left): Workflow data/user prompt
     * - Chat Model (bottom, handle: 'chat-model'): The LLM model to use
     * - Memory (bottom, handle: 'memory'): Optional memory/context storage
     * - Tool (bottom, handle: 'tool'): Tools the agent can use (can be multiple)
     * - Output (right): Final agent response
     * 
     * This method finds all nodes connected to the 'tool' handle and converts them to Agents SDK tools.
     * 
     * @param agentNode The agent node from the workflow
     * @param workflow The entire workflow object
     * @returns An array of tool definitions for the Agents SDK
     */
    private async buildToolsForAgent(agentNode: any, workflow: any): Promise<any[]> {
        let tools: any[] = [];

        console.log(`[AgentTools] Building tools for agent ${agentNode.id} (${agentNode.data?.label || agentNode.id})`);
        console.log(`[AgentTools] Workflow has ${workflow.edges?.length || 0} edges`);

        // Debug: Log all edges to see their structure
        if (workflow.edges && workflow.edges.length > 0) {
            console.log(`[AgentTools] All edges structure:`, JSON.stringify(workflow.edges.slice(0, 5), null, 2));
        }

        // Try both camelCase and PascalCase for targetHandle (C# uses PascalCase, JS uses camelCase)
        const toolEdges = workflow.edges.filter((e: any) => {
            const targetMatches = e.target === agentNode.id || e.Target === agentNode.id;
            const handleMatches = 
                e.targetHandle === 'tool' || 
                e.TargetHandle === 'tool' ||
                (e.targetHandle === undefined && e.TargetHandle === 'tool');
            
            return targetMatches && handleMatches;
        });

        console.log(`[AgentTools] Found ${toolEdges.length} tool edges for agent ${agentNode.id}`);
        toolEdges.forEach((edge: any, index: number) => {
            console.log(`[AgentTools] Tool edge ${index + 1}:`, {
                source: edge.source || edge.Source,
                target: edge.target || edge.Target,
                targetHandle: edge.targetHandle || edge.TargetHandle,
                sourceHandle: edge.sourceHandle || edge.SourceHandle,
                fullEdge: JSON.stringify(edge)
            });
        });

        for (const edge of toolEdges) {
            // Handle both camelCase and PascalCase
            const sourceId = edge.source || edge.Source;
            const toolNode = workflow.nodes.find((n: any) => (n.id || n.Id) === sourceId);
            if (!toolNode) {
                console.warn(`[AgentTools] Tool node ${sourceId} not found in workflow nodes`);
                console.warn(`[AgentTools] Available node IDs:`, workflow.nodes?.map((n: any) => n.id || n.Id).join(', ') || 'none');
                continue;
            }

            const nodeData = toolNode.data || {};
            const nodeType = (toolNode.type || toolNode.Type) === 'tool' ? (nodeData.toolId || nodeData.ToolId) : (toolNode.type || toolNode.Type);
            console.log(`[AgentTools] Processing tool node ${toolNode.id || toolNode.Id}:`, {
                type: toolNode.type || toolNode.Type,
                toolId: nodeData.toolId || nodeData.ToolId,
                nodeType,
                mcpHandlerId: nodeData.mcpHandlerId || nodeData.McpHandlerId,
                fullNodeData: JSON.stringify(nodeData).slice(0, 200)
            });
            
            if (!nodeType) {
                console.warn('[AgentTools] Tool node without type information encountered', {
                    toolNodeId: toolNode.id,
                    toolNodeType: toolNode.type,
                    toolNodeData: nodeData,
                });
                continue;
            }

            // Try to get tool creator from registry
            const toolCreator = getToolCreator(nodeType);
            let toolCreated = false;
            
            if (toolCreator) {
                const secrets = this.normalizeSecrets(workflow?.secrets);
                const context = {
                    workflow,
                    node: toolNode,
                    secrets,
                };
                
                try {
                    const createdTools = await toolCreator.create({ ...toolNode, data: nodeData }, context);
                    
                    // If null is returned, fall back to legacy implementation
                    if (createdTools === null) {
                        console.log(`[AgentTools] ToolCreator returned null for ${nodeType}, falling back to legacy implementation`);
                        // toolCreated remains false, will use switch statement
                    } else if (Array.isArray(createdTools)) {
                        tools = tools.concat(createdTools.filter(t => t !== null));
                        toolCreated = true;
                    } else if (createdTools !== undefined) {
                        tools.push(createdTools);
                        toolCreated = true;
                    }
                } catch (error: any) {
                    console.error(`[AgentTools] Error creating tool ${nodeType} for node ${toolNode.id}:`, error);
                    // Continue with other tools even if one fails
                }
            }
            
            // Fallback to legacy methods for backward compatibility
            // This allows gradual migration
            // Also handles cases where ToolCreator returns null or doesn't exist
            if (!toolCreated) {
            switch (nodeType) {
                case 'tool-client':
                    tools.push(this.createClientTool({ ...toolNode, data: nodeData }));
                    break;
                case 'tool-mcp-server': {
                    console.log(`[AgentTools] Creating MCP server tools for node ${toolNode.id} with handlerId=${nodeData.mcpHandlerId}`);
                    const mcpTools = await this.createMCPServerTools({ ...toolNode, data: nodeData }, workflow);
                    console.log(`[AgentTools] Created ${mcpTools.length} MCP tools for node ${toolNode.id}`);
                    tools = tools.concat(mcpTools);
                    break;
                }
                case 'tool-file-search':
                    tools.push(this.createFileSearchTool({ ...toolNode, data: nodeData }));
                    break;
                case 'tool-web-search': {
                    const webSearchTool = await this.createWebSearchTool({ ...toolNode, data: nodeData }, workflow);
                    if (webSearchTool) {
                        tools.push(webSearchTool);
                    }
                    break;
                }
                case 'tool-code-interpreter':
                    tools.push(this.createCodeInterpreterTool({ ...toolNode, data: nodeData }));
                    break;
                case 'tool-function':
                    tools.push(this.createFunctionTool({ ...toolNode, data: nodeData }, workflow));
                    break;
                case 'tool-custom':
                    tools.push(this.createCustomTool({ ...toolNode, data: nodeData }));
                    break;
                default:
                    console.warn('[AgentTools] Unsupported tool node type:', nodeType, {
                        toolNodeId: toolNode.id,
                        toolNodeData: nodeData,
                    });
                    break;
                }
            }
        }

        console.log(`[AgentTools] Total tools created for agent ${agentNode.id}: ${tools.length}`);
        if (tools.length > 0) {
            console.log(`[AgentTools] Tool names: ${tools.map((t: any) => t.name || 'unnamed').join(', ')}`);
        }

        return tools;
    }

    private createGenericTool(node: any) {
        const nodeData = node.data || {};
        
        return tool({
            name: nodeData.label?.toLowerCase().replace(/\s+/g, '_') || node.id,
            description: nodeData.description || 'Execute a custom tool',
            parameters: z.object({
                input: z.string().describe('Input for the tool'),
            }),
            execute: async ({ input }) => {
                // This would call the actual tool implementation
                return { result: `Tool ${node.id} executed with input: ${input}` };
            },
        });
    }


    private async createWebSearchTool(node: any, workflow: any) {
        const parametersSchema = z.object({
            query: z.string().describe('Search query to execute').nullish(),
            maxResults: z.number().int().min(1).max(20).nullish(),
            location: z.string().nullish(),
            providerId: z.string().describe('Override the configured web search provider').nullish(),
            filters: z
                .object({
                    allowedDomains: z.array(z.string()).min(1).max(20).nullish(),
                })
                .nullish(),
        });

        return tool({
            name: `web_search_${node.id}`,
            description: 'Search the web for information',
            parameters: parametersSchema,
            execute: async (args: any) => {
                const overrides = this.normalizeWebSearchArguments(args);
                const { response, handlerId } = await this.performWebSearch(node, workflow, overrides);

                return {
                    provider: handlerId,
                    query: response.query,
                    results: response.results,
                    message: `Web search executed using provider "${handlerId}"`,
                    raw: response.raw,
                };
            },
        });
    }

    private createDatabaseTool(node: any) {
        const nodeData = node.data || {};
        
        return tool({
            name: 'database_query',
            description: 'Execute a database query',
            parameters: z.object({
                query: z.string().describe('SQL query to execute'),
            }),
            execute: async ({ query }) => {
                // This would execute actual database query
                return { 
                    rows: [],
                    message: `Query executed: ${query}` 
                };
            },
        });
    }

    private createCodeInterpreterTool(node: any) {
        const nodeData = node.data || {};
        
        return tool({
            name: 'code_interpreter',
            description: 'Execute Python code',
            parameters: z.object({
                code: z.string().describe('Python code to execute'),
            }),
            execute: async ({ code }) => {
                // This would execute code in a sandbox
                return { 
                    output: 'Code execution not yet implemented',
                    error: null 
                };
            },
        });
    }

    // ========================================
    // Additional Tool Creators for All Node Types
    // ========================================

    private createLLMTool(node: any) {
        const nodeData = node.data || {};
        
        return tool({
            name: 'llm_call',
            description: 'Call a language model',
            parameters: z.object({
                prompt: z.string().describe('Prompt for the LLM'),
                model: z.string().optional(),
            }),
            execute: async ({ prompt, model = 'gpt-4o' }) => {
                // This would call the actual LLM
                return { 
                    response: `LLM response to: ${prompt}`,
                    model,
                    message: 'LLM call completed'
                };
            },
        });
    }

    private createImageGenerationTool(node: any) {
        const nodeData = node.data || {};
        
        return tool({
            name: 'image_generation',
            description: 'Generate an image using DALL-E',
            parameters: z.object({
                prompt: z.string().describe('Image generation prompt'),
                size: z.string().optional(),
            }),
            execute: async ({ prompt, size = '1024x1024' }) => {
                // This would call DALL-E
                return { 
                    imageUrl: `https://example.com/generated-image-${Date.now()}.png`,
                    prompt,
                    size,
                    message: 'Image generated successfully'
                };
            },
        });
    }

    private createTextToSpeechTool(node: any) {
        const nodeData = node.data || {};
        
        return tool({
            name: 'text_to_speech',
            description: 'Convert text to speech',
            parameters: z.object({
                text: z.string().describe('Text to convert to speech'),
                voice: z.string().optional(),
            }),
            execute: async ({ text, voice = 'alloy' }) => {
                // This would call TTS service
                return { 
                    audioUrl: `https://example.com/audio-${Date.now()}.mp3`,
                    text,
                    voice,
                    message: 'Text converted to speech'
                };
            },
        });
    }

    private createSpeechToTextTool(node: any) {
        const nodeData = node.data || {};
        
        return tool({
            name: 'speech_to_text',
            description: 'Convert speech to text',
            parameters: z.object({
                audioUrl: z.string().describe('URL of audio file to transcribe'),
            }),
            execute: async ({ audioUrl }) => {
                // This would call Whisper
                return { 
                    text: 'Transcribed text from audio',
                    audioUrl,
                    message: 'Speech converted to text'
                };
            },
        });
    }

    private createTransformTool(node: any) {
        const nodeData = node.data || {};
        
        return tool({
            name: 'data_transform',
            description: 'Transform data',
            parameters: z.object({
                data: z.any().describe('Data to transform'),
                transformType: z.string().optional(),
            }),
            execute: async ({ data, transformType = 'passthrough' }) => {
                // This would perform data transformation
                return { 
                    transformedData: data,
                    transformType,
                    message: 'Data transformation completed'
                };
            },
        });
    }

    private createEmailTool(node: any) {
        const nodeData = node.data || {};
        
        return tool({
            name: 'send_email',
            description: 'Send an email',
            parameters: z.object({
                to: z.string().describe('Recipient email address'),
                subject: z.string().describe('Email subject'),
                body: z.string().describe('Email body'),
            }),
            execute: async ({ to, subject, body }) => {
                // This would send the actual email
                return { 
                    messageId: `email-${Date.now()}`,
                    to,
                    subject,
                    message: 'Email sent successfully'
                };
            },
        });
    }

    private createFileSearchTool(node: any) {
        const nodeData = node.data || {};
        
        return tool({
            name: 'file_search',
            description: 'Search for files',
            parameters: z.object({
                query: z.string().describe('Search query for files'),
                path: z.string().optional(),
            }),
            execute: async ({ query, path = '/' }) => {
                // This would search for files
                return { 
                    files: [
                        { name: 'example.txt', path: '/example.txt', size: 1024 }
                    ],
                    query,
                    message: 'File search completed'
                };
            },
        });
    }


    private async createMCPServerTools(node: any, workflow: any): Promise<any[]> {
        const nodeData = node.data || {};
        const secrets = this.normalizeSecrets(workflow?.secrets);
        const handlerId = nodeData.mcpHandlerId || 'generic';
        
        console.log(`[MCP] Creating MCP server tools for node ${node.id}`);
        console.log(`[MCP] Handler ID: ${handlerId}`);
        console.log(`[MCP] Available secrets: ${Object.keys(secrets).join(', ') || 'none'}`);
        
        // OpenAI Connector IDs mapping
        const openaiConnectors: Record<string, { connectorId: string; serverLabel: string; allowedTools: string[] }> = {
            'openai-gmail': {
                connectorId: 'connector_gmail',
                serverLabel: 'gmail',
                allowedTools: ['batch_read_email', 'get_profile', 'get_recent_emails', 'read_email', 'search_email_ids', 'search_emails']
            },
            'openai-google-calendar': {
                connectorId: 'connector_google_calendar',
                serverLabel: 'google_calendar',
                allowedTools: ['create_event', 'list_events', 'get_event', 'update_event', 'delete_event']
            },
            'openai-google-drive': {
                connectorId: 'connector_google_drive',
                serverLabel: 'google_drive',
                allowedTools: ['create_file', 'read_file', 'update_file', 'delete_file', 'list_files', 'search_files']
            },
            'openai-outlook-email': {
                connectorId: 'connector_outlook_email',
                serverLabel: 'outlook_email',
                allowedTools: ['send_email', 'read_email', 'list_emails', 'search_emails']
            },
            'openai-outlook-calendar': {
                connectorId: 'connector_outlook_calendar',
                serverLabel: 'outlook_calendar',
                allowedTools: ['create_event', 'list_events', 'get_event', 'update_event', 'delete_event']
            },
            'openai-sharepoint': {
                connectorId: 'connector_sharepoint',
                serverLabel: 'sharepoint',
                allowedTools: ['list_sites', 'list_lists', 'list_items', 'create_item', 'update_item', 'delete_item']
            },
            'openai-teams': {
                connectorId: 'connector_teams',
                serverLabel: 'teams',
                allowedTools: ['send_message', 'list_channels', 'list_messages', 'create_channel']
            },
            'openai-dropbox': {
                connectorId: 'connector_dropbox',
                serverLabel: 'dropbox',
                allowedTools: ['upload_file', 'download_file', 'list_files', 'delete_file', 'search_files']
            },
            // Third-Party MCP Connectors
            'openai-box': {
                connectorId: 'connector_box',
                serverLabel: 'box',
                allowedTools: ['upload_file', 'download_file', 'list_files', 'delete_file', 'search_files', 'create_folder']
            },
            'openai-zapier': {
                connectorId: 'connector_zapier',
                serverLabel: 'zapier',
                allowedTools: ['trigger_zap', 'list_zaps', 'get_zap_status']
            },
            'openai-shopify': {
                connectorId: 'connector_shopify',
                serverLabel: 'shopify',
                allowedTools: ['get_products', 'create_product', 'update_product', 'get_orders', 'get_customers', 'create_order']
            },
            'openai-intercom': {
                connectorId: 'connector_intercom',
                serverLabel: 'intercom',
                allowedTools: ['list_conversations', 'get_conversation', 'create_conversation', 'list_contacts', 'get_contact']
            },
            'openai-stripe': {
                connectorId: 'connector_stripe',
                serverLabel: 'stripe',
                allowedTools: ['create_payment', 'get_payment', 'list_payments', 'create_customer', 'get_customer', 'list_customers']
            },
            'openai-plaid': {
                connectorId: 'connector_plaid',
                serverLabel: 'plaid',
                allowedTools: ['get_accounts', 'get_transactions', 'get_balance', 'exchange_public_token']
            },
            'openai-square': {
                connectorId: 'connector_square',
                serverLabel: 'square',
                allowedTools: ['create_payment', 'get_payment', 'list_payments', 'create_customer', 'get_customer']
            },
            'openai-cloudflare-browser': {
                connectorId: 'connector_cloudflare_browser',
                serverLabel: 'cloudflare_browser',
                allowedTools: ['browse_url', 'take_screenshot', 'extract_content']
            },
            'openai-hubspot': {
                connectorId: 'connector_hubspot',
                serverLabel: 'hubspot',
                allowedTools: ['get_contacts', 'create_contact', 'update_contact', 'get_deals', 'create_deal', 'update_deal']
            },
            'openai-pipedream': {
                connectorId: 'connector_pipedream',
                serverLabel: 'pipedream',
                allowedTools: ['trigger_workflow', 'get_workflow_status', 'list_workflows']
            },
            'openai-paypal': {
                connectorId: 'connector_paypal',
                serverLabel: 'paypal',
                allowedTools: ['create_payment', 'get_payment', 'list_payments', 'capture_payment']
            },
            'openai-deepwiki': {
                connectorId: 'connector_deepwiki',
                serverLabel: 'deepwiki',
                allowedTools: ['search', 'get_article', 'list_articles']
            },
        };

        // Check if this is an OpenAI Connector
        const connectorConfig = openaiConnectors[handlerId];
        if (connectorConfig) {
            console.log(`[MCP] Using OpenAI hosted MCP connector: ${connectorConfig.connectorId}`);
            
            // Get OAuth token from secrets
            let oauthToken: string | undefined;
            if (handlerId.startsWith('openai-gmail') || handlerId.startsWith('openai-google')) {
                oauthToken = secrets.google_oauth_token || secrets.GOOGLE_OAUTH_TOKEN;
            } else if (handlerId.startsWith('openai-outlook') || handlerId.startsWith('openai-sharepoint') || handlerId.startsWith('openai-teams')) {
                oauthToken = secrets.microsoft_oauth_token || secrets.MICROSOFT_OAUTH_TOKEN;
            } else if (handlerId.startsWith('openai-dropbox')) {
                oauthToken = secrets.dropbox_oauth_token || secrets.DROPBOX_OAUTH_TOKEN;
            } else if (handlerId.startsWith('openai-box')) {
                oauthToken = secrets.box_oauth_token || secrets.BOX_OAUTH_TOKEN;
            } else if (handlerId.startsWith('openai-zapier')) {
                oauthToken = secrets.zapier_api_key || secrets.ZAPIER_API_KEY;
            } else if (handlerId.startsWith('openai-shopify')) {
                oauthToken = secrets.shopify_access_token || secrets.SHOPIFY_ACCESS_TOKEN;
            } else if (handlerId.startsWith('openai-intercom')) {
                oauthToken = secrets.intercom_access_token || secrets.INTERCOM_ACCESS_TOKEN;
            } else if (handlerId.startsWith('openai-stripe')) {
                oauthToken = secrets.stripe_secret_key || secrets.STRIPE_SECRET_KEY;
            } else if (handlerId.startsWith('openai-plaid')) {
                // Plaid uses client_id and secret, we'll use secret as the token
                oauthToken = secrets.plaid_secret || secrets.PLAID_SECRET;
            } else if (handlerId.startsWith('openai-square')) {
                oauthToken = secrets.square_access_token || secrets.SQUARE_ACCESS_TOKEN;
            } else if (handlerId.startsWith('openai-cloudflare-browser')) {
                oauthToken = secrets.cloudflare_api_token || secrets.CLOUDFLARE_API_TOKEN;
            } else if (handlerId.startsWith('openai-hubspot')) {
                oauthToken = secrets.hubspot_api_key || secrets.HUBSPOT_API_KEY;
            } else if (handlerId.startsWith('openai-pipedream')) {
                oauthToken = secrets.pipedream_api_key || secrets.PIPEDREAM_API_KEY;
            } else if (handlerId.startsWith('openai-paypal')) {
                // PayPal uses client_id and secret, we'll use secret as the token
                oauthToken = secrets.paypal_secret || secrets.PAYPAL_SECRET;
            } else if (handlerId.startsWith('openai-deepwiki')) {
                oauthToken = secrets.deepwiki_api_key || secrets.DEEPWIKI_API_KEY;
            }

            if (!oauthToken) {
                console.error(`[MCP] OAuth token not found for connector ${connectorConfig.connectorId}`);
                return [];
            }

            // For OpenAI Connectors, always use 'never' to allow automatic tool execution
            // (regardless of node configuration)
            const requireApproval = 'never';
            
            console.log(`[MCP] Setting requireApproval to 'never' for OpenAI Connector ${connectorConfig.connectorId} (node config was: ${nodeData.requireApproval || 'not set'})`);
            
            try {
                const mcpTool = hostedMcpTool({
                    serverLabel: connectorConfig.serverLabel,
                    connectorId: connectorConfig.connectorId,
                    authorization: oauthToken,
                    allowedTools: connectorConfig.allowedTools,
                    requireApproval: 'never',
                });

                console.log(`[MCP] Successfully created hosted MCP tool for ${connectorConfig.connectorId}`);
                return [mcpTool];
            } catch (error: any) {
                console.error(`[MCP] Failed to create hosted MCP tool for ${connectorConfig.connectorId}:`, error.message);
                return [];
            }
        }

        // Fallback to custom MCP handler (for generic, openweathermap, email, etc.)
        const handler = getMcpHandler(handlerId);
        if (!handler) {
            console.warn(`[MCP] MCP handler with ID "${handlerId}" not found. Skipping tool node ${node.id}.`);
            return [];
        }

        try {
            console.log(`[MCP] Connecting to custom MCP handler "${handlerId}"...`);
            const connection = await handler.connect(nodeData, {
                workflow,
                node,
                secrets,
            });

            console.log(`[MCP] Listing tools from MCP handler "${handlerId}"...`);
            const remoteTools = await connection.listTools();
            console.log(`[MCP] Found ${remoteTools.length} tools from MCP handler "${handlerId}"`);
            
            const tools = remoteTools.map(remoteTool => {
                console.log(`[MCP] Creating tool: ${remoteTool.name} - ${remoteTool.description}`);
                return tool({
                    name: remoteTool.name,
                    description: remoteTool.description,
                    parameters: remoteTool.parameters,
                    execute: async (args: Record<string, any>) => {
                        console.log(`[MCP] Invoking tool ${remoteTool.name} with args:`, JSON.stringify(args));
                        return connection.invoke(remoteTool.name, args);
                    },
                });
            });
            
            console.log(`[MCP] Successfully created ${tools.length} tools for MCP node ${node.id}`);
            return tools;
        } catch (error: any) {
            console.error(`[MCP] Failed to connect or list tools for MCP node ${node.id} using handler "${handlerId}":`, error.message);
            console.error(`[MCP] Error stack:`, error.stack);
            // We return an empty array so a failing MCP server doesn't crash the whole workflow
            return [];
        }
    }


    private createMergeTool(node: any) {
        const nodeData = node.data || {};
        
        return tool({
            name: 'merge_data',
            description: 'Merge multiple data streams',
            parameters: z.object({
                inputs: z.array(z.any()).describe('Data inputs to merge'),
            }),
            execute: async ({ inputs }) => {
                // This would merge the inputs
                return { 
                    merged: inputs.flat(),
                    inputCount: inputs.length,
                    message: 'Data merge completed'
                };
            },
        });
    }

    private createUserApprovalTool(node: any) {
        const nodeData = node.data || {};
        
        return tool({
            name: 'user_approval',
            description: 'Request user approval',
            parameters: z.object({
                message: z.string().describe('Approval request message'),
                timeout: z.number().optional(),
            }),
            execute: async ({ message, timeout = 300000 }) => {
                // This would request user approval
                return { 
                    approved: true,
                    message: 'User approval received'
                };
            },
        });
    }

    private createSetStateTool(node: any) {
        const nodeData = node.data || {};
        
        return tool({
            name: 'set_state',
            description: 'Set workflow state',
            parameters: z.object({
                key: z.string().describe('State key'),
                value: z.any().describe('State value'),
            }),
            execute: async ({ key, value }) => {
                // This would set the state
                return { 
                    key,
                    value,
                    message: 'State updated successfully'
                };
            },
        });
    }


    private createFunctionTool(node: any, workflow: any) {
        const nodeData = node.data || {};
        const functionName = nodeData.functionName || `function_${node.id}`;
        const registryHandler = getFunctionHandler(functionName);
        const functionDescription = registryHandler?.description || nodeData.functionDescription || 'Custom function';
        const functionUrlRaw = nodeData.functionUrl;
        const secrets = this.normalizeSecrets(workflow?.secrets);
        const functionUrl = typeof functionUrlRaw === 'string' ? this.interpolateSecrets(functionUrlRaw.trim(), secrets) : '';
        const hasExternalEndpoint = !registryHandler && typeof functionUrl === 'string' && functionUrl.length > 0;

        let parametersSchema: any = null;
        if (registryHandler) {
            parametersSchema = registryHandler.parameters;
        } else if (typeof nodeData.functionParameters === 'string' && nodeData.functionParameters.trim()) {
            try {
                parametersSchema = JSON.parse(nodeData.functionParameters);
            } catch (error) {
                console.warn('[AgentTools] Failed to parse function parameters JSON – falling back to generic schema', {
                    nodeId: node.id,
                    error,
                });
            }
        } else if (nodeData.functionParameters && typeof nodeData.functionParameters === 'object') {
            parametersSchema = nodeData.functionParameters;
        }

        if (parametersSchema) {
            console.log('[FunctionTool] Parsed parameter schema', {
                nodeId: node.id,
                type: parametersSchema?.type,
                keys: Object.keys(parametersSchema || {}),
            });
        } else {
            console.log('[FunctionTool] No parameter schema provided', { nodeId: node.id });
        }

        const parsedZodParameters = this.buildZodObjectFromJsonSchema(parametersSchema);
        if (!parsedZodParameters) {
            console.warn('[FunctionTool] Falling back to generic payload schema', { nodeId: node.id });
        }

        const method = (typeof nodeData.functionMethod === 'string' && nodeData.functionMethod.trim()
            ? nodeData.functionMethod.trim().toUpperCase()
            : 'POST') as Method;

        const headers = this.parseFunctionHeaders(nodeData.functionHeaders, secrets);
        const timeoutMs = Math.min(
            Math.max(Number(nodeData.functionTimeout) || 0, 1000),
            120000
        ) || 15000;
        const forwardRawPayload = nodeData.functionForwardRawPayload === true;

        return tool({
            name: functionName,
            description: functionDescription,
            parameters: parsedZodParameters ?? z.object({
                payload: z.any().optional(),
            }),
            execute: async (args: Record<string, any> = {}) => {
                console.log('[FunctionTool] Arguments received', {
                    nodeId: node.id,
                    functionName,
                    argsKeys: Object.keys(args || {}),
                    argsPreview: (() => {
                        try {
                            return JSON.stringify(args, null, 2).slice(0, 500);
                        } catch (err) {
                            return '<unstringifiable>';
                        }
                    })(),
                });

                if (registryHandler) {
                    console.log('[FunctionTool] Executing registered handler', {
                        nodeId: node.id,
                        functionName,
                    });

                    return await registryHandler.execute(args, {
                        workflow,
                        node,
                        execution: undefined,
                        secrets,
                    });
                }

                if (!hasExternalEndpoint) {
                    console.log('[FunctionTool] No endpoint configured, returning arguments directly', {
                        nodeId: node.id,
                        functionName,
                    });

                    return {
                        message: `Function ${functionName} invoked without external endpoint.`,
                        arguments: args,
                        note: 'Configure an Endpoint URL in advanced settings to call an external service.',
                    };
                }

                const requestArgs = forwardRawPayload && typeof args === 'object' && args !== null && 'payload' in args
                    ? args.payload
                    : args;

                const axiosConfig: any = {
                    method,
                    url: functionUrl,
                    timeout: timeoutMs,
                    headers: {
                        ...(method === 'GET' || method === 'DELETE' ? {} : { 'Content-Type': 'application/json' }),
                        ...headers,
                    },
                    validateStatus: () => true,
                };

                if (method === 'GET' || method === 'DELETE') {
                    axiosConfig.params = requestArgs;
                } else {
                    axiosConfig.data = requestArgs;
                }

                console.log('[FunctionTool] HTTP request', {
                    functionName,
                    method,
                    url: axiosConfig.url,
                    hasParams: !!axiosConfig.params,
                    hasBody: !!axiosConfig.data,
                });

                const startedAt = Date.now();

                try {
                    const response = await axios(axiosConfig);

                    console.log('[FunctionTool] HTTP response', {
                        functionName,
                        status: response.status,
                        statusText: response.statusText,
                        dataPreview: (() => {
                            try {
                                return JSON.stringify(response.data).slice(0, 500);
                            } catch (err) {
                                return '<unstringifiable>';
                            }
                        })(),
                    });

                    if (response.status >= 400) {
                        const detail = typeof response.data === 'object'
                            ? JSON.stringify(response.data)
                            : response.data;
                        throw new Error(`Function ${functionName} failed with status ${response.status}: ${detail}`);
                    }

                    return {
                        message: `Function ${functionName} executed successfully.`,
                        status: response.status,
                        statusText: response.statusText,
                        data: response.data,
                        headers: response.headers,
                        durationMs: Date.now() - startedAt,
                    };
                } catch (error: any) {
                    if (axios.isAxiosError(error)) {
                        const axError = error as AxiosError;
                        const status = axError.response?.status;
                        console.error('[FunctionTool] HTTP request failed', {
                            functionName,
                            status,
                            statusText: axError.response?.statusText,
                            errorCode: axError.code,
                            message: axError.message,
                            dataPreview: (() => {
                                try {
                                    return JSON.stringify(axError.response?.data).slice(0, 500);
                                } catch (err) {
                                    return '<unstringifiable>';
                                }
                            })(),
                        });

                        const data = axError.response?.data;
                        const detail = typeof data === 'object'
                            ? JSON.stringify(data)
                            : data ?? axError.message;
                        throw new Error(`Function ${functionName} request error${status ? ` (${status})` : ''}: ${detail}`);
                    }

                    throw error;
                }
            },
        });
    }

    private buildZodObjectFromJsonSchema(schema: any): ZodObject<any> | null {
        if (!schema || typeof schema !== 'object') {
            return null;
        }

        if ((schema.type ?? 'object') !== 'object') {
            return null;
        }

        const properties = typeof schema.properties === 'object' ? schema.properties : {};
        const requiredFields = Array.isArray(schema.required) ? new Set<string>(schema.required) : new Set<string>();

        const shape: Record<string, ZodTypeAny> = {};
        for (const [key, value] of Object.entries(properties)) {
            const zodType = this.jsonSchemaNodeToZod(value);
            shape[key] = requiredFields.has(key)
                ? zodType
                : zodType.nullable().optional();
        }

        let zodObject = z.object(shape);

        if (schema.additionalProperties === true) {
            zodObject = zodObject.catchall(z.any());
        } else if (typeof schema.additionalProperties === 'object') {
            zodObject = zodObject.catchall(this.jsonSchemaNodeToZod(schema.additionalProperties));
        } else if (schema.additionalProperties !== false) {
            zodObject = zodObject.catchall(z.any());
        }

        return zodObject;
    }

    private jsonSchemaNodeToZod(schema: any): ZodTypeAny {
        if (!schema || typeof schema !== 'object') {
            return z.any();
        }

        if (Array.isArray(schema.enum) && schema.enum.length > 0) {
            const enumValues = schema.enum.map((value: any) => value?.toString() ?? value).filter((v: any) => v !== undefined);
            if (enumValues.length > 0) {
                try {
                    return z.enum(enumValues as [string, ...string[]]);
                } catch {
                    return z.any();
                }
            }
        }

        switch (schema.type) {
            case 'string':
                return z.string();
            case 'number':
                return z.number();
            case 'integer':
                return z.number().int();
            case 'boolean':
                return z.boolean();
            case 'array': {
                const itemSchema = Array.isArray(schema.items)
                    ? this.jsonSchemaNodeToZod(schema.items[0])
                    : this.jsonSchemaNodeToZod(schema.items);
                return z.array(itemSchema ?? z.any());
            }
            case 'object':
                return this.buildZodObjectFromJsonSchema(schema) ?? z.record(z.any());
            default:
                return z.any();
        }
    }

    private interpolateSecrets(value: string, secrets: Record<string, string>): string {
        if (typeof value !== 'string' || value.trim() === '') {
            return value;
        }

        return value.replace(/\{\{\s*secret:([a-zA-Z0-9_\-]+)\s*\}\}/g, (_, secretName: string) => {
            const resolved = secrets[secretName];
            return typeof resolved === 'string' ? resolved : '';
        });
    }

    private parseFunctionHeaders(headersConfig: any, secrets: Record<string, string>): Record<string, string> {
        if (!headersConfig) {
            return {};
        }

        const headers: Record<string, string> = {};

        const assignHeader = (key: string, value: any) => {
            if (!key) return;
            const normalizedKey = key.trim();
            if (!normalizedKey) return;
            if (value === undefined || value === null) return;
            const stringValue = this.interpolateSecrets(String(value), secrets);
            headers[normalizedKey] = stringValue;
        };

        if (typeof headersConfig === 'string') {
            const trimmed = headersConfig.trim();
            if (!trimmed) {
                return {};
            }

            try {
                const parsed = JSON.parse(trimmed);
                if (parsed && typeof parsed === 'object') {
                    for (const [key, value] of Object.entries(parsed)) {
                        assignHeader(key, value);
                    }
                    return headers;
                }
            } catch {
                // fall back to line-based parsing
            }

            const lines = trimmed.split(/\r?\n/);
            for (const line of lines) {
                const [key, ...rest] = line.split(':');
                if (!key) continue;
                const value = rest.join(':').trim();
                assignHeader(key, value);
            }

            return headers;
        }

        if (typeof headersConfig === 'object') {
            for (const [key, value] of Object.entries(headersConfig)) {
                assignHeader(key, value);
            }
        }

        return headers;
    }

    private createCustomTool(node: any) {
        const nodeData = node.data || {};

        return tool({
            name: nodeData.name || `custom_tool_${node.id}`,
            description: nodeData.description || 'Custom agent tool (requires custom handling)',
            parameters: z.object({
                payload: z.any().optional(),
            }),
            execute: async ({ payload }) => {
                console.warn('[AgentTools] Custom tool executed (stub). Implement custom behaviour.', {
                    nodeId: node.id,
                    payload,
                });
                return {
                    payload,
                    message: 'Custom tool executed (stub)',
                };
            },
        });
    }

    private createClientTool(node: any) {
        const nodeData = node.data || {};

        return tool({
            name: nodeData.name || 'client_tool',
            description: nodeData.description || 'Client-side tool hook (ChatKit)',
            parameters: z.object({
                action: z.string().optional(),
                data: z.any().optional(),
            }),
            execute: async ({ action, data }) => {
                console.warn('[AgentTools] Client tool executed (stub). Connect to ChatKit client tooling.', {
                    nodeId: node.id,
                    action,
                    data,
                });
                return {
                    action,
                    data,
                    message: 'Client tool executed (stub)',
                };
            },
        });
    }

    async getExecutionStatus(executionId: string): Promise<Execution | null> {
        return await executionStorageService.getExecution(executionId);
    }

    /**
     * Generate debug information for input/output data
     */
    private generateDebugInfo(input: any, output: any): any {
        return {
            inputSchema: this.analyzeDataStructure(input),
            outputSchema: this.analyzeDataStructure(output),
            inputPreview: this.createDataPreview(input),
            outputPreview: this.createDataPreview(output),
            dataType: this.getDataType(output),
            size: this.calculateDataSize(output),
        };
    }

    /**
     * Analyze data structure and return schema
     */
    private analyzeDataStructure(data: any): any {
        if (data === null || data === undefined) {
            return { type: 'null', value: data };
        }

        if (typeof data === 'string') {
            return { 
                type: 'string', 
                length: data.length,
                isJson: this.isValidJson(data),
                preview: data.substring(0, 100) + (data.length > 100 ? '...' : '')
            };
        }

        if (typeof data === 'number') {
            return { type: 'number', value: data };
        }

        if (typeof data === 'boolean') {
            return { type: 'boolean', value: data };
        }

        if (Array.isArray(data)) {
            return {
                type: 'array',
                length: data.length,
                itemTypes: data.map(item => typeof item),
                sample: data.slice(0, 3)
            };
        }

        if (typeof data === 'object') {
            const keys = Object.keys(data);
            return {
                type: 'object',
                keys: keys,
                keyCount: keys.length,
                sample: Object.fromEntries(
                    keys.slice(0, 5).map(key => [key, this.createDataPreview(data[key])])
                )
            };
        }

        return { type: 'unknown', value: data };
    }

    /**
     * Create a preview string of the data
     */
    private createDataPreview(data: any): string {
        if (data === null || data === undefined) {
            return String(data);
        }

        if (typeof data === 'string') {
            return data.length > 200 ? data.substring(0, 200) + '...' : data;
        }

        try {
            const jsonString = JSON.stringify(data, null, 2);
            return jsonString.length > 500 ? jsonString.substring(0, 500) + '...' : jsonString;
        } catch {
            return String(data).substring(0, 200);
        }
    }

    /**
     * Get data type as string
     */
    private getDataType(data: any): string {
        if (data === null) return 'null';
        if (data === undefined) return 'undefined';
        if (Array.isArray(data)) return 'array';
        return typeof data;
    }

    /**
     * Calculate approximate data size
     */
    private calculateDataSize(data: any): number {
        try {
            return JSON.stringify(data).length;
        } catch {
            return String(data).length;
        }
    }

    /**
     * Check if string is valid JSON
     */
    private isValidJson(str: string): boolean {
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    }

    async cancelExecution(executionId: string): Promise<boolean> {
        const execution = await executionStorageService.getExecution(executionId);
        if (!execution) {
            return false;
        }

        if (execution.status === 'running') {
            await executionStorageService.updateExecution(executionId, {
                status: 'failed',
                error: 'Cancelled by user',
                completedAt: new Date()
            });
            return true;
        }

        return false;
    }

    private normalizeWebSearchArguments(args: any): { query?: string; maxResults?: number; location?: string; handlerId?: string; filters?: { allowedDomains?: string[] } } {
        if (args == null) {
            return {};
        }

        if (typeof args === 'string') {
            return { query: args };
        }

        if (typeof args !== 'object') {
            return {};
        }

        const allowedDomains = this.extractAllowedDomains(args.allowedDomains ?? args.filters?.allowedDomains);

        return {
            query: typeof args.query === 'string' ? args.query : undefined,
            maxResults: args.maxResults != null ? Number(args.maxResults) : undefined,
            location: typeof args.location === 'string' ? args.location : undefined,
            handlerId: typeof args.providerId === 'string' ? args.providerId : undefined,
            filters: allowedDomains ? { allowedDomains } : undefined,
        };
    }

    private resolveWebSearchHandlerId(nodeData: any, overrideId?: string): string {
        const candidates = [
            overrideId,
            nodeData?.webSearchHandlerId,
            nodeData?.webSearchProviderId,
            nodeData?.providerId,
            nodeData?.searchProvider,
            nodeData?.provider,
        ];

        for (const candidate of candidates) {
            if (typeof candidate === 'string' && candidate.trim()) {
                return candidate.trim();
            }
        }

        return 'serper';
    }

    private extractAllowedDomains(value: any): string[] | undefined {
        if (!value) {
            return undefined;
        }

        if (Array.isArray(value)) {
            const domains = value
                .map(item => (typeof item === 'string' ? item.trim() : String(item).trim()))
                .filter(Boolean);
            return domains.length > 0 ? domains : undefined;
        }

        if (typeof value === 'string') {
            const domains = value
                .split(',')
                .map(part => part.trim())
                .filter(Boolean);
            return domains.length > 0 ? domains : undefined;
        }

        return undefined;
    }

    private async performWebSearch(node: any, workflow: any, overrides: { query?: string; maxResults?: number; location?: string; filters?: { allowedDomains?: string[] }; handlerId?: string }): Promise<{ handlerId: string; response: WebSearchResponse }> {
        const nodeData = node.data || {};
        const handlerIdCandidate = this.resolveWebSearchHandlerId(nodeData, overrides.handlerId);

        let handler = getWebSearchHandler(handlerIdCandidate);
        if (!handler && handlerIdCandidate !== 'serper') {
            handler = getWebSearchHandler('serper');
        }

        if (!handler) {
            throw new Error(`Web search handler "${handlerIdCandidate}" is not registered.`);
        }

        const secrets = this.normalizeSecrets(workflow?.secrets);
        const connection = await handler.connect(nodeData, {
            workflow,
            node,
            secrets,
        });

        const queryText =
            (typeof overrides.query === 'string' && overrides.query.trim()) ||
            (typeof nodeData.query === 'string' && nodeData.query.trim());

        if (!queryText) {
            throw new Error('Web search query is required. Provide a query in the node configuration or when invoking the tool.');
        }

        const maxResultsCandidate = overrides.maxResults ?? nodeData.maxResults ?? handler.defaultConfig?.maxResults;
        const allowedDomains = overrides.filters?.allowedDomains ?? this.extractAllowedDomains(nodeData.allowedDomains);

        const searchRequest: WebSearchQuery = {
            query: queryText,
        };

        if (maxResultsCandidate !== undefined) {
            const parsedMax = Number(maxResultsCandidate);
            if (!Number.isNaN(parsedMax) && parsedMax > 0) {
                searchRequest.maxResults = parsedMax;
            }
        }

        const locationCandidate = overrides.location ?? nodeData.location;
        if (typeof locationCandidate === 'string' && locationCandidate.trim()) {
            searchRequest.location = locationCandidate.trim();
        }

        if (allowedDomains && allowedDomains.length > 0) {
            searchRequest.filters = { allowedDomains };
        }

        try {
            const response = await connection.search(searchRequest);
            return { handlerId: handler.id, response };
        } finally {
            if (typeof connection.dispose === 'function') {
                await connection.dispose();
            }
        }
    }

    /**
     * Apply output mapping to transform NodeData before passing to next node
     */
    private applyOutputMapping(nodeData: NodeData, mappingMode: string, path?: string): NodeData {
        try {
            switch (mappingMode) {
                case 'extract_path':
                    if (path && nodeData.json != null) {
                        const extractedValue = this.resolveNodeDataPath(nodeData, path);
                        if (extractedValue != null) {
                            return {
                                ...nodeData,
                                json: extractedValue
                            };
                        }
                    }
                    break;

                case 'extract_data':
                    // Extract only the json field
                    return {
                        ...nodeData,
                        json: nodeData.json
                    };

                case 'full':
                default:
                    // Pass through full NodeData
                    return nodeData;
            }
        } catch (error: any) {
            console.warn(`[ExecutionService] Error applying output mapping:`, error);
        }

        return nodeData;
    }

    /**
     * Resolve a path in NodeData (supports json, metadata, etc.)
     */
    private resolveNodeDataPath(nodeData: NodeData, path: string): any {
        if (!path) return nodeData.json;
        if (path === 'json') return nodeData.json;
        if (path === 'metadata') return nodeData.metadata;

        // Resolve path in json
        if (nodeData.json && typeof nodeData.json === 'object') {
            return this.resolvePath(nodeData.json, path);
        }

        return null;
    }

    /**
     * Resolve a path in an object (e.g. "data.field" or "data[0]")
     */
    private resolvePath(obj: any, path: string): any {
        if (!obj || !path) return null;

        const parts = path.split('.');
        let current: any = obj;

        for (const part of parts) {
            if (current == null) return null;

            // Handle array access [0]
            if (part.includes('[') && part.includes(']')) {
                const arrayPart = part.substring(0, part.indexOf('['));
                const indexPart = part.substring(part.indexOf('[') + 1, part.indexOf(']'));
                const index = parseInt(indexPart, 10);

                if (current[arrayPart] && Array.isArray(current[arrayPart])) {
                    current = current[arrayPart][index];
                } else {
                    return null;
                }
            } else {
                current = current[part];
            }
        }

        return current;
    }
}

export const executionService = new ExecutionService();

