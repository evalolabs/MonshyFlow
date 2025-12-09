/**
 * WorkflowDataProxy
 * 
 * Implements proxy-based system for dynamic data access
 * Provides $json, $node, $input, $item, etc. for expressions
 */

import type { Execution } from '../models/execution';
import { getNodeDataValue } from '../models/nodeData';

export interface WorkflowDataProxyData {
    // Current node data
    $json: any;
    
    // Other nodes
    $node: {
        [nodeId: string]: {
            json: any;
            binary?: any;
            context?: any;
            parameter?: any;
        };
    };
    
    // Input data
    $input: {
        first: () => any;
        last: () => any;
        all: () => any[];
        item: (index: number) => any;
    };
    
    // Items
    $item: (index: number) => any;
    $items: (nodeId?: string) => any[];
    
    // Workflow metadata
    $workflow: {
        id: string;
        name?: string;
    };
    
    // Time
    $now: Date;
    $today: Date;
    
    // Additional utilities
    [key: string]: any;
}

export class WorkflowDataProxy {
    constructor(
        private execution: Execution,
        private currentNodeId: string,
        private itemIndex: number = 0
    ) {}

    /**
     * Get data proxy object
     */
    getDataProxy(): WorkflowDataProxyData {
        const currentTraceEntry = this.execution.trace.find(
            t => t.nodeId === this.currentNodeId
        );
        
        const currentData = currentTraceEntry?.output 
            ? getNodeDataValue(currentTraceEntry.output)
            : null;

        // Build $node proxy for accessing other nodes
        const nodeProxy = new Proxy({} as any, {
            get: (target, nodeId: string) => {
                const traceEntry = this.execution.trace.find(t => t.nodeId === nodeId);
                if (!traceEntry) {
                    throw new Error(`Node '${nodeId}' hasn't been executed`);
                }
                
                const nodeData = traceEntry.output 
                    ? getNodeDataValue(traceEntry.output)
                    : null;
                
                return {
                    json: nodeData,
                    binary: traceEntry.output?.binary,
                    context: traceEntry.output?.metadata,
                    parameter: this.getNodeParameters(nodeId),
                };
            },
        });

        // Build $input proxy
        const inputProxy = {
            first: () => {
                const inputTraceEntry = this.execution.trace.find(
                    t => t.nodeId === this.currentNodeId
                );
                if (!inputTraceEntry?.input) return undefined;
                return getNodeDataValue(inputTraceEntry.input);
            },
            last: () => {
                const inputTraceEntry = this.execution.trace.find(
                    t => t.nodeId === this.currentNodeId
                );
                if (!inputTraceEntry?.input) return undefined;
                const inputData = inputTraceEntry.input;
                // If input is an array, return last item
                if (Array.isArray(inputData)) {
                    return inputData.length > 0 ? getNodeDataValue(inputData[inputData.length - 1]) : undefined;
                }
                return getNodeDataValue(inputData);
            },
            all: () => {
                const inputTraceEntry = this.execution.trace.find(
                    t => t.nodeId === this.currentNodeId
                );
                if (!inputTraceEntry?.input) return [];
                const inputData = inputTraceEntry.input;
                // If input is an array, return all items
                if (Array.isArray(inputData)) {
                    return inputData.map(item => getNodeDataValue(item));
                }
                return [getNodeDataValue(inputData)];
            },
            item: (index: number) => {
                const inputTraceEntry = this.execution.trace.find(
                    t => t.nodeId === this.currentNodeId
                );
                if (!inputTraceEntry?.input) return undefined;
                const inputData = inputTraceEntry.input;
                // If input is an array, return item at index
                if (Array.isArray(inputData)) {
                    return inputData[index] ? getNodeDataValue(inputData[index]) : undefined;
                }
                return index === 0 ? getNodeDataValue(inputData) : undefined;
            },
        };

        return {
            // Current node data
            $json: currentData,
            
            // Other nodes
            $node: nodeProxy,
            
            // Input data
            $input: inputProxy,
            
            // Items (simplified for now)
            $item: (index: number) => {
                return inputProxy.item(index);
            },
            $items: (nodeId?: string) => {
                if (nodeId) {
                    const traceEntry = this.execution.trace.find(t => t.nodeId === nodeId);
                    if (!traceEntry?.output) return [];
                    const outputData = traceEntry.output;
                    if (Array.isArray(outputData)) {
                        return outputData.map(item => getNodeDataValue(item));
                    }
                    return [getNodeDataValue(outputData)];
                }
                return inputProxy.all();
            },
            
            // Workflow metadata
            $workflow: {
                id: this.execution.workflowId,
                name: undefined, // Could be added if workflow object is available
            },
            
            // Time
            $now: new Date(),
            $today: (() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return today;
            })(),
        };
    }

    /**
     * Get node parameters (placeholder - would need workflow object)
     */
    private getNodeParameters(nodeId: string): any {
        // TODO: Implement if needed
        return {};
    }
}

