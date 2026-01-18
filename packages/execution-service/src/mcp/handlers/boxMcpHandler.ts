import type { McpHandler, McpHandlerContext, McpConnection } from '..';

/**
 * Box MCP Handler (OpenAI Connector)
 * Uses hostedMcpTool from @openai/agents - no manual implementation needed
 */
export const boxMcpHandler: McpHandler = {
    id: 'openai-box',
    name: 'Box (OpenAI Connector)',
    description: 'Access Box via OpenAI hosted MCP Connector. Manage files and folders.',
    metadata: {
        requiredSecrets: ['box_oauth_token'],
        docsUrl: 'https://platform.openai.com/docs/mcp',
        apiKeyUrl: 'https://developer.box.com/',
        setupInstructions: '1. Create a Box app\n2. Configure OAuth 2.0\n3. Add "box_oauth_token" secret with OAuth token',
    },
    defaultConfig: {
        requireApproval: 'never',
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        throw new Error('Box handler uses hostedMcpTool - connection is handled automatically');
    },
};

