import type { McpHandler, McpHandlerContext, McpConnection } from '..';

/**
 * Microsoft Teams MCP Handler (OpenAI Connector)
 * Uses hostedMcpTool from @openai/agents - no manual implementation needed
 */
export const teamsMcpHandler: McpHandler = {
    id: 'openai-teams',
    name: 'Microsoft Teams (OpenAI Connector)',
    description: 'Access Microsoft Teams via OpenAI hosted MCP Connector. Send messages and manage channels.',
    metadata: {
        requiredSecrets: ['microsoft_oauth_token'],
        docsUrl: 'https://platform.openai.com/docs/mcp',
        apiKeyUrl: 'https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade',
        setupInstructions: '1. Create an Azure AD app registration\n2. Configure Microsoft Graph API permissions\n3. Add "microsoft_oauth_token" secret with OAuth token',
    },
    defaultConfig: {
        requireApproval: 'never',
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        throw new Error('Microsoft Teams handler uses hostedMcpTool - connection is handled automatically');
    },
};
