import React, { useState, useEffect, useRef } from 'react';
import { nodeCategories } from '../../types/nodeCategories';

interface NodeSelectorPopupProps {
  position: { x: number; y: number };
  onSelectNode: (nodeType: string) => void;
  onClose: () => void;
}

export const NodeSelectorPopup: React.FC<NodeSelectorPopupProps> = ({
  position,
  onSelectNode,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Flatten all nodes from categories and map to expected format
  const allNodes = nodeCategories.flatMap(category =>
    category.nodes.map(node => ({
      type: node.id, // Use 'id' as 'type' for React Flow
      label: node.name, // Use 'name' as 'label'
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

  // Auto-focus search input
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredNodes.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredNodes[selectedIndex]) {
        e.preventDefault();
        onSelectNode(filteredNodes[selectedIndex].type);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredNodes, selectedIndex, onSelectNode, onClose]);

  // Close on click outside
  useEffect(() => {
    let isMounted = true;
    
    const handleClickOutside = (e: MouseEvent | PointerEvent) => {
      if (!isMounted) return;
      
      const target = e.target as Node;
      // Only close if click is outside the popup
      if (popupRef.current && !popupRef.current.contains(target)) {
        onClose();
      }
    };

    // Use capture phase to catch events before they bubble
    // Also use a small delay to avoid closing immediately when opening
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        // Use capture phase (true) to catch events before they bubble
        // This ensures we catch the event even if other handlers stop propagation
        document.addEventListener('mousedown', handleClickOutside, true);
        document.addEventListener('click', handleClickOutside, true);
        document.addEventListener('pointerdown', handleClickOutside, true);
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('pointerdown', handleClickOutside, true);
    };
  }, [onClose]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  return (
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: 10000,
      }}
      className="bg-white rounded-lg shadow-2xl border border-gray-200 w-80 max-h-96 flex flex-col animate-in fade-in zoom-in duration-200"
    >
      {/* Search Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <input
            ref={searchInputRef}
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
        <p className="text-xs text-gray-500 mt-2">
          Use ↑↓ to navigate, Enter to select, Esc to cancel
        </p>
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
              onClick={() => onSelectNode(node.type)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full px-4 py-2.5 text-left flex items-start gap-3 transition-colors ${
                index === selectedIndex
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
  );
};

export default NodeSelectorPopup;

