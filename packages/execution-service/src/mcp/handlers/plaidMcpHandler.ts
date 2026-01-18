import type { McpHandler, McpHandlerContext, McpConnection } from '..';

/**
 * Plaid MCP Handler (OpenAI Connector)
 * Uses hostedMcpTool from @openai/agents - no manual implementation needed
 */
export const plaidMcpHandler: McpHandler = {
    id: 'openai-plaid',
    name: 'Plaid (OpenAI Connector)',
    description: 'Access Plaid via OpenAI hosted MCP Connector. Connect to bank accounts and financial data.',
    metadata: {
        requiredSecrets: ['plaid_client_id', 'plaid_secret'],
        docsUrl: 'https://platform.openai.com/docs/mcp',
        apiKeyUrl: 'https://dashboard.plaid.com/developers/keys',
        setupInstructions: '1. Create a Plaid account\n2. Get your client ID and secret from the dashboard\n3. Add "plaid_client_id" and "plaid_secret" secrets',
    },
    defaultConfig: {
        requireApproval: 'never',
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        throw new Error('Plaid handler uses hostedMcpTool - connection is handled automatically');
    },
};

