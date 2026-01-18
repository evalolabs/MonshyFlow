import type { McpHandler, McpHandlerContext, McpConnection } from '..';

/**
 * Shopify MCP Handler (OpenAI Connector)
 * Uses hostedMcpTool from @openai/agents - no manual implementation needed
 */
export const shopifyMcpHandler: McpHandler = {
    id: 'openai-shopify',
    name: 'Shopify (OpenAI Connector)',
    description: 'Access Shopify via OpenAI hosted MCP Connector. Manage products, orders, and customers.',
    metadata: {
        requiredSecrets: ['shopify_access_token'],
        docsUrl: 'https://platform.openai.com/docs/mcp',
        apiKeyUrl: 'https://partners.shopify.com/',
        setupInstructions: '1. Create a Shopify app\n2. Configure API access\n3. Add "shopify_access_token" secret with access token',
    },
    defaultConfig: {
        requireApproval: 'never',
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        throw new Error('Shopify handler uses hostedMcpTool - connection is handled automatically');
    },
};

