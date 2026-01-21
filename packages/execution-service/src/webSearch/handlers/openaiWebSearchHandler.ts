import type { WebSearchHandler, WebSearchHandlerContext, WebSearchConnection, WebSearchQuery, WebSearchResponse } from '..';

/**
 * Virtual handler for OpenAI Hosted Web Search Tool
 * 
 * This handler doesn't actually create a connection, as OpenAI's webSearchTool()
 * is a Hosted Tool that runs on OpenAI's servers. This handler exists only to
 * provide metadata for the UI dropdown.
 * 
 * The actual tool creation happens in registerBuiltIns.ts where webSearchTool()
 * is called directly.
 */
class OpenAIWebSearchConnection implements WebSearchConnection {
    async search(query: WebSearchQuery): Promise<WebSearchResponse> {
        // This should never be called, as OpenAI Web Search uses webSearchTool() directly
        throw new Error('OpenAI Web Search is a Hosted Tool and should not use the connection interface. Use webSearchTool() from @openai/agents instead.');
    }
}

export const openaiWebSearchHandler: WebSearchHandler = {
    id: 'openai',
    name: 'OpenAI Web Search (Hosted)',
    description: 'Uses OpenAI\'s hosted web search tool. Runs on OpenAI servers, no additional API keys required. Works best with gpt-4o-search-preview or gpt-4o models.',
    defaultConfig: {
        maxResults: 10,
    },
    metadata: {
        requiredSecrets: [], // No additional secrets needed, uses OpenAI API key
        docsUrl: 'https://platform.openai.com/docs/guides/web-search',
        setupInstructions: 'OpenAI Web Search is a hosted tool that runs on OpenAI servers. No additional setup required - it uses your OpenAI API key. Works best with gpt-4o-search-preview or gpt-4o models.',
    },
    async connect(config, context) {
        // Return a dummy connection - this should never be used
        // The actual tool uses webSearchTool() directly in registerBuiltIns.ts
        return new OpenAIWebSearchConnection();
    },
};

