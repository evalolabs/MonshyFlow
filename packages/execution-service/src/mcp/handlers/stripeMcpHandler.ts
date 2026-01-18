import type { McpHandler, McpHandlerContext, McpConnection } from '..';

/**
 * Stripe MCP Handler (OpenAI Connector)
 * Uses hostedMcpTool from @openai/agents - no manual implementation needed
 */
export const stripeMcpHandler: McpHandler = {
    id: 'openai-stripe',
    name: 'Stripe (OpenAI Connector)',
    description: 'Access Stripe via OpenAI hosted MCP Connector. Process payments and manage customers.',
    metadata: {
        requiredSecrets: ['stripe_secret_key'],
        docsUrl: 'https://platform.openai.com/docs/mcp',
        apiKeyUrl: 'https://dashboard.stripe.com/apikeys',
        setupInstructions: '1. Create a Stripe account\n2. Get your secret key from the dashboard\n3. Add "stripe_secret_key" secret with your secret key',
    },
    defaultConfig: {
        requireApproval: 'never',
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        throw new Error('Stripe handler uses hostedMcpTool - connection is handled automatically');
    },
};

