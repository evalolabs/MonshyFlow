import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FunctionDefinition } from '../../../services/functionService';
import { functionService } from '../../../services/functionService';
import type { McpHandlerSummary } from '../../../services/mcpService';
import { mcpService } from '../../../services/mcpService';
import type { WebSearchHandlerSummary } from '../../../services/webSearchService';
import { webSearchService } from '../../../services/webSearchService';

interface UseNodeCatalogsArgs {
  nodeType?: string;
  selectedNodeId?: string;
}

interface UseNodeCatalogsResult {
  functionCatalog: FunctionDefinition[];
  isLoadingFunctionCatalog: boolean;
  functionCatalogError: string | null;
  hasLoadedFunctionCatalog: boolean;
  reloadFunctionCatalog: () => Promise<void>;

  mcpHandlers: McpHandlerSummary[];
  isLoadingMcpHandlers: boolean;
  mcpHandlersError: string | null;
  hasLoadedMcpHandlers: boolean;
  reloadMcpHandlers: () => Promise<void>;

  webSearchHandlers: WebSearchHandlerSummary[];
  isLoadingWebSearchHandlers: boolean;
  webSearchHandlersError: string | null;
  hasLoadedWebSearchHandlers: boolean;
  reloadWebSearchHandlers: () => Promise<void>;
}

const FUNCTION_NODE_TYPE = 'tool-function';
const MCP_NODE_TYPE = 'tool-mcp-server';
const WEB_SEARCH_NODE_TYPES = new Set(['web-search', 'tool-web-search']);

