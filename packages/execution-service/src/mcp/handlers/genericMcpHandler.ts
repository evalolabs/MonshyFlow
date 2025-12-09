import axios from 'axios';
import { z } from 'zod';
import type { McpConnection, McpHandler, McpHandlerContext, McpTool } from '..';

/**
 * A generic McpConnection that communicates with a standard MCP server over HTTP.
 * This is a simplified implementation and should be expanded to support the full MCP spec.
 */
class GenericMcpConnection implements McpConnection {
    private readonly baseUrl: string;
    private readonly headers: Record<string, string>;

    constructor(config: { serverUrl: string; headers?: Record<string, string> }) {
        if (!config.serverUrl) {
            throw new Error('MCP server URL is required for GenericMcpConnection');
        }
        this.baseUrl = config.serverUrl;
        this.headers = config.headers || {};
    }

    async listTools(): Promise<McpTool[]> {
        try {
            // A standard MCP server might expose its tools at a `/tools` endpoint
            const response = await axios.get(`${this.baseUrl}/tools`, {
                headers: this.headers,
                timeout: 8000,
            });

            // Assuming the response is an array of tool definitions
            // that need to be mapped to our McpTool interface.
            // This requires validation and transformation (e.g., JSON schema to Zod).
            if (Array.isArray(response.data)) {
                return response.data.map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    // TODO: Implement a robust JSON Schema to Zod conversion
                    parameters: z.object({
                        payload: z.any().optional().describe('Payload for the tool'),
                    }),
                }));
            }
            return [];
        } catch (error) {
            console.error('[GenericMcpConnection] Failed to list tools:', error);
            // In a real scenario, you might want to throw a more specific error
            throw new Error(`Failed to retrieve tools from MCP server at ${this.baseUrl}`);
        }
    }

    async invoke(toolName: string, args: Record<string, any>): Promise<any> {
        try {
            // A standard MCP server might expect tool invocations at `/invoke/:toolName`
            const response = await axios.post(`${this.baseUrl}/invoke/${toolName}`, args, {
                headers: {
                    'Content-Type': 'application/json',
                    ...this.headers,
                },
                timeout: 30000,
            });
            return response.data;
        } catch (error) {
            console.error(`[GenericMcpConnection] Failed to invoke tool "${toolName}":`, error);
            throw new Error(`MCP tool invocation for "${toolName}" failed.`);
        }
    }
}

export const genericMcpHandler: McpHandler = {
    id: 'generic',
    name: 'Custom MCP Server',
    description: 'Connect to any standard Model Context Protocol server by providing its URL.',
    metadata: {
        docsUrl: 'https://docs.modelcontext.dev',
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        // Here you could add logic to resolve secrets for authentication headers
        const serverUrl = config.serverUrl;
        if (typeof serverUrl !== 'string' || !serverUrl.trim()) {
            // This connection should not be attempted if the URL is missing.
            // The tool factory logic should handle this gracefully.
            throw new Error('Cannot connect to generic MCP handler without a server URL.');
        }

        return new GenericMcpConnection({
            serverUrl,
            // Example: headers: { 'Authorization': `Bearer ${context.secrets.myApiToken}` }
        });
    },
};

