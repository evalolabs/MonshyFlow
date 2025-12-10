import { Request, Response } from 'express';
import { executionService } from '../services/executionService';
import { Execution, ExecutionRequest, TraceEntry } from '../models/execution';
import { generateSchemaFromNodeData } from '../utils/schemaGenerator';
import { redisService } from '../services/redisService';

export class ExecutionController {
    async executeWorkflow(req: Request, res: Response): Promise<void> {
        try {
            const { workflowId } = req.params;
            const request: ExecutionRequest = req.body;

            const execution = await executionService.executeWorkflow(workflowId, request);

            res.status(200).json({
                executionId: execution.id,
                status: execution.status,
                output: execution.output,
                trace: execution.trace, // Add trace to response
                executionTrace: execution.trace, // Also add as executionTrace for compatibility
            });
        } catch (error: any) {
            console.error('Error executing workflow:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async getExecutionStatus(req: Request, res: Response): Promise<void> {
        try {
            const { executionId } = req.params;
            const execution = await executionService.getExecutionStatus(executionId);

            if (!execution) {
                res.status(404).json({ error: 'Execution not found' });
                return;
            }

            res.status(200).json(execution);
        } catch (error: any) {
            console.error('Error getting execution status:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async cancelExecution(req: Request, res: Response): Promise<void> {
        try {
            const { executionId } = req.params;
            const cancelled = await executionService.cancelExecution(executionId);

            if (!cancelled) {
                res.status(404).json({ error: 'Execution not found or already completed' });
                return;
            }

            res.status(200).json({ message: 'Execution cancelled' });
        } catch (error: any) {
            console.error('Error cancelling execution:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Execute a node with full workflow context (for debug panel)
     * POST /api/execute/test-node-with-context
     * Body: { workflow: {...}, input: {...}, nodeId: "...", secrets: {...} }
     * Executes all previous nodes first, then the target node
     */
    async testNodeWithContext(req: Request, res: Response): Promise<void> {
        try {
            const { workflow, input, nodeId, secrets } = req.body;

            console.log('[ExecutionController] 📥 Received test-node-with-context request');
            console.log('   nodeId:', nodeId);
            console.log('   workflow present:', !!workflow);
            console.log('   workflow.nodes length:', workflow?.nodes?.length || 0);
            console.log('   input received:', JSON.stringify(input || {}));
            console.log('   input keys:', input ? Object.keys(input) : []);
            console.log('   input type:', typeof input);

            if (!workflow || !nodeId) {
                res.status(400).json({ error: 'workflow and nodeId are required' });
                return;
            }

            // Find the target node
            const targetNode = workflow.nodes?.find((n: any) => n && n.id === nodeId);
            if (!targetNode) {
                res.status(404).json({ 
                    error: 'Workflow node not found', 
                    nodeId,
                    availableNodes: workflow.nodes?.map((n: any) => n?.id).filter(Boolean)
                });
                return;
            }

            // Attach secrets to workflow
            if (secrets && typeof workflow === 'object' && workflow !== null) {
                workflow.secrets = secrets;
                console.log('[ExecutionController] 🔐 Attached secrets to workflow. Keys:', Object.keys(secrets));
            }

            // Find all nodes that come before the target node
            const previousNodes = this.findPreviousNodes(nodeId, workflow.nodes || [], workflow.edges || []);
            console.log(`[ExecutionController] Found ${previousNodes.length} previous nodes before ${nodeId}`);

            // Create execution context
            // Preserve _metadata from input for scheduled workflow detection
            const execution: Execution = {
                id: `test-${Date.now()}`,
                workflowId: workflow.id || 'test-workflow',
                status: 'running',
                input: input || {},
                output: null,
                trace: [],
                startedAt: new Date(),
            };

            // Log if _metadata is present for debugging
            if (input?._metadata) {
                console.log('[ExecutionController] 📅 Input contains _metadata:', JSON.stringify(input._metadata));
            }

            // Execute all previous nodes in order
            let currentInput: any = input || {};
            for (const prevNode of previousNodes) {
                console.log(`[ExecutionController] Executing previous node: ${prevNode.id} (${prevNode.type})`);
                try {
                    const startTime = Date.now();
                    
                    // Send node.start event for real-time animation
                    try {
                        console.log(`[ExecutionController] 📤 Publishing node.start event for node: ${prevNode.id} (${prevNode.type})`);
                        await redisService.publish('node.start', {
                            executionId: execution.id,
                            nodeId: prevNode.id,
                            nodeType: prevNode.type,
                            nodeLabel: prevNode.data?.label || prevNode.label,
                            startedAt: new Date().toISOString()
                        });
                        console.log(`[ExecutionController] ✅ Successfully published node.start event for node: ${prevNode.id}`);
                    } catch (err) {
                        console.error(`[ExecutionController] ❌ Failed to publish node.start event for node ${prevNode.id}:`, err);
                    }
                    
                    const nodeOutput = await executionService.processNodeDirectly(prevNode, currentInput, workflow, execution);
                    const duration = Date.now() - startTime;
                    
                    // Send node.end event with duration for real-time animation
                    try {
                        console.log(`[ExecutionController] 📤 Publishing node.end event for node: ${prevNode.id} (${prevNode.type}), duration: ${duration}ms`);
                        await redisService.publish('node.end', {
                            executionId: execution.id,
                            nodeId: prevNode.id,
                            nodeType: prevNode.type,
                            nodeLabel: prevNode.data?.label || prevNode.label,
                            status: 'completed',
                            duration: duration,
                            output: nodeOutput,
                            completedAt: new Date().toISOString()
                        });
                        console.log(`[ExecutionController] ✅ Successfully published node.end event for node: ${prevNode.id}`);
                    } catch (err) {
                        console.error(`[ExecutionController] ❌ Failed to publish node.end event for node ${prevNode.id}:`, err);
                    }
                    
                    // Add trace entry with schema generation
                    const traceEntry: TraceEntry = {
                        nodeId: prevNode.id,
                        type: prevNode.type,
                        input: currentInput,
                        output: nodeOutput,
                        timestamp: new Date(),
                        duration: duration,
                    };
                    // Generate schemas from input/output data
                    if (traceEntry.output) {
                        traceEntry.outputSchema = generateSchemaFromNodeData(traceEntry.output);
                    }
                    if (traceEntry.input) {
                        traceEntry.inputSchema = generateSchemaFromNodeData(traceEntry.input);
                    }
                    execution.trace.push(traceEntry);

                    // Use output as input for next node
                    currentInput = nodeOutput;
                } catch (error: any) {
                    console.error(`[ExecutionController] Error executing previous node ${prevNode.id}:`, error);
                    
                    // Send node.end event with error status
                    try {
                        await redisService.publish('node.end', {
                            executionId: execution.id,
                            nodeId: prevNode.id,
                            nodeType: prevNode.type,
                            nodeLabel: prevNode.data?.label || prevNode.label,
                            status: 'failed',
                            error: error.message,
                            completedAt: new Date().toISOString()
                        });
                    } catch (err) {
                        console.warn('[ExecutionController] Failed to publish node.end error event:', err);
                    }
                    
                    const errorTraceEntry: TraceEntry = {
                        nodeId: prevNode.id,
                        type: prevNode.type,
                        input: currentInput,
                        output: null,
                        error: error.message,
                        timestamp: new Date(),
                        duration: 0,
                    };
                    if (errorTraceEntry.input) {
                        errorTraceEntry.inputSchema = generateSchemaFromNodeData(errorTraceEntry.input);
                    }
                    execution.trace.push(errorTraceEntry);
                    throw error;
                }
            }

            // Execute target node
            console.log(`[ExecutionController] Executing target node: ${nodeId} (${targetNode.type})`);
            
            const startTime = Date.now();
            
            // Send node.start event for real-time animation
            try {
                console.log(`[ExecutionController] 📤 Publishing node.start event for target node: ${targetNode.id} (${targetNode.type})`);
                await redisService.publish('node.start', {
                    executionId: execution.id,
                    nodeId: targetNode.id,
                    nodeType: targetNode.type,
                    nodeLabel: targetNode.data?.label || targetNode.label,
                    startedAt: new Date().toISOString()
                });
                console.log(`[ExecutionController] ✅ Successfully published node.start event for target node: ${targetNode.id}`);
            } catch (err) {
                console.error(`[ExecutionController] ❌ Failed to publish node.start event for target node ${targetNode.id}:`, err);
            }
            
            const targetResult = await executionService.processNodeDirectly(targetNode, currentInput, workflow, execution);
            const duration = Date.now() - startTime;
            
            // Send node.end event with duration for real-time animation
            try {
                console.log(`[ExecutionController] 📤 Publishing node.end event for target node: ${targetNode.id} (${targetNode.type}), duration: ${duration}ms`);
                await redisService.publish('node.end', {
                    executionId: execution.id,
                    nodeId: targetNode.id,
                    nodeType: targetNode.type,
                    nodeLabel: targetNode.data?.label || targetNode.label,
                    status: 'completed',
                    duration: duration,
                    output: targetResult,
                    completedAt: new Date().toISOString()
                });
                console.log(`[ExecutionController] ✅ Successfully published node.end event for target node: ${targetNode.id}`);
            } catch (err) {
                console.error(`[ExecutionController] ❌ Failed to publish node.end event for target node ${targetNode.id}:`, err);
            }

            // Add trace entry for target node with schema generation
            const targetTraceEntry: TraceEntry = {
                nodeId: targetNode.id,
                type: targetNode.type,
                input: currentInput,
                output: targetResult,
                timestamp: new Date(),
                duration: duration,
            };
            // Generate schemas from input/output data
            if (targetTraceEntry.output) {
                targetTraceEntry.outputSchema = generateSchemaFromNodeData(targetTraceEntry.output);
            }
            if (targetTraceEntry.input) {
                targetTraceEntry.inputSchema = generateSchemaFromNodeData(targetTraceEntry.input);
            }
            execution.trace.push(targetTraceEntry);

            execution.status = 'completed';
            execution.output = targetResult;
            execution.completedAt = new Date();

            // Build response similar to C# TestNodeWithContext
            const previousOutputs = execution.trace
                .filter((t: any) => t.nodeId !== nodeId)
                .map((t: any) => ({
                    nodeId: t.nodeId,
                    nodeType: t.type,
                    label: workflow.nodes?.find((n: any) => n.id === t.nodeId)?.label || t.type,
                    output: t.output,
                }));

            res.status(200).json({
                success: true,
                nodeId: nodeId,
                nodeType: targetNode.type,
                output: targetResult,
                previousOutputs,
                execution: {
                    id: execution.id,
                    status: execution.status,
                    trace: execution.trace,
                },
                timestamp: new Date().toISOString(),
            });
        } catch (error: any) {
            console.error('[ExecutionController] Error in test-node-with-context:', error);
            res.status(500).json({ 
                success: false,
                error: error.message, 
                stack: error.stack 
            });
        }
    }

    /**
     * Find all nodes that come before the target node in the workflow (in execution order)
     * Matches C# implementation: builds reverse graph, BFS backwards, then reverses
     */
    private findPreviousNodes(targetNodeId: string, nodes: any[], edges: any[]): any[] {
        const result: any[] = [];
        const visited = new Set<string>();

        // Build a reverse graph (target -> sources)
        const reverseGraph = new Map<string, string[]>();
        for (const edge of edges) {
            if (!reverseGraph.has(edge.target)) {
                reverseGraph.set(edge.target, []);
            }
            reverseGraph.get(edge.target)!.push(edge.source);
        }

        // BFS to find all previous nodes (starting from target, going backwards)
        const queue: string[] = [targetNodeId];

        while (queue.length > 0) {
            const currentId = queue.shift()!;

            if (reverseGraph.has(currentId)) {
                for (const sourceId of reverseGraph.get(currentId)!) {
                    if (!visited.has(sourceId)) {
                        visited.add(sourceId);
                        const node = nodes.find((n: any) => n.id === sourceId);
                        if (node) {
                            result.push(node);
                            queue.push(sourceId);
                        }
                    }
                }
            }
        }

        // Reverse to get execution order (start to target)
        result.reverse();

        return result;
    }

    /**
     * Execute a single node with a minimal workflow (for testing/debugging)
     * POST /api/execute/node
     * Body: { workflow: {...}, input: {...}, nodeId: "..." }
     */
    async executeNode(req: Request, res: Response): Promise<void> {
        try {
            const { workflow, input, nodeId, secrets } = req.body;

            console.log('📥 Received executeNode request');
            console.log('   Request body keys:', Object.keys(req.body));
            console.log('   nodeId:', nodeId);
            console.log('   workflow present:', !!workflow);
            console.log('   workflow.id:', workflow?.id);
            console.log('   workflow.nodes present:', !!workflow?.nodes);
            console.log('   workflow.nodes length:', workflow?.nodes?.length || 0);

            if (!workflow || !nodeId) {
                res.status(400).json({ error: 'workflow and nodeId are required' });
                return;
            }

            // Log all nodes with their IDs
            if (workflow.nodes && Array.isArray(workflow.nodes)) {
                console.log(`📋 Workflow contains ${workflow.nodes.length} nodes:`);
                workflow.nodes.forEach((n: any, index: number) => {
                    console.log(`   [${index}] id="${n?.id}", type="${n?.type}", label="${n?.label}"`);
                });
            } else {
                console.error('❌ workflow.nodes is not an array:', typeof workflow.nodes, workflow.nodes);
            }

            // Find the target node - try exact match first
            let targetNode = workflow.nodes?.find((n: any) => n && n.id === nodeId);
            
            // If not found, try with type coercion or string comparison
            if (!targetNode && workflow.nodes) {
                console.log(`⚠️ Exact match failed, trying string comparison...`);
                targetNode = workflow.nodes.find((n: any) => n && String(n.id) === String(nodeId));
            }
            
            if (!targetNode) {
                console.error(`❌ Node "${nodeId}" not found in workflow`);
                console.error(`   Available node IDs:`, workflow.nodes?.map((n: any) => n?.id).filter(Boolean));
                res.status(404).json({ 
                    error: 'Workflow node not found', 
                    nodeId, 
                    availableNodes: workflow.nodes?.map((n: any) => n?.id).filter(Boolean),
                    workflowId: workflow.id
                });
                return;
            }
            
            console.log(`✅ Found target node: ${targetNode.id} (type: ${targetNode.type})`);

            if (secrets && typeof workflow === 'object' && workflow !== null) {
                workflow.secrets = secrets;
                console.log('   🔐 Attached secrets to workflow for execution. Keys:', Object.keys(secrets));
            }

            // Create a minimal execution context
            const execution: Execution = {
                id: `test-${Date.now()}`,
                workflowId: workflow.id || 'test-workflow',
                status: 'running',
                input: input || {},
                output: null,
                trace: [],
                startedAt: new Date(),
                completedAt: undefined,
            };

            // Execute the node using the execution service
            const result = await executionService.processNodeDirectly(targetNode, input || {}, workflow, execution);

            res.status(200).json({
                nodeId: nodeId,
                nodeType: targetNode.type,
                output: result,
                execution: {
                    id: execution.id,
                    status: execution.status,
                    trace: execution.trace
                }
            });
        } catch (error: any) {
            console.error('Error executing node:', error);
            res.status(500).json({ error: error.message, stack: error.stack });
        }
    }
}

export const executionController = new ExecutionController();