export function useNodeCatalogs({
  nodeType,
  selectedNodeId,
}: UseNodeCatalogsArgs): UseNodeCatalogsResult {
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [functionCatalog, setFunctionCatalog] = useState<FunctionDefinition[]>([]);
  const [isLoadingFunctionCatalog, setIsLoadingFunctionCatalog] = useState(false);
  const [functionCatalogError, setFunctionCatalogError] = useState<string | null>(null);
  const functionCatalogLoadedRef = useRef(false);

  const [mcpHandlers, setMcpHandlers] = useState<McpHandlerSummary[]>([]);
  const [isLoadingMcpHandlers, setIsLoadingMcpHandlers] = useState(false);
  const [mcpHandlersError, setMcpHandlersError] = useState<string | null>(null);
  const mcpHandlersLoadedRef = useRef(false);

  const [webSearchHandlers, setWebSearchHandlers] = useState<WebSearchHandlerSummary[]>([]);
  const [isLoadingWebSearchHandlers, setIsLoadingWebSearchHandlers] = useState(false);
  const [webSearchHandlersError, setWebSearchHandlersError] = useState<string | null>(null);
  const webSearchHandlersLoadedRef = useRef(false);

  const isFunctionNodeType = nodeType === FUNCTION_NODE_TYPE;
  const isMcpNodeType = nodeType === MCP_NODE_TYPE;
  const isWebSearchNodeType = useMemo(() => WEB_SEARCH_NODE_TYPES.has(nodeType ?? ''), [nodeType]);

  // Debug logging
  useEffect(() => {
    console.log('[useNodeCatalogs] Hook state:', {
      nodeType,
      isFunctionNodeType,
      isMcpNodeType,
      isWebSearchNodeType,
      FUNCTION_NODE_TYPE,
      MCP_NODE_TYPE,
      WEB_SEARCH_NODE_TYPES: Array.from(WEB_SEARCH_NODE_TYPES),
    });
  }, [nodeType, isFunctionNodeType, isMcpNodeType, isWebSearchNodeType]);

  const loadFunctionCatalog = useCallback(async (isActiveRef?: { current: boolean }) => {
    setIsLoadingFunctionCatalog(true);
    setFunctionCatalogError(null);
    try {
      console.log('[useNodeCatalogs] Calling functionService.getAvailableFunctions()...');
      const catalog = await functionService.getAvailableFunctions();
      console.log('[useNodeCatalogs] Received catalog:', {
        length: catalog?.length || 0,
        catalog: catalog,
        isArray: Array.isArray(catalog),
      });
      const isActive = isActiveRef ? isActiveRef.current : mountedRef.current;
      if (!isActive) {
        console.log('[useNodeCatalogs] Component unmounted, skipping state update');
        return;
      }
      setFunctionCatalog(catalog);
      functionCatalogLoadedRef.current = true;
      console.log('[useNodeCatalogs] Function catalog state updated, length:', catalog?.length || 0);
    } catch (error: any) {
      console.error('[useNodeCatalogs] Error loading function catalog:', error);
      const isActive = isActiveRef ? isActiveRef.current : mountedRef.current;
      if (!isActive) {
        return;
      }
      setFunctionCatalogError(error?.message || 'Failed to load function catalog');
      throw error;
    } finally {
      const isActive = isActiveRef ? isActiveRef.current : mountedRef.current;
      if (isActive) {
        setIsLoadingFunctionCatalog(false);
        console.log('[useNodeCatalogs] Loading state set to false');
      }
    }
  }, []);

  const loadMcpHandlers = useCallback(async (isActiveRef?: { current: boolean }) => {
    setIsLoadingMcpHandlers(true);
    setMcpHandlersError(null);
    try {
      const handlers = await mcpService.getAvailableHandlers();
      const isActive = isActiveRef ? isActiveRef.current : mountedRef.current;
      if (!isActive) {
        return;
      }
      setMcpHandlers(handlers);
      mcpHandlersLoadedRef.current = true;
    } catch (error: any) {
      const isActive = isActiveRef ? isActiveRef.current : mountedRef.current;
      if (!isActive) {
        return;
      }
      setMcpHandlersError(error?.message || 'Failed to load MCP handlers');
      throw error;
    } finally {
      const isActive = isActiveRef ? isActiveRef.current : mountedRef.current;
      if (isActive) {
        setIsLoadingMcpHandlers(false);
      }
    }
  }, []);

  const loadWebSearchHandlers = useCallback(async (isActiveRef?: { current: boolean }) => {
    setIsLoadingWebSearchHandlers(true);
    setWebSearchHandlersError(null);
    try {
      const handlers = await webSearchService.getAvailableHandlers();
      const isActive = isActiveRef ? isActiveRef.current : mountedRef.current;
      if (!isActive) {
        return;
      }
      setWebSearchHandlers(handlers);
      webSearchHandlersLoadedRef.current = true;
    } catch (error: any) {
      const isActive = isActiveRef ? isActiveRef.current : mountedRef.current;
      if (!isActive) {
        return;
      }
      setWebSearchHandlersError(error?.message || 'Failed to load web search providers');
      throw error;
    } finally {
      const isActive = isActiveRef ? isActiveRef.current : mountedRef.current;
      if (isActive) {
        setIsLoadingWebSearchHandlers(false);
      }
    }
  }, []);

  useEffect(() => {
    console.log('[useNodeCatalogs] Function catalog effect:', {
      isFunctionNodeType,
      functionCatalogLoadedRef: functionCatalogLoadedRef.current,
      selectedNodeId,
    });
    
    if (!isFunctionNodeType) {
      functionCatalogLoadedRef.current = false;
      setFunctionCatalog([]);
      return;
    }

    if (functionCatalogLoadedRef.current) {
      console.log('[useNodeCatalogs] Function catalog already loaded, skipping');
      return;
    }

    console.log('[useNodeCatalogs] Loading function catalog...');
    const isActiveRef = { current: true };
    const fetchCatalog = async () => {
      try {
        await loadFunctionCatalog(isActiveRef);
        console.log('[useNodeCatalogs] Function catalog loaded successfully');
      } catch (error) {
        console.error('[useNodeCatalogs] Failed to load function catalog:', error);
        // errors handled in loader
      }
    };
    void fetchCatalog();
    return () => {
      isActiveRef.current = false;
    };
  }, [isFunctionNodeType, selectedNodeId, loadFunctionCatalog]);

  useEffect(() => {
    if (!isMcpNodeType) {
      mcpHandlersLoadedRef.current = false;
      setMcpHandlers([]);
      return;
    }

    if (mcpHandlersLoadedRef.current) {
      return;
    }

    const isActiveRef = { current: true };
    const fetchHandlers = async () => {
      try {
        await loadMcpHandlers(isActiveRef);
      } catch {
        // errors handled in loader
      }
    };
    void fetchHandlers();
    return () => {
      isActiveRef.current = false;
    };
  }, [isMcpNodeType, selectedNodeId, loadMcpHandlers]);

  useEffect(() => {
    if (!isWebSearchNodeType) {
      webSearchHandlersLoadedRef.current = false;
      setWebSearchHandlers([]);
      return;
    }

    if (webSearchHandlersLoadedRef.current) {
      return;
    }

    const isActiveRef = { current: true };
    const fetchHandlers = async () => {
      try {
        await loadWebSearchHandlers(isActiveRef);
      } catch {
        // errors handled in loader
      }
    };
    void fetchHandlers();
    return () => {
      isActiveRef.current = false;
    };
  }, [isWebSearchNodeType, selectedNodeId, loadWebSearchHandlers]);

  const reloadFunctionCatalog = useCallback(async () => {
    functionCatalogLoadedRef.current = false;
    await loadFunctionCatalog();
  }, [loadFunctionCatalog]);

  const reloadMcpHandlers = useCallback(async () => {
    mcpHandlersLoadedRef.current = false;
    await loadMcpHandlers();
  }, [loadMcpHandlers]);

  const reloadWebSearchHandlers = useCallback(async () => {
    webSearchHandlersLoadedRef.current = false;
    await loadWebSearchHandlers();
  }, [loadWebSearchHandlers]);

  return {
    functionCatalog,
    isLoadingFunctionCatalog,
    functionCatalogError,
    hasLoadedFunctionCatalog: functionCatalogLoadedRef.current,
    reloadFunctionCatalog,

    mcpHandlers,
    isLoadingMcpHandlers,
    mcpHandlersError,
    hasLoadedMcpHandlers: mcpHandlersLoadedRef.current,
    reloadMcpHandlers,

    webSearchHandlers,
    isLoadingWebSearchHandlers,
    webSearchHandlersError,
    hasLoadedWebSearchHandlers: webSearchHandlersLoadedRef.current,
    reloadWebSearchHandlers,
  };
}


