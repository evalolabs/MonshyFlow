import type { McpHandler, McpHandlerContext, McpConnection } from '..';

/**
 * Cloudflare Browser MCP Handler (OpenAI Connector)
 * Uses hostedMcpTool from @openai/agents - no manual implementation needed
 */
export const cloudflareBrowserMcpHandler: McpHandler = {
    id: 'openai-cloudflare-browser',
    name: 'Cloudflare Browser (OpenAI Connector)',
    description: 'Access Cloudflare Browser via OpenAI hosted MCP Connector. Browse and interact with web pages.',
    metadata: {
        requiredSecrets: ['cloudflare_api_token'],
        docsUrl: 'https://platform.openai.com/docs/mcp',
        apiKeyUrl: 'https://dash.cloudflare.com/profile/api-tokens',
        setupInstructions: '1. Create a Cloudflare account\n2. Generate an API token\n3. Add "cloudflare_api_token" secret with API token',
    },
    defaultConfig: {
        requireApproval: 'never',
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        throw new Error('Cloudflare Browser handler uses hostedMcpTool - connection is handled automatically');
    },
};

