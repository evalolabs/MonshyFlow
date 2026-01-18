import type { McpHandler, McpHandlerContext, McpConnection } from '..';

/**
 * Intercom MCP Handler (OpenAI Connector)
 * Uses hostedMcpTool from @openai/agents - no manual implementation needed
 */
export const intercomMcpHandler: McpHandler = {
    id: 'openai-intercom',
    name: 'Intercom (OpenAI Connector)',
    description: 'Access Intercom via OpenAI hosted MCP Connector. Manage conversations and customers.',
    metadata: {
        requiredSecrets: ['intercom_access_token'],
        docsUrl: 'https://platform.openai.com/docs/mcp',
        apiKeyUrl: 'https://app.intercom.com/a/developer-signup',
        setupInstructions: '1. Create an Intercom app\n2. Generate an access token\n3. Add "intercom_access_token" secret with access token',
    },
    defaultConfig: {
        requireApproval: 'never',
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        throw new Error('Intercom handler uses hostedMcpTool - connection is handled automatically');
    },
};

