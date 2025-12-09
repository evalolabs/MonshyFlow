import type { McpHandler, McpHandlerContext, McpConnection } from '..';

/**
 * Google Calendar MCP Handler (OpenAI Connector)
 * Uses hostedMcpTool from @openai/agents - no manual implementation needed
 */
export const googleCalendarMcpHandler: McpHandler = {
    id: 'openai-google-calendar',
    name: 'Google Calendar (OpenAI Connector)',
    description: 'Access Google Calendar via OpenAI hosted MCP Connector. Manage events and calendars.',
    metadata: {
        requiredSecrets: ['google_oauth_token'],
        docsUrl: 'https://platform.openai.com/docs/mcp',
        apiKeyUrl: 'https://console.cloud.google.com/apis/credentials',
        setupInstructions: '1. Create a Google Cloud project\n2. Enable Google Calendar API\n3. Create OAuth 2.0 credentials\n4. Add "google_oauth_token" secret with OAuth token',
    },
    defaultConfig: {
        requireApproval: 'never',
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        throw new Error('Google Calendar handler uses hostedMcpTool - connection is handled automatically');
    },
};
