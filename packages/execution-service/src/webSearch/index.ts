export interface WebSearchHandlerContext {
    workflow: any;
    node: any;
    secrets: Record<string, string>;
}

export interface WebSearchQuery {
    query: string;
    maxResults?: number;
    location?: string;
    filters?: {
        allowedDomains?: string[];
    };
}

export interface WebSearchResultItem {
    title: string;
    snippet: string;
    url: string;
    source?: string;
}

export interface WebSearchResponse {
    query: string;
    results: WebSearchResultItem[];
    raw?: any;
}

export interface WebSearchConnection {
    search(query: WebSearchQuery): Promise<WebSearchResponse>;
    dispose?(): Promise<void> | void;
}

export interface WebSearchHandlerMetadata {
    requiredSecrets?: string[];
    docsUrl?: string;
    apiKeyUrl?: string;
    setupInstructions?: string;
    supportsAuto?: boolean;
}

export interface WebSearchHandler {
    id: string;
    name: string;
    description: string;
    defaultConfig?: {
        providerUrl?: string;
        requireApproval?: 'auto' | 'always' | 'never';
        maxResults?: number;
    };
    metadata?: WebSearchHandlerMetadata;
    connect(config: any, context: WebSearchHandlerContext): Promise<WebSearchConnection>;
}

const registry = new Map<string, WebSearchHandler>();

export const registerWebSearchHandler = (handler: WebSearchHandler) => {
    if (registry.has(handler.id)) {
        console.warn(`[WebSearch Registry] Handler with ID "${handler.id}" already registered. Overwriting.`);
    }
    registry.set(handler.id, handler);
    console.log(`[WebSearch Registry] Registered web search handler: ${handler.name}`);
};

export const getWebSearchHandler = (id?: string | null): WebSearchHandler | undefined => {
    if (!id) {
        return undefined;
    }
    return registry.get(id);
};

export const listWebSearchHandlers = (): WebSearchHandler[] => Array.from(registry.values());
