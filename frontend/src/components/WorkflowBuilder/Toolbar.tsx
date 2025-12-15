import { useState } from 'react';
import { nodeCategories } from '../../types/nodeCategories';

interface ToolbarProps {
  onAddNode: (type: string) => void;
  onToggleDebug?: () => void;
  showDebugPanel?: boolean;
  autoSaving?: boolean;
}

export function Toolbar({ onAddNode, onToggleDebug, showDebugPanel }: ToolbarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(nodeCategories.map(cat => cat.id))
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(nodeCategories.map(cat => cat.id)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  return (
    <div className="h-full p-2 space-y-2 overflow-y-auto">
            {/* Expand/Collapse buttons */}
            <div className="flex gap-1 mb-2">
              <button
                onClick={expandAll}
                className="px-1.5 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                title="Expand All"
              >
                ⬇️
              </button>
              <button
                onClick={collapseAll}
                className="px-1.5 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                title="Collapse All"
              >
                ⬆️
              </button>
            </div>

      {/* Accordion Categories */}
      <div className="space-y-1.5">
        {nodeCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          
          return (
            <div key={category.id} className="border border-gray-200 rounded-lg">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className={`w-full px-2 py-1.5 text-left flex items-center justify-between rounded-t-lg transition-colors ${
                  isExpanded 
                    ? `bg-${category.color}-50 text-${category.color}-800` 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{category.icon}</span>
                  <span className="font-medium text-xs">{category.name}</span>
                  <span className="text-xs text-gray-500">({category.nodes.length})</span>
                </div>
                <span className={`text-xs transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Category Content */}
              {isExpanded && (
                <div className="p-2 border-t border-gray-200 bg-white">
                  <div className="grid grid-cols-1 gap-1.5">
                    {category.nodes.map((node) => (
                      <button
                        key={node.id}
                        onClick={() => onAddNode(node.id)}
                        className={`bg-${node.color}-100 hover:bg-${node.color}-200 px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 text-left`}
                        title={node.description}
                      >
                        <span className="text-sm">{node.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-xs">{node.name}</div>
                          <div className="text-xs text-gray-500 truncate">{node.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

            {/* Debug Button - Keep only this action button in the sidebar */}
            {onToggleDebug && (
              <div className="border-t pt-2">
                <button
                  onClick={onToggleDebug}
                  className={`w-full px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border ${
                    showDebugPanel 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-md' 
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {showDebugPanel ? '🔍 Hide Debug Console' : '🔍 Show Debug Console'}
                </button>
              </div>
            )}
    </div>
  );
}