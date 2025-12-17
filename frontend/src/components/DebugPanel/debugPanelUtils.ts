/**
 * Debug Panel Utility Functions
 * 
 * Helper functions for debug panel functionality:
 * - Node metadata and category handling
 * - Node context detection (branches, loops, position)
 */

import type { Node, Edge } from '@xyflow/react';
import { NODE_METADATA_REGISTRY } from '../WorkflowBuilder/nodeRegistry/nodeMetadata';
import { findLoopBlockNodes, findBranchNodes } from '../../utils/nodeGroupingUtils';

/**
 * Format node type for display (e.g., "ifelse" -> "IfElse", "set-state" -> "Set State")
 */
export function formatNodeType(nodeType: string): string {
  if (nodeType === 'ifelse') return 'IfElse';
  if (nodeType === 'llm') return 'LLM';
  if (nodeType === 'api') return 'API';
  if (nodeType.includes('-')) {
    return nodeType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
}

/**
 * Get node metadata (icon, category, name) from registry or node data
 */
export function getNodeMetadata(nodeType: string, nodes?: Node[]): { icon: string; category: string; name: string } {
  const nodeMetadata = NODE_METADATA_REGISTRY[nodeType];
  if (nodeMetadata) {
    return {
      icon: nodeMetadata.icon || '📦',
      category: nodeMetadata.category || 'utility',
      name: nodeMetadata.name || formatNodeType(nodeType),
    };
  }
  if (nodes) {
    const node = nodes.find(n => n.type === nodeType);
    if (node?.data?.icon) {
      return {
        icon: String(node.data.icon),
        category: (node.data.category as string) || 'utility',
        name: (typeof node.data.label === 'string' ? node.data.label : formatNodeType(nodeType)),
      };
    }
  }
  return {
    icon: '📦',
    category: 'utility',
    name: formatNodeType(nodeType),
  };
}

/**
 * Get category color mapping for visual distinction
 */
export function getCategoryColor(category: string) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    core: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' },
    ai: { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-700' },
    logic: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700' },
    data: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700' },
    integration: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' },
    utility: { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-700' },
    tools: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700' },
  };
  return colors[category] || colors.utility;
}

/**
 * Get node context information (hierarchical: Main, IfElse(true)-Main, ForeEach-Child, etc.)
 * 
 * Determines the position of a node in the workflow hierarchy:
 * - Main: Node in main workflow
 * - IfElse(true)-Main: Node in true branch
 * - IfElse(false)-Main: Node in false branch
 * - ForeEach-Child: Node in loop body
 * - IfElse(true)-ForeEach-Child: Node in true branch that's inside a loop
 */
export function getNodeContext(nodeId: string, nodes?: Node[], edges?: Edge[]): string {
  if (!edges || !nodes) return 'Main';
  
  const contextStack: string[] = [];
  
  // First, check if node is in a loop body (must check all loop nodes)
  const loopNodes = nodes.filter(n => n.type === 'foreach' || n.type === 'while');
  for (const loopNode of loopNodes) {
    const loopBodyNodes = findLoopBlockNodes(loopNode.id, edges);
    if (loopBodyNodes.includes(nodeId)) {
      const loopType = loopNode.type === 'foreach' ? 'ForeEach' : 
                       loopNode.type === 'while' ? 'While' : 
                       formatNodeType(loopNode.type || '');
      contextStack.push(`${loopType}-Child`);
      
      // Check if the loop itself is in an If-Else branch
      const loopIncomingEdge = edges.find(e => e.target === loopNode.id);
      if (loopIncomingEdge?.sourceHandle === 'true') {
        contextStack.unshift('IfElse(true)');
      } else if (loopIncomingEdge?.sourceHandle === 'false') {
        contextStack.unshift('IfElse(false)');
      }
      
      // If we found a loop, we're done (loops are the innermost context)
      if (contextStack.length > 0) {
        return contextStack.length === 1 ? contextStack[0] : contextStack.join('-');
      }
    }
  }
  
  // If not in a loop, check if node is in an If-Else branch
  const ifElseNodes = nodes.filter(n => n.type === 'ifelse');
  for (const ifElseNode of ifElseNodes) {
    const trueBranchNodes = findBranchNodes(ifElseNode.id, 'true', edges);
    const falseBranchNodes = findBranchNodes(ifElseNode.id, 'false', edges);
    
    if (trueBranchNodes.includes(nodeId)) {
      contextStack.push('IfElse(true)');
      break;
    } else if (falseBranchNodes.includes(nodeId)) {
      contextStack.push('IfElse(false)');
      break;
    }
  }
  
  // If no context was found, it's in main workflow
  if (contextStack.length === 0) {
    return 'Main';
  }
  
  // Build final context string (add Main if not in loop)
  if (!contextStack.some(ctx => ctx.includes('-Child'))) {
    contextStack.push('Main');
  }
  
  return contextStack.join('-');
}

