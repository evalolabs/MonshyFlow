/**
 * Auto-Discovery System
 * 
 * Automatically discovers and registers node types from the backend execution service.
 * This runs on app startup and keeps the frontend in sync with the backend.
 */

import { discoverNodes, convertToNodeMetadata, categorizeNode } from '../../../services/nodeDiscoveryService';
import { registerDiscoveredNode, isNodeTypeRegistered, getNodeMetadata } from './nodeMetadata';
import { registerNodeComponent, hasNodeComponent } from './nodeRegistry';
import type { NodeMetadata } from './nodeMetadata';
import { BaseNode } from '../NodeTypes/BaseNode';
import React from 'react';

/**
 * Default node component for auto-discovered nodes
 * Uses React.createElement since this is a .ts file (not .tsx)
 */
function DefaultNodeComponent({ data }: any) {
  const metadata = getNodeMetadata(data.type);
  
  // Ensure category is valid (BaseNode might not accept all NodeCategoryId values)
  const category = (metadata?.category === 'tools' ? 'utility' : metadata?.category) || 'utility';
  
  return React.createElement(BaseNode, {
    label: data.label || metadata?.name || data.type,
    icon: metadata?.icon || '📦',
    category: category as any, // Type assertion needed due to category type mismatch
    subtitle: data.subtitle,
    hasInput: metadata?.hasInput !== false,
    hasOutput: metadata?.hasOutput !== false,
  });
}

/**
 * Initialize auto-discovery
 * Should be called on app startup
 */
export async function initializeAutoDiscovery(): Promise<void> {
  try {
    console.log('[AutoDiscovery] Starting node discovery...');
    
    const discoveredNodes = await discoverNodes();
    console.log(`[AutoDiscovery] Discovered ${discoveredNodes.length} nodes from backend`);
    
    for (const node of discoveredNodes) {
      // Skip if already manually registered (manual takes priority)
      if (isNodeTypeRegistered(node.type)) {
        console.log(`[AutoDiscovery] Skipping ${node.type} - already manually registered`);
        continue;
      }
      
      // Categorize node
      const category = categorizeNode(node);
      
      // Convert to metadata
      const metadata = convertToNodeMetadata(node, category);
      
      // Register metadata
      registerDiscoveredNode(node.type, metadata as NodeMetadata);
      
      // Register default component if not already registered
      if (!hasNodeComponent(node.type)) {
        registerNodeComponent(node.type, DefaultNodeComponent);
        console.log(`[AutoDiscovery] Registered default component for ${node.type}`);
      }
      
      console.log(`[AutoDiscovery] Registered node: ${node.type} (${node.name})`);
    }
    
    console.log('[AutoDiscovery] Auto-discovery completed');
  } catch (error: any) {
    console.error('[AutoDiscovery] Failed to initialize auto-discovery:', error);
    // Don't throw - app should still work without auto-discovery
  }
}

