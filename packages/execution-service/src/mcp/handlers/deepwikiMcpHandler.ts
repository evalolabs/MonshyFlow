import type { McpHandler, McpHandlerContext, McpConnection } from '..';

/**
 * DeepWiki (Devin) MCP Handler (OpenAI Connector)
 * Uses hostedMcpTool from @openai/agents - no manual implementation needed
 */
export const deepwikiMcpHandler: McpHandler = {
    id: 'openai-deepwiki',
    name: 'DeepWiki (Devin) (OpenAI Connector)',
    description: 'Access DeepWiki via OpenAI hosted MCP Connector. Search and retrieve information from DeepWiki.',
    metadata: {
        requiredSecrets: ['deepwiki_api_key'],
        docsUrl: 'https://platform.openai.com/docs/mcp',
        apiKeyUrl: 'https://www.deepwiki.ai/',
        setupInstructions: '1. Create a DeepWiki account\n2. Generate an API key\n3. Add "deepwiki_api_key" secret with API key',
    },
    defaultConfig: {
        requireApproval: 'never',
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        throw new Error('DeepWiki handler uses hostedMcpTool - connection is handled automatically');
    },
};

