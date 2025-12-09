import { z, type ZodObject } from 'zod';
import type { tool } from '@openai/agents';

export interface ToolCreatorContext {
    workflow: any;
    node: any;
    secrets: Record<string, string>;
}

export interface ToolCreator {
    type: string; // Tool type, e.g., 'tool-mcp-server', 'tool-web-search', 'tool-function', etc.
    name: string; // Human-readable name
    description?: string;
    
    /**
     * Create a tool instance for an agent
     * Returns a tool created with the @openai/agents tool() function
     */
    create: (node: any, context: ToolCreatorContext) => Promise<any> | any;
    
    /**
     * Optional: Validate tool node configuration
     */
    validate?: (node: any) => { valid: boolean; error?: string };
    
    /**
     * Optional: Get default configuration for this tool type
     */
    getDefaultConfig?: () => Record<string, any>;
}

const registry = new Map<string, ToolCreator>();

/**
 * Register a tool creator
 */
export const registerToolCreator = (creator: ToolCreator) => {
    if (registry.has(creator.type)) {
        console.warn(`[Tool Registry] Creator for type "${creator.type}" is already registered. Overwriting.`);
    }
    registry.set(creator.type, creator);
    console.log(`[Tool Registry] Registered tool creator: ${creator.name} (${creator.type})`);
};

/**
 * Get a tool creator by type
 */
export const getToolCreator = (type?: string | null): ToolCreator | undefined => {
    if (!type) {
        return undefined;
    }
    return registry.get(type);
};

/**
 * List all registered tool creators
 */
export const listToolCreators = (): ToolCreator[] => Array.from(registry.values());

/**
 * Check if a tool type is registered
 */
export const hasToolCreator = (type: string): boolean => registry.has(type);

