import type { McpHandler, McpHandlerContext, McpConnection } from '..';

/**
 * Square MCP Handler (OpenAI Connector)
 * Uses hostedMcpTool from @openai/agents - no manual implementation needed
 */
export const squareMcpHandler: McpHandler = {
    id: 'openai-square',
    name: 'Square (OpenAI Connector)',
    description: 'Access Square via OpenAI hosted MCP Connector. Process payments and manage transactions.',
    metadata: {
        requiredSecrets: ['square_access_token'],
        docsUrl: 'https://platform.openai.com/docs/mcp',
        apiKeyUrl: 'https://developer.squareup.com/apps',
        setupInstructions: '1. Create a Square app\n2. Generate an access token\n3. Add "square_access_token" secret with access token',
    },
    defaultConfig: {
        requireApproval: 'never',
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        throw new Error('Square handler uses hostedMcpTool - connection is handled automatically');
    },
};

