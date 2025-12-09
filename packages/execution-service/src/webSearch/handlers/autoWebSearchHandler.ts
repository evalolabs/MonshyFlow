import type { WebSearchConnection, WebSearchHandler, WebSearchResponse, WebSearchQuery } from '..';

class AutoPlaceholderConnection implements WebSearchConnection {
    async search(query: WebSearchQuery): Promise<WebSearchResponse> {
        throw new Error(
            'Auto web search routing is not yet configured. Please select a specific provider or contact an administrator to set up global web search keys.'
        );
    }
}

export const autoWebSearchHandler: WebSearchHandler = {
    id: 'auto',
    name: 'Auto (Placeholder)',
    description: 'Future provider selection based on cost/availability. Currently returns an informative error.',
    metadata: {
        supportsAuto: true,
        docsUrl: 'https://docs.monshy.com/web-search/auto-routing',
    },
    async connect() {
        return new AutoPlaceholderConnection();
    },
};
