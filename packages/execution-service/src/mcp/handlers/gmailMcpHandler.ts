import type { McpHandler, McpHandlerContext, McpConnection } from '..';

/**
 * Gmail MCP Handler (OpenAI Connector)
 * Uses hostedMcpTool from @openai/agents - no manual implementation needed
 * The actual connection is handled by hostedMcpTool in executionService.ts
 */
export const gmailMcpHandler: McpHandler = {
    id: 'openai-gmail',
    name: 'Gmail (OpenAI Connector)',
    description: 'Access Gmail via OpenAI hosted MCP Connector. Send, receive, and manage emails.',
    metadata: {
        requiredSecrets: ['google_oauth_token'],
        docsUrl: 'https://platform.openai.com/docs/mcp',
        apiKeyUrl: 'https://console.cloud.google.com/apis/credentials',
        setupInstructions: '1. Create a Google Cloud project\n2. Enable Gmail API\n3. Create OAuth 2.0 credentials\n4. Add "google_oauth_token" secret with OAuth token',
    },
    defaultConfig: {
        requireApproval: 'never',
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        // This handler is handled by hostedMcpTool in executionService.ts
        // This connect method is never called, but required by the interface
        throw new Error('Gmail handler uses hostedMcpTool - connection is handled automatically');
    },
};

