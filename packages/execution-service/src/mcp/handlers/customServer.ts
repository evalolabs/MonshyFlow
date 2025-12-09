import axios, { AxiosError } from 'axios';
import { z } from 'zod';
import type { McpHandler, McpConnection, McpHandlerContext, McpTool } from '../index';

const DEFAULT_INVOKE_PATH = '/invoke';

class CustomServerConnection implements McpConnection {
    private readonly baseUrl: string;
    private readonly invokePath: string;
    private readonly headers: Record<string, string>;
    private readonly tools: McpTool[];

    constructor(config: { serverUrl: string; invokePath?: string; headers?: Record<string, string>; tools: McpTool[] }) {
        if (!config.serverUrl) {
            throw new Error('MCP server URL is required for CustomServerConnection');
        }
        this.baseUrl = config.serverUrl;
        this.invokePath = config.invokePath || DEFAULT_INVOKE_PATH;
        this.headers = config.headers || {};
        this.tools = config.tools || [];
    }

    async listTools(): Promise<McpTool[]> {
        // In this handler, tools are defined in the config, so we just return them.
        return Promise.resolve(this.tools);
    }

    async invoke(toolName: string, args: Record<string, any>): Promise<any> {
        try {
            const url = `${this.baseUrl.replace(/\/$/, '')}${this.invokePath}`;
            const response = await axios.post(url, {
                tool: toolName,
                args: args,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    ...this.headers,
                },
                timeout: 30000,
            });
            return response.data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                const status = axiosError.response?.status;
                const data = axiosError.response?.data;
                const detail = typeof data === 'object' ? JSON.stringify(data) : data ?? axiosError.message;
                throw new Error(`Custom MCP server request failed${status ? ` (${status})` : ''}: ${detail}`);
            }
            throw new Error(`Custom MCP server request failed: ${error.message}`);
        }
    }
}

export const customServerMcpHandler: McpHandler = {
    id: 'custom-server', // Renamed from 'custom' to be more descriptive
    name: 'Custom Tool Server',
    description: 'Connect to a custom tool server that exposes a single /invoke endpoint.',
    metadata: {
        docsUrl: 'https://docs.monshy.com/tools/custom-server', // Example URL
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        const { serverUrl, invokePath, headers, tools: toolsSchema } = config;

        if (typeof serverUrl !== 'string' || !serverUrl.trim()) {
            throw new Error('Cannot connect to custom tool server without a server URL.');
        }

        const resolvedHeaders = typeof headers === 'object' ? headers : {}; // Basic parsing for now

        // The "tools" in the config are the definitions. We need to parse them.
        const tools: McpTool[] = (Array.isArray(toolsSchema) ? toolsSchema : []).map((t: any) => ({
            name: t.name || 'unnamed-tool',
            description: t.description || 'No description',
            // A real implementation should convert a JSON schema to a Zod schema here.
            // For now, we'll create a generic one.
            parameters: z.object({
                payload: z.any().optional().describe('Arguments for the tool'),
            }),
        }));
        
        return new CustomServerConnection({
            serverUrl: serverUrl.trim(),
            invokePath,
            headers: resolvedHeaders,
            tools,
        });
    },
};

