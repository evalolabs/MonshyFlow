import type { ZodObject } from 'zod';

// Context passed to MCP handler methods
export interface McpHandlerContext {
    workflow: any;
    node: any;
    secrets: Record<string, string>;
}

// Represents a single tool discovered from an MCP server
export interface McpTool {
    name: string;
    description: string;
    parameters: ZodObject<any>;
}

// Represents an active connection to an MCP server
export interface McpConnection {
    listTools(): Promise<McpTool[]>;
    invoke(toolName: string, args: Record<string, any>): Promise<any>;
}

// Defines a built-in MCP integration (e.g., Gmail, Slack)
export interface McpHandler {
    id: string; // Unique identifier, e.g., "generic" or "google-gmail"
    name: string; // User-friendly name, e.g., "Generic MCP Server" or "Google Gmail"
    description: string;
    
    // Default configuration values to be populated in the UI
    defaultConfig?: {
        serverUrl?: string;
        requireApproval?: 'auto' | 'always' | 'never';
    };
    
    // Metadata for the UI
    metadata?: {
        // List of secret names required for this integration
        requiredSecrets?: string[];
        // Link to documentation
        docsUrl?: string;
        // Link to API key creation page
        apiKeyUrl?: string;
        // Setup instructions for the integration
        setupInstructions?: string;
    };
    
    // Factory function to establish a connection
    connect(config: any, context: McpHandlerContext): Promise<McpConnection>;
}

const registry = new Map<string, McpHandler>();

export const registerMcpHandler = (handler: McpHandler) => {
    if (registry.has(handler.id)) {
        console.warn(`[MCP Registry] Handler with ID "${handler.id}" is already registered. Overwriting.`);
    }
    registry.set(handler.id, handler);
    console.log(`[MCP Registry] Registered MCP handler: ${handler.name}`);
};

export const getMcpHandler = (id?: string | null): McpHandler | undefined => {
    if (!id) {
        return undefined;
    }
    return registry.get(id);
};

export const listMcpHandlers = (): McpHandler[] => Array.from(registry.values());


