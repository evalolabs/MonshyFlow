import type { McpHandler, McpHandlerContext, McpConnection } from '..';

/**
 * PayPal MCP Handler (OpenAI Connector)
 * Uses hostedMcpTool from @openai/agents - no manual implementation needed
 */
export const paypalMcpHandler: McpHandler = {
    id: 'openai-paypal',
    name: 'PayPal (OpenAI Connector)',
    description: 'Access PayPal via OpenAI hosted MCP Connector. Process payments and manage transactions.',
    metadata: {
        requiredSecrets: ['paypal_client_id', 'paypal_secret'],
        docsUrl: 'https://platform.openai.com/docs/mcp',
        apiKeyUrl: 'https://developer.paypal.com/dashboard/applications',
        setupInstructions: '1. Create a PayPal app\n2. Get your client ID and secret\n3. Add "paypal_client_id" and "paypal_secret" secrets',
    },
    defaultConfig: {
        requireApproval: 'never',
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        throw new Error('PayPal handler uses hostedMcpTool - connection is handled automatically');
    },
};

