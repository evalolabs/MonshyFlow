/**
 * Automatic Node Processor Discovery
 * 
 * Automatically discovers and registers node processors based on file naming conventions.
 * This eliminates the need for manual registration in registerBuiltIns.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { registerNodeProcessor } from './index';
import type { NodeProcessor } from './index';

/**
 * Discover node processors from files matching pattern: *NodeProcessor.ts
 * Files should export a default processor or named export matching the file name
 */
export async function discoverNodeProcessors(): Promise<void> {
  const processorsDir = path.join(__dirname, '../nodes');
  
  // Check if directory exists
  if (!fs.existsSync(processorsDir)) {
    console.warn('[AutoDiscovery] Processors directory not found:', processorsDir);
    return;
  }

  // Find all files matching *NodeProcessor.ts pattern
  const files = fs.readdirSync(processorsDir)
    .filter(file => file.endsWith('NodeProcessor.ts') || file.endsWith('NodeProcessor.js'));

  console.log(`[AutoDiscovery] Found ${files.length} potential processor files`);

  for (const file of files) {
    try {
      // Extract node type from filename (e.g., "MyNodeProcessor.ts" -> "my-node")
      const nodeType = extractNodeTypeFromFilename(file);
      
      if (!nodeType) {
        console.warn(`[AutoDiscovery] Could not extract node type from filename: ${file}`);
        continue;
      }

      // Try to import the processor
      const filePath = path.join(processorsDir, file);
      const module = await import(filePath);

      // Look for processor export
      let processor: NodeProcessor | undefined;

      // Check for default export
      if (module.default && typeof module.default === 'object') {
        processor = module.default as NodeProcessor;
      }
      // Check for named export matching pattern
      else if (module[nodeType]) {
        processor = module[nodeType] as NodeProcessor;
      }
      // Check for any processor-like export
      else {
        const exports = Object.keys(module);
        const processorExport = exports.find(exp => 
          exp.toLowerCase().includes('processor') || 
          exp.toLowerCase().includes(nodeType)
        );
        if (processorExport) {
          processor = module[processorExport] as NodeProcessor;
        }
      }

      if (
        processor &&
        typeof processor.type === 'string' &&
        typeof processor.process === 'function'
      ) {
        registerNodeProcessor(processor);
        console.log(`[AutoDiscovery] ✅ Registered processor: ${nodeType} from ${file}`);
      } else {
        console.warn(`[AutoDiscovery] ⚠️  File ${file} does not export a valid processor`);
      }
    } catch (error: any) {
      console.error(`[AutoDiscovery] ❌ Error loading processor from ${file}:`, error.message);
    }
  }
}

/**
 * Extract node type from filename
 * Examples:
 * - "StartNodeProcessor.ts" -> "start"
 * - "HttpRequestNodeProcessor.ts" -> "http-request"
 * - "MyCustomNodeProcessor.ts" -> "my-custom"
 */
function extractNodeTypeFromFilename(filename: string): string | null {
  // Remove extension
  const name = filename.replace(/\.(ts|js)$/, '');
  
  // Remove "NodeProcessor" suffix
  const withoutSuffix = name.replace(/NodeProcessor$/i, '');
  
  if (!withoutSuffix) {
    return null;
  }

  // Convert PascalCase to kebab-case
  // e.g., "HttpRequest" -> "http-request"
  return withoutSuffix
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Initialize auto-discovery on module load
 */
if (require.main !== module) {
  // Only run discovery if not being run directly
  discoverNodeProcessors().catch(err => {
    console.error('[AutoDiscovery] Failed to discover processors:', err);
  });
}

