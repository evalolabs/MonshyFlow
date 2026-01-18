import type { McpHandler, McpHandlerContext, McpConnection } from '..';

/**
 * Pipedream MCP Handler (OpenAI Connector)
 * Uses hostedMcpTool from @openai/agents - no manual implementation needed
 */
export const pipedreamMcpHandler: McpHandler = {
    id: 'openai-pipedream',
    name: 'Pipedream (OpenAI Connector)',
    description: 'Access Pipedream via OpenAI hosted MCP Connector. Trigger workflows and manage integrations.',
    metadata: {
        requiredSecrets: ['pipedream_api_key'],
        docsUrl: 'https://platform.openai.com/docs/mcp',
        apiKeyUrl: 'https://pipedream.com/settings/account',
        setupInstructions: '1. Create a Pipedream account\n2. Generate an API key\n3. Add "pipedream_api_key" secret with API key',
    },
    defaultConfig: {
        requireApproval: 'never',
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        throw new Error('Pipedream handler uses hostedMcpTool - connection is handled automatically');
    },
};

