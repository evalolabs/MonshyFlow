/**
 * ToolCatalog Component
 * 
 * Displays available tools that can be connected to Agent nodes.
 * Tools are shown in a catalog format and can be dragged or clicked to add.
 */

import { useState } from 'react';
import { toolCatalog } from '../../types/toolCatalog';

interface ToolCatalogProps {
  onAddTool: (toolId: string) => void;
}

const toolCategories = [
  { id: 'chatkit', name: 'ChatKit', icon: '💬' },
  { id: 'hosted', name: 'Hosted', icon: '☁️' },
  { id: 'local', name: 'Local', icon: '🛠️' },
];

const colorClasses: Record<string, string> = {
  purple: 'bg-purple-500 border-purple-600',
  blue: 'bg-blue-500 border-blue-600',
  pink: 'bg-pink-500 border-pink-600',
  green: 'bg-green-500 border-green-600',
  indigo: 'bg-indigo-500 border-indigo-600',
  amber: 'bg-amber-500 border-amber-600',
  teal: 'bg-teal-500 border-teal-600',
  yellow: 'bg-yellow-500 border-yellow-600',
};

export function ToolCatalog({ onAddTool }: ToolCatalogProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(toolCategories.map(cat => cat.id))
  );
  const [searchTerm, setSearchTerm] = useState('');

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
    setExpandedCategories(new Set(toolCategories.map(cat => cat.id)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // Filter tools by search term
  const filteredTools = searchTerm
    ? toolCatalog.filter(tool =>
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : toolCatalog;

  // Group tools by category
  const toolsByCategory = toolCategories.map(category => ({
    ...category,
    tools: filteredTools.filter(tool => tool.category === category.id),
  }));

  return (
    <div className="h-full p-2 space-y-2 overflow-y-auto">
      {/* Search Bar */}
      <div className="mb-2">
        <input
          type="text"
          placeholder="🔍 Search tools..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
        />
      </div>

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

      {/* Tool Categories */}
      <div className="space-y-1.5">
        {toolsByCategory.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const hasTools = category.tools.length > 0;

          if (!hasTools) return null;

          return (
            <div key={category.id} className="border border-gray-200 rounded-lg">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className={`w-full px-2 py-1.5 text-left flex items-center justify-between rounded-t-lg transition-colors ${
                  isExpanded
                    ? 'bg-amber-50 text-amber-800'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{category.icon}</span>
                  <span className="font-medium text-xs">{category.name}</span>
                  <span className="text-xs text-gray-500">({category.tools.length})</span>
                </div>
                <span className={`text-xs transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Category Content */}
              {isExpanded && (
                <div className="p-2 border-t border-gray-200 bg-white">
                  <div className="grid grid-cols-1 gap-2">
                    {category.tools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => onAddTool(tool.id)}
                        className="group relative bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 rounded-lg p-2 transition-all duration-200 flex items-center gap-2 text-left shadow-sm hover:shadow-md"
                        title={tool.description}
                      >
                        {/* Circular Tool Icon */}
                        <div
                          className={`w-10 h-10 rounded-full ${colorClasses[tool.color] || 'bg-gray-500'} border-2 flex items-center justify-center text-white text-lg flex-shrink-0 shadow-md group-hover:scale-110 transition-transform`}
                        >
                          {tool.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-xs text-gray-800">{tool.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {tool.description}
                          </div>
                        </div>
                        <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
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

      {/* Info Box */}
      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>💡 Tip:</strong> Tools can only be connected to Agent nodes at the "Tool" input handle.
          Drag a tool to an Agent node or click to add it to the canvas.
        </p>
      </div>
    </div>
  );
}

