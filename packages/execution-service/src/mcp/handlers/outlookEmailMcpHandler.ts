import type { McpHandler, McpHandlerContext, McpConnection } from '..';

/**
 * Outlook Email MCP Handler (OpenAI Connector)
 * Uses hostedMcpTool from @openai/agents - no manual implementation needed
 */
export const outlookEmailMcpHandler: McpHandler = {
    id: 'openai-outlook-email',
    name: 'Outlook Email (OpenAI Connector)',
    description: 'Access Outlook Email via OpenAI hosted MCP Connector. Send, receive, and manage emails.',
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
        throw new Error('Outlook Email handler uses hostedMcpTool - connection is handled automatically');
    },
};
