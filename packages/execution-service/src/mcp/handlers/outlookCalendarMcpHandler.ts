import type { McpHandler, McpHandlerContext, McpConnection } from '..';

/**
 * Outlook Calendar MCP Handler (OpenAI Connector)
 * Uses hostedMcpTool from @openai/agents - no manual implementation needed
 */
export const outlookCalendarMcpHandler: McpHandler = {
    id: 'openai-outlook-calendar',
    name: 'Outlook Calendar (OpenAI Connector)',
    description: 'Access Outlook Calendar via OpenAI hosted MCP Connector. Manage events and calendars.',
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
        throw new Error('Outlook Calendar handler uses hostedMcpTool - connection is handled automatically');
    },
};
