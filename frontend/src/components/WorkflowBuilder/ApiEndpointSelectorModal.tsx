import React, { useState, useEffect, useRef } from 'react';
import type { ApiIntegration, ApiEndpoint } from '../../types/apiIntegrations';
import { loadApiIntegrations } from '../../config/apiIntegrations';

interface ApiEndpointSelectorModalProps {
  position: { x: number; y: number };
  onSelectEndpoint: (apiId: string, endpointId: string, endpoint: ApiEndpoint) => void;
  onClose: () => void;
}

export const ApiEndpointSelectorModal: React.FC<ApiEndpointSelectorModalProps> = ({
  position,
  onSelectEndpoint,
  onClose,
}) => {
  const [apiIntegrations, setApiIntegrations] = useState<ApiIntegration[]>([]);
  const [selectedApi, setSelectedApi] = useState<ApiIntegration | null>(null);
  const [selectedEndpointIndex, setSelectedEndpointIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load API integrations on mount
  useEffect(() => {
    console.log('[ApiEndpointSelectorModal] Component mounted, loading API integrations...');
    loadApiIntegrations().then(integrations => {
      console.log('[ApiEndpointSelectorModal] API integrations loaded', { count: integrations.length });
      setApiIntegrations(integrations);
      setLoading(false);
      // Auto-select first API if available
      if (integrations.length > 0) {
        console.log('[ApiEndpointSelectorModal] Auto-selecting first API', { apiName: integrations[0].name });
        setSelectedApi(integrations[0]);
      } else {
        console.warn('[ApiEndpointSelectorModal] No API integrations available');
      }
    });
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!selectedApi) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedEndpointIndex(prev => 
          Math.min(prev + 1, selectedApi.endpoints.length - 1)
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedEndpointIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && selectedApi.endpoints[selectedEndpointIndex]) {
        e.preventDefault();
        const endpoint = selectedApi.endpoints[selectedEndpointIndex];
        onSelectEndpoint(selectedApi.id, endpoint.id, endpoint);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedApi, selectedEndpointIndex, onSelectEndpoint, onClose]);

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

  // Reset endpoint selection when API changes
  useEffect(() => {
    setSelectedEndpointIndex(0);
  }, [selectedApi]);

  if (loading) {
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
        className="bg-white rounded-lg shadow-2xl border border-gray-200 w-[800px] h-[600px] flex items-center justify-center"
      >
        <div className="text-gray-500">Loading API integrations...</div>
      </div>
    );
  }

  if (apiIntegrations.length === 0) {
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
        className="bg-white rounded-lg shadow-2xl border border-gray-200 w-[800px] h-[600px] flex items-center justify-center"
      >
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium mb-2">No API integrations available</p>
          <p className="text-sm">API integrations need to be configured in registry.json</p>
        </div>
      </div>
    );
  }

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
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Select API Endpoint</h2>
        <p className="text-xs text-gray-500 mt-1">
          Use ↑↓ to navigate, Enter to select, Esc to cancel
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: API List */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto bg-gray-50">
          <div className="p-2">
            {apiIntegrations.map((api) => (
              <button
                key={api.id}
                onClick={() => setSelectedApi(api)}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 rounded-lg transition-colors mb-2 ${
                  selectedApi?.id === api.id
                    ? 'bg-blue-500 text-white shadow-md'
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
            ))}
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
                    onClick={() => onSelectEndpoint(selectedApi.id, endpoint.id, endpoint)}
                    onMouseEnter={() => setSelectedEndpointIndex(index)}
                    className={`w-full px-4 py-3 text-left transition-colors mb-2 rounded-lg border ${
                      index === selectedEndpointIndex
                        ? 'bg-blue-50 border-blue-500 border-l-4'
                        : 'hover:bg-gray-50 border-gray-200 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                        endpoint.method === 'GET' ? 'bg-green-100 text-green-700' :
                        endpoint.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                        endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                        endpoint.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
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
      </div>
    </div>
  );
};

export default ApiEndpointSelectorModal;

