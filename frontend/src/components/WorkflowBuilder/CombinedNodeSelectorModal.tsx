import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ApiIntegration, ApiEndpoint } from '../../types/apiIntegrations';
import { loadApiIntegrations } from '../../config/apiIntegrations';
import { nodeCategories } from '../../types/nodeCategories';

interface CombinedNodeSelectorModalProps {
  position: { x: number; y: number };
  onSelectNode: (nodeType: string) => void;
  onSelectApiEndpoint: (apiId: string, endpointId: string, endpoint: ApiEndpoint) => void;
  onClose: () => void;
}

type TabType = 'apis' | 'nodes';

export const CombinedNodeSelectorModal: React.FC<CombinedNodeSelectorModalProps> = ({
  position,
  onSelectNode,
  onSelectApiEndpoint,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('apis');
  
  // API Integrations state
  const [apiIntegrations, setApiIntegrations] = useState<ApiIntegration[]>([]);
  const [selectedApi, setSelectedApi] = useState<ApiIntegration | null>(null);
  const [selectedEndpointIndex, setSelectedEndpointIndex] = useState(0);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiSearchTerm, setApiSearchTerm] = useState('');
  const [selectedApiIndex, setSelectedApiIndex] = useState(0);
  const apiSearchInputRef = useRef<HTMLInputElement>(null);
  
  // Nodes state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(0);
  const nodeSearchInputRef = useRef<HTMLInputElement>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Flatten all nodes from categories
  const allNodes = nodeCategories.flatMap(category =>
    category.nodes.map(node => ({
      type: node.id,
      label: node.name,
      icon: node.icon,
      description: node.description,
      category: category.name,
    }))
  );

  // Filter nodes based on search
  const filteredNodes = allNodes.filter(
    node =>
      (node.label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (node.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter and sort API integrations based on search
  const filteredApiIntegrations = useMemo(() => {
    if (!apiSearchTerm.trim()) {
      return apiIntegrations;
    }

    const searchLower = apiSearchTerm.toLowerCase().trim();
    const scored = apiIntegrations
      .map(api => {
        const nameLower = (api.name || '').toLowerCase();
        const descLower = (api.description || '').toLowerCase();
        
        // Check if matches
        const nameMatches = nameLower.includes(searchLower);
        const descMatches = descLower.includes(searchLower);
        
        if (!nameMatches && !descMatches) {
          return null;
        }

        // Calculate relevance score (higher = better match)
        let score = 0;
        
        // Exact name match gets highest score
        if (nameLower === searchLower) {
          score = 1000;
        }
        // Name starts with search term
        else if (nameLower.startsWith(searchLower)) {
          score = 500 + (nameLower.length - searchLower.length); // Shorter names get slightly higher score
        }
        // Name contains search term
        else if (nameMatches) {
          const index = nameLower.indexOf(searchLower);
          score = 300 - index; // Earlier in name = higher score
        }
        // Only description matches
        else if (descMatches) {
          score = 100;
        }

        return { api, score };
      })
      .filter((item): item is { api: ApiIntegration; score: number } => item !== null)
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .map(item => item.api);

    return scored;
  }, [apiIntegrations, apiSearchTerm]);

  // Load API integrations on mount
  useEffect(() => {
    loadApiIntegrations().then(integrations => {
      setApiIntegrations(integrations);
      setApiLoading(false);
      if (integrations.length > 0) {
        setSelectedApi(integrations[0]);
      }
    });
  }, []);

  // Adjust selected API index when filtered list changes
  useEffect(() => {
    if (filteredApiIntegrations.length > 0) {
      const validIndex = Math.min(selectedApiIndex, filteredApiIntegrations.length - 1);
      if (validIndex !== selectedApiIndex) {
        setSelectedApiIndex(validIndex);
      }
    }
  }, [filteredApiIntegrations.length]);

  // Update selected API when index or filtered list changes
  useEffect(() => {
    if (filteredApiIntegrations.length > 0 && selectedApiIndex < filteredApiIntegrations.length) {
      setSelectedApi(filteredApiIntegrations[selectedApiIndex]);
    } else if (filteredApiIntegrations.length === 0) {
      setSelectedApi(null);
    }
  }, [selectedApiIndex, filteredApiIntegrations]);

  // Reset API selection when search changes
  useEffect(() => {
    setSelectedApiIndex(0);
  }, [apiSearchTerm]);

  // Reset endpoint selection when API changes
  useEffect(() => {
    setSelectedEndpointIndex(0);
  }, [selectedApi]);

  // Reset node selection when search changes
  useEffect(() => {
    setSelectedNodeIndex(0);
  }, [searchTerm]);

  // Auto-focus search input when tab is active
  useEffect(() => {
    if (activeTab === 'nodes' && nodeSearchInputRef.current) {
      nodeSearchInputRef.current.focus();
    } else if (activeTab === 'apis' && apiSearchInputRef.current) {
      apiSearchInputRef.current.focus();
    }
  }, [activeTab]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (activeTab === 'apis') {
        // API tab navigation
        // Check if search input is focused
        const isSearchFocused = document.activeElement === apiSearchInputRef.current;
        
        if (isSearchFocused) {
          // If typing in search, don't handle arrow keys
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            // Move focus away from search to allow navigation
            apiSearchInputRef.current?.blur();
          }
          return;
        }

        // Navigate in API list
        if (e.key === 'ArrowDown' && filteredApiIntegrations.length > 0) {
          e.preventDefault();
          setSelectedApiIndex(prev => Math.min(prev + 1, filteredApiIntegrations.length - 1));
        } else if (e.key === 'ArrowUp' && filteredApiIntegrations.length > 0) {
          e.preventDefault();
          setSelectedApiIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Tab' && selectedApi) {
          // Tab to switch between API list and endpoint list
          e.preventDefault();
          // This will be handled by the endpoint navigation
        } else if (selectedApi && e.key === 'Enter') {
          // If an endpoint is selected, select it; otherwise select the API
          if (selectedApi.endpoints[selectedEndpointIndex]) {
            e.preventDefault();
            const endpoint = selectedApi.endpoints[selectedEndpointIndex];
            onSelectApiEndpoint(selectedApi.id, endpoint.id, endpoint);
            onClose();
          }
        }
        
        // Endpoint navigation (when not in search)
        if (selectedApi && !isSearchFocused) {
          if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
            // Focus on endpoints - handled by mouse or separate navigation
          } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
            // Focus back on API list
            apiSearchInputRef.current?.focus();
          }
        }
      } else {
        // Nodes tab navigation
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedNodeIndex(prev => Math.min(prev + 1, filteredNodes.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedNodeIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && filteredNodes[selectedNodeIndex]) {
          e.preventDefault();
          const selectedNode = filteredNodes[selectedNodeIndex];
          console.log('[CombinedNodeSelectorModal] Enter pressed on node:', selectedNode.type, selectedNode);
          console.log('[CombinedNodeSelectorModal] Calling onSelectNode with:', selectedNode.type);
          onSelectNode(selectedNode.type);
          console.log('[CombinedNodeSelectorModal] Calling onClose');
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, selectedApi, selectedEndpointIndex, selectedNodeIndex, filteredNodes, filteredApiIntegrations, selectedApiIndex, onSelectNode, onSelectApiEndpoint, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [onClose]);

  return (
    <div
      ref={modalRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: 10000,
      }}
      className="bg-white rounded-lg shadow-2xl border border-gray-200 w-[800px] h-[600px] flex flex-col animate-in fade-in zoom-in duration-200"
    >
      {/* Header with Tabs */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Add Node</h2>
          <p className="text-xs text-gray-500">
            Use ↑↓ to navigate, Enter to select, Esc to cancel
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('apis')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'apis'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            🔌 API Integrations
          </button>
          <button
            onClick={() => setActiveTab('nodes')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'nodes'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            ⚡ Nodes
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'apis' ? (
          // API Integrations Tab
          <>
            {/* Left: API List */}
            <div className="w-1/2 border-r border-gray-200 flex flex-col bg-gray-50">
              {/* Search Header */}
              <div className="p-3 border-b border-gray-200 bg-white">
                <div className="relative">
                  <input
                    ref={apiSearchInputRef}
                    type="text"
                    value={apiSearchTerm}
                    onChange={(e) => setApiSearchTerm(e.target.value)}
                    placeholder="Search API integrations..."
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* API List */}
              <div className="flex-1 overflow-y-auto p-2">
                {apiLoading ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    Loading API integrations...
                  </div>
                ) : filteredApiIntegrations.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    {apiSearchTerm ? (
                      <>
                        <p className="font-medium mb-2">No API integrations found</p>
                        <p className="text-xs">No results for "{apiSearchTerm}"</p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium mb-2">No API integrations available</p>
                        <p className="text-xs">API integrations need to be configured in registry.json</p>
                      </>
                    )}
                  </div>
                ) : (
                  filteredApiIntegrations.map((api, index) => (
                    <button
                      key={api.id}
                      onClick={() => {
                        setSelectedApi(api);
                        setSelectedApiIndex(index);
                      }}
                      onMouseEnter={() => setSelectedApiIndex(index)}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 rounded-lg transition-colors mb-2 ${
                        selectedApi?.id === api.id
                          ? 'bg-blue-500 text-white shadow-md'
                          : index === selectedApiIndex
                          ? 'bg-blue-50 border-2 border-blue-300'
                          : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-200'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
                        api.logoUrl 
                          ? 'bg-white p-1' 
                          : 'bg-gradient-to-br from-blue-400 to-purple-500 text-white text-lg font-bold'
                      }`}>
                        {api.logoUrl ? (
                          <img 
                            src={api.logoUrl} 
                            alt={api.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              // Fallback to emoji if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = api.icon;
                                parent.className = 'flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold shadow-sm';
                              }
                            }}
                          />
                        ) : (
                          api.icon
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold ${selectedApi?.id === api.id ? 'text-white' : 'text-gray-800'}`}>
                          {api.name}
                        </div>
                        <div className={`text-xs truncate ${selectedApi?.id === api.id ? 'text-blue-100' : 'text-gray-500'}`}>
                          {api.description}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-gray-200 bg-white text-xs text-gray-500">
                {filteredApiIntegrations.length} API{filteredApiIntegrations.length !== 1 ? 's' : ''} available
              </div>
            </div>

            {/* Right: Endpoint List */}
            <div className="w-1/2 overflow-y-auto">
              {selectedApi ? (
                <div className="p-2">
                  <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 sticky top-0">
                    <h3 className="text-sm font-semibold text-gray-700">
                      {selectedApi.name} Endpoints
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedApi.endpoints.length} endpoint{selectedApi.endpoints.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                  {selectedApi.endpoints.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                      No endpoints available for {selectedApi.name}
                    </div>
                  ) : (
                    selectedApi.endpoints.map((endpoint, index) => (
                      <button
                        key={endpoint.id}
                        onClick={() => {
                          onSelectApiEndpoint(selectedApi.id, endpoint.id, endpoint);
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedEndpointIndex(index)}
                        className={`w-full px-4 py-3 text-left transition-colors mb-2 rounded-lg border cursor-pointer ${
                          index === selectedEndpointIndex
                            ? 'bg-blue-50 border-blue-500 border-l-4'
                            : 'hover:bg-gray-50 border-gray-200 border-l-4 border-l-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 min-w-[3.5rem] h-8 rounded flex items-center justify-center text-[10px] font-semibold px-2 ${
                            endpoint.method === 'GET' ? 'bg-green-200 text-green-900' :
                            endpoint.method === 'POST' ? 'bg-blue-200 text-blue-900' :
                            endpoint.method === 'PUT' ? 'bg-amber-200 text-amber-900' :
                            endpoint.method === 'DELETE' ? 'bg-red-200 text-red-900' :
                            'bg-gray-200 text-gray-900'
                          }`}>
                            {endpoint.method}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-800">
                              {endpoint.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {endpoint.description}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 font-mono truncate">
                              {endpoint.path}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Select an API to view endpoints
                </div>
              )}
            </div>
          </>
        ) : (
          // Nodes Tab
          <div className="w-full flex flex-col">
            {/* Search Header */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <input
                  ref={nodeSearchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search nodes..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Node List */}
            <div className="flex-1 overflow-y-auto py-2">
              {filteredNodes.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No nodes found for "{searchTerm}"
                </div>
              ) : (
                filteredNodes.map((node, index) => (
                  <button
                    key={node.type}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectNode(node.type);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedNodeIndex(index)}
                    className={`w-full px-4 py-2.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                      index === selectedNodeIndex
                        ? 'bg-blue-50 border-l-2 border-blue-500'
                        : 'hover:bg-gray-50 border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      {node.icon || node.label.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800">
                        {node.label}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {node.description}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {node.category}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
              {filteredNodes.length} node{filteredNodes.length !== 1 ? 's' : ''} available
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CombinedNodeSelectorModal;

