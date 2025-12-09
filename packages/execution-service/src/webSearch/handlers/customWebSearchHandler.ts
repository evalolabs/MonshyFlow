import axios, { AxiosRequestConfig, Method } from 'axios';
import type { WebSearchConnection, WebSearchHandler, WebSearchHandlerContext, WebSearchQuery, WebSearchResponse, WebSearchResultItem } from '..';

const DEFAULT_TIMEOUT = 10000;

interface CustomHandlerConfig {
    providerUrl: string;
    method?: Method;
    headers?: Record<string, string>;
    queryParam?: string;
    bodyTemplate?: Record<string, any>;
    resultsPath?: string;
    titleKey?: string;
    snippetKey?: string;
    urlKey?: string;
}

const interpolateSecrets = (value: string, secrets: Record<string, string>): string => {
    return value.replace(/\{\{\s*secret:([a-zA-Z0-9_\-]+)\s*\}\}/g, (_, secretName: string) => {
        const resolved = secrets?.[secretName];
        return typeof resolved === 'string' ? resolved : '';
    });
};

const parseRecordConfig = (value: any): Record<string, any> | undefined => {
    if (!value) {
        return undefined;
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed as Record<string, any>;
            }
        } catch (error) {
            console.warn('[CustomWebSearchHandler] Failed to parse JSON configuration value', { value, error });
        }
        return undefined;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, any>;
    }

    return undefined;
};

const getNestedValue = (obj: any, path: string): any => {
    if (!path) return obj;
    return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
};

class CustomWebSearchConnection implements WebSearchConnection {
    constructor(private readonly config: CustomHandlerConfig, private readonly secrets: Record<string, string>) {}

    async search(query: WebSearchQuery): Promise<WebSearchResponse> {
        if (!this.config.providerUrl) {
            throw new Error('Custom web search provider URL is not configured.');
        }

        const method = (this.config.method || 'POST').toUpperCase() as Method;
        const headers: Record<string, string> = {};
        Object.entries(this.config.headers || {}).forEach(([key, value]) => {
            if (typeof value === 'string') {
                headers[key] = interpolateSecrets(value, this.secrets);
            }
        });

        const requestConfig: AxiosRequestConfig = {
            url: this.config.providerUrl,
            method,
            headers,
            timeout: DEFAULT_TIMEOUT,
        };

        if (method === 'GET') {
            requestConfig.params = {
                [this.config.queryParam || 'q']: query.query,
                maxResults: query.maxResults,
                location: query.location,
            };
        } else {
            const body: Record<string, any> = {
                ...(this.config.bodyTemplate || {}),
                query: query.query,
            };

            if (query.maxResults) {
                body.maxResults = query.maxResults;
            }

            if (query.location) {
                body.location = query.location;
            }

            requestConfig.data = body;
        }

        try {
            const response = await axios(requestConfig);
            const rawResults = getNestedValue(response.data, this.config.resultsPath || 'results') || [];

            const titleKey = this.config.titleKey || 'title';
            const snippetKey = this.config.snippetKey || 'snippet';
            const urlKey = this.config.urlKey || 'url';

            const results: WebSearchResultItem[] = Array.isArray(rawResults)
                ? rawResults.map((item: any) => ({
                      title: item?.[titleKey] || item?.[urlKey] || 'Untitled result',
                      snippet: item?.[snippetKey] || '',
                      url: item?.[urlKey] || item?.link || '',
                      source: item?.source,
                  }))
                : [];

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
            throw new Error(`Custom web search provider request failed${status ? ` (${status})` : ''}: ${detail}`);
        }
    }
}

export const customWebSearchHandler: WebSearchHandler = {
    id: 'custom-web-search',
    name: 'Custom Web Search Provider',
    description: 'Forward search queries to a configurable HTTP endpoint.',
    metadata: {
        docsUrl: 'https://docs.monshy.com/web-search/custom-provider',
    },
    async connect(config: any, context: WebSearchHandlerContext) {
        const providerUrl = typeof config?.providerUrl === 'string' ? config.providerUrl.trim() : '';
        if (!providerUrl) {
            throw new Error('Custom web search requires `providerUrl` to be configured.');
        }

        const normalizedConfig: CustomHandlerConfig = {
            providerUrl,
            method: typeof config?.method === 'string' ? (config.method.toUpperCase() as Method) : 'POST',
            headers: parseRecordConfig(config?.headers),
            queryParam: typeof config?.queryParam === 'string' ? config.queryParam : undefined,
            bodyTemplate: parseRecordConfig(config?.bodyTemplate),
            resultsPath: typeof config?.resultsPath === 'string' ? config.resultsPath : undefined,
            titleKey: typeof config?.titleKey === 'string' ? config.titleKey : undefined,
            snippetKey: typeof config?.snippetKey === 'string' ? config.snippetKey : undefined,
            urlKey: typeof config?.urlKey === 'string' ? config.urlKey : undefined,
        };

        return new CustomWebSearchConnection(normalizedConfig, context.secrets ?? {});
    },
};
