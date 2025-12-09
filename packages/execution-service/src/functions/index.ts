import type { Execution } from '../models/execution';

export interface FunctionHandlerContext {
    workflow: any;
    node: any;
    execution?: Execution;
    secrets: Record<string, string>;
}

export interface FunctionHandler {
    name: string;
    description: string;
    parameters: any;
    execute: (args: Record<string, any>, context: FunctionHandlerContext) => Promise<any>;
    metadata?: {
        requiredSecrets?: string[];
        docsUrl?: string;
        apiKeyUrl?: string;
        setupInstructions?: string;
    };
}

const registry = new Map<string, FunctionHandler>();

export const registerFunction = (handler: FunctionHandler) => {
    registry.set(handler.name, handler);
    console.log(`[Function Registry] Registered function: ${handler.name}`);
};

export const getFunctionHandler = (name?: string | null): FunctionHandler | undefined => {
    if (!name) {
        return undefined;
    }
    return registry.get(name);
};

export const listFunctionHandlers = (): FunctionHandler[] => Array.from(registry.values());
