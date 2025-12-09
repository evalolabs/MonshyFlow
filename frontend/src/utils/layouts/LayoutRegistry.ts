/**
 * Layout Registry
 * 
 * Central registry for all layout strategies.
 * This allows easy registration and retrieval of layouts.
 * 
 * To add a new layout:
 * 1. Create a new layout file (e.g., LayoutV2.ts)
 * 2. Import it here
 * 3. Register it in the registry
 */

import type { LayoutStrategy, LayoutVersion } from './types';
import { LayoutV1 } from './LayoutV1';
import { LayoutV2 } from './LayoutV2';

/**
 * Registry of all available layout strategies
 */
const layoutRegistry = new Map<LayoutVersion, LayoutStrategy>();

// Register default layouts
layoutRegistry.set('v1', LayoutV1);
layoutRegistry.set('v2', LayoutV2);

/**
 * Register a new layout strategy
 * 
 * @param layout - The layout strategy to register
 */
export function registerLayout(layout: LayoutStrategy): void {
  layoutRegistry.set(layout.id as LayoutVersion, layout);
}

/**
 * Get a layout strategy by version ID
 * 
 * @param version - The layout version identifier
 * @returns The layout strategy, or undefined if not found
 */
export function getLayout(version: LayoutVersion): LayoutStrategy | undefined {
  return layoutRegistry.get(version);
}

/**
 * Get the default layout (currently V1)
 * 
 * @returns The default layout strategy
 */
export function getDefaultLayout(): LayoutStrategy {
  return LayoutV1;
}

/**
 * Get all registered layouts
 * 
 * @returns Array of all registered layout strategies
 */
export function getAllLayouts(): LayoutStrategy[] {
  return Array.from(layoutRegistry.values());
}

/**
 * Check if a layout version exists
 * 
 * @param version - The layout version to check
 * @returns True if the layout exists, false otherwise
 */
export function hasLayout(version: LayoutVersion): boolean {
  return layoutRegistry.has(version);
}

