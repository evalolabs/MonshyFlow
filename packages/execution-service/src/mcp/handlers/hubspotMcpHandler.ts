import type { McpHandler, McpHandlerContext, McpConnection } from '..';

/**
 * HubSpot MCP Handler (OpenAI Connector)
 * Uses hostedMcpTool from @openai/agents - no manual implementation needed
 */
export const hubspotMcpHandler: McpHandler = {
    id: 'openai-hubspot',
    name: 'HubSpot (OpenAI Connector)',
    description: 'Access HubSpot via OpenAI hosted MCP Connector. Manage contacts, deals, and marketing campaigns.',
    metadata: {
        requiredSecrets: ['hubspot_api_key'],
        docsUrl: 'https://platform.openai.com/docs/mcp',
        apiKeyUrl: 'https://app.hubspot.com/private-apps',
        setupInstructions: '1. Create a HubSpot account\n2. Create a private app\n3. Add "hubspot_api_key" secret with API key',
    },
    defaultConfig: {
        requireApproval: 'never',
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        throw new Error('HubSpot handler uses hostedMcpTool - connection is handled automatically');
    },
};

