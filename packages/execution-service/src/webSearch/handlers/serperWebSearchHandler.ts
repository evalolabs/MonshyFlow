import axios from 'axios';
import type { WebSearchConnection, WebSearchHandler, WebSearchHandlerContext, WebSearchQuery, WebSearchResponse, WebSearchResultItem } from '..';

const SERPER_ENDPOINT = 'https://google.serper.dev/search';
const MAX_RESULTS = 10;

class SerperWebSearchConnection implements WebSearchConnection {
    constructor(private readonly apiKey: string) {}

    async search(query: WebSearchQuery): Promise<WebSearchResponse> {
        if (!query?.query || typeof query.query !== 'string') {
            throw new Error('Serper search requires a non-empty query string.');
        }

        const payload: Record<string, any> = {
            q: query.query,
        };

        if (query.maxResults) {
            payload.num = Math.min(Math.max(Number(query.maxResults) || 1, 1), MAX_RESULTS);
        }

        if (query.location) {
            payload.location = query.location;
        }

        if (query.filters?.allowedDomains && query.filters.allowedDomains.length > 0) {
            payload.domain = query.filters.allowedDomains.join(',');
        }

        try {
            const response = await axios.post(SERPER_ENDPOINT, payload, {
                headers: {
                    'X-API-KEY': this.apiKey,
                    'Content-Type': 'application/json',
                },
                timeout: 8000,
            });

            const organicResults: any[] = response.data?.organic ?? [];
            const results: WebSearchResultItem[] = organicResults.slice(0, payload.num ?? MAX_RESULTS).map(item => ({
                title: item.title || item.link || 'Untitled result',
                snippet: item.snippet || item.highlight || '',
                url: item.link || item.url || '',
                source: item.source,
            }));

            return {
                query: query.query,
                results,
                raw: response.data,
            } satisfies WebSearchResponse;
        } catch (error: any) {
            const status = error?.response?.status;
            const detail = (() => {
                try {
                    return JSON.stringify(error?.response?.data);
                } catch {
                    return error?.message;
                }
            })();
            throw new Error(`Serper web search failed${status ? ` (${status})` : ''}: ${detail}`);
        }
    }
}

const resolveApiKey = (config: any, context: WebSearchHandlerContext): string | undefined => {
    const secretCandidates = [
        config?.apiKeySecret,
        'serper_api_key',
        'serper',
    ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

    for (const secretName of secretCandidates) {
        const value = context.secrets?.[secretName];
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
    }

    return undefined;
};

export const serperWebSearchHandler: WebSearchHandler = {
    id: 'serper',
    name: 'Serper (Google Search)',
    description: 'Uses the Serper.dev API to retrieve Google search results.',
    defaultConfig: {
        maxResults: 5,
    },
    metadata: {
        requiredSecrets: ['serper_api_key'],
        docsUrl: 'https://serper.dev/',
        apiKeyUrl: 'https://serper.dev/api-key',
        setupInstructions: '1. Registriere dich auf serper.dev\n2. Erstelle einen API Key\n3. Füge den Key als Secret "serper_api_key" hinzu',
    },
    async connect(config, context) {
        const apiKey = resolveApiKey(config, context);
        if (!apiKey) {
            throw new Error('Serper API key is missing. Provide a secret named "serper_api_key" or configure apiKeySecret on the node.');
        }

        return new SerperWebSearchConnection(apiKey);
    },
};
