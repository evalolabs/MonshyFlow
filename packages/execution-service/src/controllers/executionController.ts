import { Request, Response } from 'express';
import { executionService } from '../services/executionService';
import { Execution, ExecutionRequest, TraceEntry } from '../models/execution';
import { generateSchemaFromNodeData } from '../utils/schemaGenerator';
import { redisService } from '../services/redisService';
import { createNodeData } from '../models/nodeData';

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

            // Initialize workflow variables from workflow definition (for debug execution)
            const workflowVariables: Record<string, any> = {};
            if (workflow.variables) {
                // Deep clone to avoid reference issues
                Object.assign(workflowVariables, JSON.parse(JSON.stringify(workflow.variables)));
                console.log('[ExecutionController] 🔧 Initialized workflow variables for debug:', Object.keys(workflowVariables), workflowVariables);
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
                    
                    const nodeOutput = await executionService.processNodeDirectly(prevNode, currentInput, workflow, execution, workflowVariables);
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

                    // Special handling for ForEach nodes: execute loop body for each array item
                    // Check both 'foreach' type and 'loop' type with loopType='foreach'
                    const isForEach = prevNode.type === 'foreach' || 
                                    (prevNode.type === 'loop' && prevNode.data?.loopType === 'foreach');
                    
                    if (isForEach) {
                        // For 'loop' type, we need to resolve the arrayPath to get the array
                        let array: any[] = [];
                        
                        if (prevNode.type === 'foreach') {
                            // Legacy foreach node - get array from output
                            const foreachOutput = nodeOutput?.json || nodeOutput?.data || {};
                            array = foreachOutput.results || foreachOutput.data || [];
                        } else if (prevNode.type === 'loop' && prevNode.data?.loopType === 'foreach') {
                            // New loop node - resolve arrayPath expression
                            const arrayPath = prevNode.data?.arrayPath || '';
                            if (arrayPath) {
                                // Build steps for expression resolution
                                const steps: Record<string, any> = {};
                                if (execution.trace) {
                                    for (const traceEntry of execution.trace) {
                                        if (traceEntry.nodeId && traceEntry.nodeId !== prevNode.id) {
                                            steps[traceEntry.nodeId] = traceEntry.output || traceEntry.input;
                                        }
                                    }
                                }
                                
                                // Resolve arrayPath expression
                                const { expressionResolutionService } = await import('../services/expressionResolutionService');
                                const expressionContext = {
                                    steps,
                                    input: currentInput?.json || {},
                                    secrets: workflow.secrets || {},
                                    vars: workflowVariables || {},
                                };
                                
                                const resolved = expressionResolutionService.resolveExpressions(
                                    arrayPath,
                                    expressionContext,
                                    { execution, currentNodeId: prevNode.id }
                                );
                                
                                const resolvedValue = typeof resolved === 'string' ? resolved : resolved.result;
                                
                                // Try to parse as JSON if string
                                if (typeof resolvedValue === 'string') {
                                    try {
                                        const parsed = JSON.parse(resolvedValue);
                                        array = Array.isArray(parsed) ? parsed : [];
                                    } catch {
                                        array = [];
                                    }
                                } else if (Array.isArray(resolvedValue)) {
                                    array = resolvedValue;
                                } else {
                                    array = [];
                                }
                            }
                        }
                        
                        if (Array.isArray(array) && array.length > 0) {
                            console.log(`[ExecutionController] ForEach node ${prevNode.id}: Executing loop body for ${array.length} items`);
                            
                            // Find loop edge
                            // For 'loop' type nodes, use the first edge from the loop node (not going to end-loop)
                            // For 'foreach' type nodes, look for edge with sourceHandle === 'loop'
                            let loopEdge: any = null;
                            
                            if (prevNode.type === 'loop') {
                                // New loop node with pairId - use same logic as executeLoopPairBetweenMarkers
                                const pairId = prevNode.data?.pairId;
                                if (pairId) {
                                    // Find End-Loop node with matching pairId
                                    const endLoopNode = workflow.nodes?.find((n: any) => 
                                        n.type === 'end-loop' && 
                                        n.data?.pairId === pairId
                                    );
                                    
                                    if (endLoopNode) {
                                        // Find all nodes between Loop and End-Loop (loop body)
                                        const findLoopBodyNodes = (loopNodeId: string, endLoopNodeId: string, edges: any[]): string[] => {
                                            const lookup = new Map<string, string[]>();
                                            edges.forEach((e: any) => {
                                                if (!lookup.has(e.source)) lookup.set(e.source, []);
                                                lookup.get(e.source)!.push(e.target);
                                            });

                                            const visited = new Set<string>();
                                            const body = new Set<string>();
                                            const queue: string[] = [loopNodeId];

                                            while (queue.length) {
                                                const cur = queue.shift()!;
                                                if (visited.has(cur)) continue;
                                                visited.add(cur);
                                                if (cur === endLoopNodeId) continue;
                                                if (cur !== loopNodeId) body.add(cur);
                                                const nexts = lookup.get(cur) || [];
                                                nexts.forEach((n: string) => {
                                                    if (!visited.has(n)) queue.push(n);
                                                });
                                            }

                                            body.delete(endLoopNodeId);
                                            return Array.from(body);
                                        };
                                        
                                        const loopBodyNodeIds = findLoopBodyNodes(prevNode.id, endLoopNode.id, workflow.edges || []);
                                        
                                        if (loopBodyNodeIds.length === 0) {
                                            console.warn(`[ExecutionController] Loop-Pair ${prevNode.id}: Empty loop body, skipping`);
                                        } else {
                                            console.log(`[ExecutionController] Loop-Pair ${prevNode.id}: Found ${loopBodyNodeIds.length} nodes in loop body:`, loopBodyNodeIds);
                                            
                                            // Execute loop body for each array item
                                            for (let index = 0; index < array.length; index++) {
                                                const currentItem = array[index];
                                                
                                                // Create loop context
                                                const loopContext = {
                                                    current: currentItem,
                                                    index: index,
                                                    array: array,
                                                };
                                                
                                                let iterationInput = createNodeData({
                                                    ...(currentInput?.json || {}),
                                                    loop: loopContext,
                                                    current: currentItem,
                                                    index: index,
                                                }, prevNode.id, 'loop-body');
                                                
                                                // Execute loop body nodes sequentially
                                                // Find start node of loop body (first node after Loop marker)
                                                let startNodeId: string | null = null;
                                                for (const nodeId of loopBodyNodeIds) {
                                                    const hasIncomingFromOutside = workflow.edges?.some((e: any) => 
                                                        e.target === nodeId && !loopBodyNodeIds.includes(e.source)
                                                    );
                                                    if (hasIncomingFromOutside || loopBodyNodeIds.indexOf(nodeId) === 0) {
                                                        startNodeId = nodeId;
                                                        break;
                                                    }
                                                }
                                                
                                                if (!startNodeId && loopBodyNodeIds.length > 0) {
                                                    startNodeId = loopBodyNodeIds[0];
                                                }
                                                
                                                if (startNodeId) {
                                                    let loopBodyNode = workflow.nodes?.find((n: any) => n.id === startNodeId);
                                                    const loopBodyVisited = new Set<string>();
                                                    
                                                    while (loopBodyNode && loopBodyNodeIds.includes(loopBodyNode.id)) {
                                                        if (loopBodyVisited.has(loopBodyNode.id)) {
                                                            throw new Error(`Circular dependency detected in loop body at node ${loopBodyNode.id}`);
                                                        }
                                                        loopBodyVisited.add(loopBodyNode.id);
                                                        
                                                        const loopBodyStartTime = Date.now();
                                                        try {
                                                            await redisService.publish('node.start', {
                                                                executionId: execution.id,
                                                                nodeId: loopBodyNode.id,
                                                                nodeType: loopBodyNode.type,
                                                                nodeLabel: loopBodyNode.data?.label || loopBodyNode.label,
                                                                startedAt: new Date().toISOString()
                                                            });
                                                        } catch (err) {
                                                            console.warn('[ExecutionController] Failed to publish node.start event:', err);
                                                        }
                                                        
                                                        try {
                                                            const loopBodyOutput = await executionService.processNodeDirectly(loopBodyNode, iterationInput, workflow, execution, workflowVariables);
                                                            const loopBodyDuration = Date.now() - loopBodyStartTime;
                                                            
                                                            try {
                                                                await redisService.publish('node.end', {
                                                                    executionId: execution.id,
                                                                    nodeId: loopBodyNode.id,
                                                                    nodeType: loopBodyNode.type,
                                                                    nodeLabel: loopBodyNode.data?.label || loopBodyNode.label,
                                                                    status: 'completed',
                                                                    duration: loopBodyDuration,
                                                                    output: loopBodyOutput,
                                                                    completedAt: new Date().toISOString()
                                                                });
                                                            } catch (err) {
                                                                console.warn('[ExecutionController] Failed to publish node.end event:', err);
                                                            }
                                                            
                                                            // Add trace entry
                                                            const loopBodyTraceEntry: TraceEntry = {
                                                                nodeId: loopBodyNode.id,
                                                                type: loopBodyNode.type,
                                                                input: iterationInput,
                                                                output: loopBodyOutput,
                                                                timestamp: new Date(),
                                                                duration: loopBodyDuration,
                                                            };
                                                            if (loopBodyTraceEntry.output) {
                                                                loopBodyTraceEntry.outputSchema = generateSchemaFromNodeData(loopBodyTraceEntry.output);
                                                            }
                                                            if (loopBodyTraceEntry.input) {
                                                                loopBodyTraceEntry.inputSchema = generateSchemaFromNodeData(loopBodyTraceEntry.input);
                                                            }
                                                            execution.trace.push(loopBodyTraceEntry);
                                                            
                                                            // Find next node in loop body
                                                            const nextEdge = workflow.edges?.find((e: any) => 
                                                                e.source === loopBodyNode.id &&
                                                                loopBodyNodeIds.includes(e.target) &&
                                                                e.target !== endLoopNode.id
                                                            );
                                                            
                                                            if (!nextEdge) {
                                                                // No more nodes in loop body, iteration complete
                                                                break;
                                                            }
                                                            
                                                            loopBodyNode = workflow.nodes?.find((n: any) => n.id === nextEdge.target);
                                                            if (!loopBodyNode) {
                                                                throw new Error(`Next loop body node ${nextEdge.target} not found`);
                                                            }
                                                            
                                                            iterationInput = createNodeData(loopBodyOutput?.json || loopBodyOutput, loopBodyNode.id, loopBodyNode.type);
                                                            
                                                        } catch (error: any) {
                                                            const loopBodyDuration = Date.now() - loopBodyStartTime;
                                                            
                                                            try {
                                                                await redisService.publish('node.end', {
                                                                    executionId: execution.id,
                                                                    nodeId: loopBodyNode.id,
                                                                    nodeType: loopBodyNode.type,
                                                                    nodeLabel: loopBodyNode.data?.label || loopBodyNode.label,
                                                                    status: 'failed',
                                                                    duration: loopBodyDuration,
                                                                    error: error.message,
                                                                    completedAt: new Date().toISOString()
                                                                });
                                                            } catch (err) {
                                                                console.warn('[ExecutionController] Failed to publish node.end error event:', err);
                                                            }
                                                            
                                                            const errorTraceEntry: TraceEntry = {
                                                                nodeId: loopBodyNode.id,
                                                                type: loopBodyNode.type,
                                                                input: iterationInput,
                                                                output: null,
                                                                error: error.message,
                                                                timestamp: new Date(),
                                                                duration: loopBodyDuration,
                                                            };
                                                            if (errorTraceEntry.input) {
                                                                errorTraceEntry.inputSchema = generateSchemaFromNodeData(errorTraceEntry.input);
                                                            }
                                                            execution.trace.push(errorTraceEntry);
                                                            throw error;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        console.warn(`[ExecutionController] Loop node ${prevNode.id}: No End-Loop found with pairId ${pairId}`);
                                    }
                                } else {
                                    console.warn(`[ExecutionController] Loop node ${prevNode.id}: No pairId found`);
                                }
                            } else {
                                // Legacy foreach node - look for edge with sourceHandle === 'loop'
                                loopEdge = workflow.edges?.find((e: any) => 
                                    e.source === prevNode.id && 
                                    (e.sourceHandle === 'loop' || e.SourceHandle === 'loop')
                                );
                                
                                if (loopEdge) {
                                    // Execute loop body for each array item (legacy foreach logic)
                                    for (let index = 0; index < array.length; index++) {
                                        const currentItem = array[index];
                                        
                                        // Create loop context input for loop body nodes
                                        const loopContext = {
                                            current: currentItem,
                                            index: index,
                                            array: array,
                                        };
                                        
                                        let loopInput = createNodeData({
                                            ...(currentInput?.json || {}),
                                            loop: loopContext,
                                            current: currentItem,
                                            index: index,
                                        }, loopEdge.target, 'loop-body');
                                        
                                        // Execute loop body nodes
                                        let loopBodyNode = workflow.nodes?.find((n: any) => n.id === loopEdge.target);
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
                                                    nodeLabel: loopBodyNode.data?.label || loopBodyNode.label,
                                                    startedAt: new Date().toISOString()
                                                });
                                            } catch (err) {
                                                console.warn('[ExecutionController] Failed to publish node.start event:', err);
                                            }
                                            
                                            try {
                                                const loopBodyOutput = await executionService.processNodeDirectly(loopBodyNode, loopInput, workflow, execution, workflowVariables);
                                                const loopBodyDuration = Date.now() - loopBodyStartTime;
                                                
                                                try {
                                                    await redisService.publish('node.end', {
                                                        executionId: execution.id,
                                                        nodeId: loopBodyNode.id,
                                                        nodeType: loopBodyNode.type,
                                                        nodeLabel: loopBodyNode.data?.label || loopBodyNode.label,
                                                        status: 'completed',
                                                        duration: loopBodyDuration,
                                                        output: loopBodyOutput,
                                                        completedAt: new Date().toISOString()
                                                    });
                                                } catch (err) {
                                                    console.warn('[ExecutionController] Failed to publish node.end event:', err);
                                                }
                                                
                                                // Add trace entry for loop body node
                                                const loopBodyTraceEntry: TraceEntry = {
                                                    nodeId: loopBodyNode.id,
                                                    type: loopBodyNode.type,
                                                    input: loopInput,
                                                    output: loopBodyOutput,
                                                    timestamp: new Date(),
                                                    duration: loopBodyDuration,
                                                };
                                                if (loopBodyTraceEntry.output) {
                                                    loopBodyTraceEntry.outputSchema = generateSchemaFromNodeData(loopBodyTraceEntry.output);
                                                }
                                                if (loopBodyTraceEntry.input) {
                                                    loopBodyTraceEntry.inputSchema = generateSchemaFromNodeData(loopBodyTraceEntry.input);
                                                }
                                                execution.trace.push(loopBodyTraceEntry);
                                                
                                                // Find next node in loop body (look for back edge or next node)
                                                const backEdge = workflow.edges?.find((e: any) => 
                                                    e.source === loopBodyNode.id && 
                                                    e.target === prevNode.id &&
                                                    (e.targetHandle === 'back' || e.TargetHandle === 'back')
                                                );
                                                
                                                if (backEdge) {
                                                    // Loop back to foreach node - iteration complete
                                                    break;
                                                }
                                                
                                                // Find next node in loop body
                                                const nextLoopEdge = workflow.edges?.find((e: any) => 
                                                    e.source === loopBodyNode.id &&
                                                    e.target !== prevNode.id // Don't go back to foreach yet
                                                );
                                                
                                                if (!nextLoopEdge) {
                                                    // No more nodes in loop body, iteration complete
                                                    break;
                                                }
                                                
                                                loopBodyNode = workflow.nodes?.find((n: any) => n.id === nextLoopEdge.target);
                                                if (!loopBodyNode) {
                                                    throw new Error(`Next loop body node ${nextLoopEdge.target} not found`);
                                                }
                                                
                                                loopInput = createNodeData(loopBodyOutput?.json || loopBodyOutput, loopBodyNode.id, loopBodyNode.type);
                                                
                                            } catch (error: any) {
                                                const loopBodyDuration = Date.now() - loopBodyStartTime;
                                                
                                                try {
                                                    await redisService.publish('node.end', {
                                                        executionId: execution.id,
                                                        nodeId: loopBodyNode.id,
                                                        nodeType: loopBodyNode.type,
                                                        nodeLabel: loopBodyNode.data?.label || loopBodyNode.label,
                                                        status: 'failed',
                                                        duration: loopBodyDuration,
                                                        error: error.message,
                                                        completedAt: new Date().toISOString()
                                                    });
                                                } catch (err) {
                                                    console.warn('[ExecutionController] Failed to publish node.end error event:', err);
                                                }
                                                
                                                const errorTraceEntry: TraceEntry = {
                                                    nodeId: loopBodyNode.id,
                                                    type: loopBodyNode.type,
                                                    input: loopInput,
                                                    output: null,
                                                    error: error.message,
                                                    timestamp: new Date(),
                                                    duration: loopBodyDuration,
                                                };
                                                if (errorTraceEntry.input) {
                                                    errorTraceEntry.inputSchema = generateSchemaFromNodeData(errorTraceEntry.input);
                                                }
                                                execution.trace.push(errorTraceEntry);
                                                throw error;
                                            }
                                        }
                                    }
                                } else {
                                    console.warn(`[ExecutionController] ForEach node ${prevNode.id}: No loop edge found, skipping loop body`);
                                }
                            }
                        } else {
                            console.log(`[ExecutionController] ForEach node ${prevNode.id}: Empty array, skipping loop body`);
                        }
                    }

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

            // Check if target node is inside a loop body
            const isTargetInLoopBody = this.isNodeInLoopBody(nodeId, workflow.edges || []);
            
            let targetResult: any = null;
            
            // Execute target node (unless it's inside a loop body, in which case it was already executed)
            if (!isTargetInLoopBody) {
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
                
                targetResult = await executionService.processNodeDirectly(targetNode, currentInput, workflow, execution, workflowVariables);
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
                
                // Update currentInput for response
                currentInput = targetResult;
            } else {
                console.log(`[ExecutionController] Target node ${nodeId} is inside a loop body and was already executed as part of the loop`);
                // Find the trace entry for the target node from the loop execution
                const targetTraceEntry = execution.trace.find((entry: TraceEntry) => entry.nodeId === nodeId);
                if (targetTraceEntry) {
                    targetResult = targetTraceEntry.output;
                    currentInput = targetTraceEntry.output;
                }
            }

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
    /**
     * Check if a node is inside a loop body (connected via loop edge)
     */
    private isNodeInLoopBody(nodeId: string, edges: any[]): boolean {
        // A node is in a loop body if it's the target of an edge with sourceHandle === 'loop'
        return edges.some((e: any) => 
            e.target === nodeId && 
            (e.sourceHandle === 'loop' || e.SourceHandle === 'loop')
        );
    }

    private findPreviousNodes(targetNodeId: string, nodes: any[], edges: any[]): any[] {
        const result: any[] = [];
        const visited = new Set<string>();

        // Build a reverse graph (target -> sources)
        // Exclude loop edges from the reverse graph
        const reverseGraph = new Map<string, string[]>();
        for (const edge of edges) {
            // Skip loop edges - nodes inside loop body should be handled by loop execution
            if (edge.sourceHandle === 'loop' || edge.SourceHandle === 'loop') {
                continue;
            }
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

            // Initialize workflow variables from workflow definition (for debug execution)
            const workflowVariables: Record<string, any> = {};
            if (workflow.variables) {
                // Deep clone to avoid reference issues
                Object.assign(workflowVariables, JSON.parse(JSON.stringify(workflow.variables)));
                console.log('[executeNode] 🔧 Initialized workflow variables for debug:', Object.keys(workflowVariables), workflowVariables);
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
            // Pass workflowVariables so Variable Node can access and update them
            const result = await executionService.processNodeDirectly(targetNode, input || {}, workflow, execution, workflowVariables);

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