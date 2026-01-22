import type { Execution } from '../models/execution';
import type { NodeData } from '../models/nodeData';

export interface NodeProcessorContext {
    workflow: any;
    node: any;
    execution?: Execution;
    secrets: Record<string, string>;
    input: any; // Legacy: can be any
    nodeData?: NodeData; // New: standardized NodeData input
    variables?: Record<string, any>; // Workflow variables (shared state across all nodes)
}

export interface NodeProcessor {
    type: string; // Node type, e.g., 'start', 'end', 'agent', 'llm', etc.
    name: string; // Human-readable name
    description?: string;
    
    /**
     * Legacy method: Process a node and return its output (any type)
     * This is kept for backward compatibility.
     */
    process?: (node: any, input: any, context: NodeProcessorContext) => Promise<any>;
    
    /**
     * New standardized method: Process a node with NodeData input/output
     * If not implemented, falls back to process() method.
     */
    processNodeData?: (node: any, input: NodeData | null, context: NodeProcessorContext) => Promise<NodeData | null>;
    
    /**
     * Optional: Validate node configuration before execution
     */
    validate?: (node: any) => { valid: boolean; error?: string };
    
    /**
     * Optional: Get default configuration for this node type
     */
    getDefaultConfig?: () => Record<string, any>;
}

const registry = new Map<string, NodeProcessor>();

/**
 * Register a node processor
 */
export const registerNodeProcessor = (processor: NodeProcessor) => {
    if (registry.has(processor.type)) {
        console.warn(`[Node Registry] Processor for type "${processor.type}" is already registered. Overwriting.`);
    }
    registry.set(processor.type, processor);
    console.log(`[Node Registry] Registered node processor: ${processor.name} (${processor.type})`);
};

/**
 * Get a node processor by type
 */
export const getNodeProcessor = (type?: string | null): NodeProcessor | undefined => {
    if (!type) {
        return undefined;
    }
    return registry.get(type);
};

/**
 * List all registered node processors
 */
export const listNodeProcessors = (): NodeProcessor[] => Array.from(registry.values());

/**
 * Check if a node type is registered
 */
export const hasNodeProcessor = (type: string): boolean => registry.has(type);

