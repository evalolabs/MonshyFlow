import type { McpHandler, McpHandlerContext, McpConnection } from '..';

/**
 * Dropbox MCP Handler (OpenAI Connector)
 * Uses hostedMcpTool from @openai/agents - no manual implementation needed
 */
export const dropboxMcpHandler: McpHandler = {
    id: 'openai-dropbox',
    name: 'Dropbox (OpenAI Connector)',
    description: 'Access Dropbox via OpenAI hosted MCP Connector. Manage files and folders.',
    metadata: {
        requiredSecrets: ['dropbox_oauth_token'],
        docsUrl: 'https://platform.openai.com/docs/mcp',
        apiKeyUrl: 'https://www.dropbox.com/developers/apps',
        setupInstructions: '1. Create a Dropbox app\n2. Configure OAuth 2.0\n3. Add "dropbox_oauth_token" secret with OAuth token',
    },
    defaultConfig: {
        requireApproval: 'never',
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        throw new Error('Dropbox handler uses hostedMcpTool - connection is handled automatically');
    },
};
