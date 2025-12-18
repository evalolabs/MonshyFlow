/**
 * Node Categories
 * 
 * This file now dynamically generates categories from the Node Registry.
 * This means new nodes automatically appear in the UI without manual updates.
 */

import { getNodesByCategory, type NodeMetadata } from '../components/WorkflowBuilder/nodeRegistry/nodeMetadata';

export interface NodeCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  nodes: NodeType[];
}

export interface NodeType {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

// Category metadata
const CATEGORY_INFO: Record<string, { name: string; icon: string; color: string }> = {
  core: { name: 'Core', icon: '⚡', color: 'blue' },
  ai: { name: 'AI', icon: '🤖', color: 'purple' },
  logic: { name: 'Logic', icon: '⚙️', color: 'blue' },
  data: { name: 'Data', icon: '📊', color: 'purple' },
  integration: { name: 'Integration', icon: '🌐', color: 'cyan' },
  utility: { name: 'Utility', icon: '🔧', color: 'yellow' },
  tools: { name: 'Tools', icon: '🔧', color: 'yellow' },
};

/**
 * Generate node categories from the registry
 * This ensures new nodes automatically appear in the UI
 */
export function generateNodeCategories(): NodeCategory[] {
  const nodesByCategory = getNodesByCategory();
  
  return Object.entries(nodesByCategory).map(([categoryId, nodes]) => {
    const categoryInfo = CATEGORY_INFO[categoryId] || {
      name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
      icon: '📦',
      color: 'gray',
    };
    
    return {
      id: categoryId,
      name: categoryInfo.name,
      icon: categoryInfo.icon,
      color: categoryInfo.color,
      nodes: nodes
        // No legacy workflows: hide old loop nodes in UI
        .filter((node: NodeMetadata) => node.id !== 'while' && node.id !== 'foreach')
        .map((node: NodeMetadata) => ({
          id: node.id,
          name: node.name,
          icon: node.icon,
          color: categoryInfo.color,
          description: node.description,
        })),
    };
  }).filter(category => category.nodes.length > 0); // Only include categories with nodes
}

/**
 * Static node categories (for backwards compatibility)
 * Now generated from registry
 */
export const nodeCategories: NodeCategory[] = generateNodeCategories();
