import type { McpHandler, McpHandlerContext, McpConnection } from '..';

/**
 * Zapier MCP Handler (OpenAI Connector)
 * Uses hostedMcpTool from @openai/agents - no manual implementation needed
 */
export const zapierMcpHandler: McpHandler = {
    id: 'openai-zapier',
    name: 'Zapier (OpenAI Connector)',
    description: 'Access Zapier via OpenAI hosted MCP Connector. Trigger and manage Zaps.',
    metadata: {
        requiredSecrets: ['zapier_api_key'],
        docsUrl: 'https://platform.openai.com/docs/mcp',
        apiKeyUrl: 'https://zapier.com/app/settings/integrations',
        setupInstructions: '1. Create a Zapier account\n2. Generate an API key\n3. Add "zapier_api_key" secret with your API key',
    },
    defaultConfig: {
        requireApproval: 'never',
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        throw new Error('Zapier handler uses hostedMcpTool - connection is handled automatically');
    },
};

