import { z } from 'zod';
import type { McpHandler, McpConnection, McpHandlerContext, McpTool } from '..';

const GENERIC_PARAMETERS = z.object({
    method: z.string().min(1, 'MCP method is required').describe('MCP method to invoke'),
    params: z.any().optional().describe('Arguments for the MCP method'),
});

class GenericProxyConnection implements McpConnection {
    private readonly tool: McpTool;

    constructor(private readonly nodeData: any) {
        this.tool = {
            name: 'mcp_invoke',
            description: 'Invoke a method on the configured MCP server (generic proxy).',
            parameters: GENERIC_PARAMETERS,
        };
    }

    async listTools(): Promise<McpTool[]> {
        return [this.tool];
    }

    async invoke(toolName: string, args: Record<string, any>): Promise<any> {
        if (toolName !== this.tool.name) {
            throw new Error(`Tool "${toolName}" is not supported by the generic MCP proxy.`);
        }

        const { method, params } = args;
        return {
            message: `MCP method "${method}" invoked in generic handler (no remote call made).`,
            method,
            params,
            serverUrl: this.nodeData?.serverUrl,
            requireApproval: this.nodeData?.requireApproval ?? 'never',
            note: 'Generic handler placeholder – replace with specialised MCP handler for production use.',
        };
    }
}

export const genericMcpProxyHandler: McpHandler = {
    id: 'generic-mcp-proxy',
    name: 'Generic MCP Proxy',
    description: 'Fallback handler that records MCP method calls. Useful for early testing before real handlers are added.',
    metadata: {
        docsUrl: 'https://modelcontextprotocol.io/introduction',
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        return new GenericProxyConnection(context.node?.data || config || {});
    },
};


