import type { McpHandler, McpHandlerContext, McpConnection } from '..';

/**
 * SharePoint MCP Handler (OpenAI Connector)
 * Uses hostedMcpTool from @openai/agents - no manual implementation needed
 */
export const sharepointMcpHandler: McpHandler = {
    id: 'openai-sharepoint',
    name: 'SharePoint (OpenAI Connector)',
    description: 'Access SharePoint via OpenAI hosted MCP Connector. Manage sites, lists, and items.',
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
        throw new Error('SharePoint handler uses hostedMcpTool - connection is handled automatically');
    },
};
