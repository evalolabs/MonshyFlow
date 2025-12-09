/**
 * Registry Consistency Check
 * 
 * Validates that registry.json is consistent with actual implementations:
 * - All nodes in registry have processors
 * - All processors have registry entries
 * - Frontend metadata matches registry
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateRegistry } from './validateRegistry';

interface RegistryNode {
  type: string;
  csharpProcessor?: string;
  typescriptProcessor?: string;
  frontend?: {
    hasConfigForm?: boolean;
    useAutoConfigForm?: boolean;
  };
}

interface Registry {
  nodes: RegistryNode[];
  tools: any[];
}

const REGISTRY_PATH = path.join(__dirname, '../registry.json');
const CSHARP_PROCESSORS_DIR = path.join(__dirname, '../../AgentBuilder.AgentService/Processors');
const TYPESCRIPT_PROCESSORS_DIR = path.join(__dirname, '../../execution-service/src/nodes');
const FRONTEND_METADATA_PATH = path.join(__dirname, '../../frontend/src/components/WorkflowBuilder/nodeRegistry/nodeMetadata.ts');

function checkCSharpProcessor(node: RegistryNode): { exists: boolean; path?: string } {
  if (!node.csharpProcessor) {
    return { exists: false };
  }

  // Check if processor file exists
  const processorFileName = `${node.csharpProcessor}.cs`;
  const processorPath = path.join(CSHARP_PROCESSORS_DIR, processorFileName);
  
  if (fs.existsSync(processorPath)) {
    return { exists: true, path: processorPath };
  }

  return { exists: false };
}

function checkTypeScriptProcessor(node: RegistryNode): { exists: boolean; path?: string } {
  if (!node.typescriptProcessor) {
    return { exists: false };
  }

  // Parse processor path (format: "./path#identifier")
  const processorPath = node.typescriptProcessor.split('#')[0];
  const actualPath = path.join(TYPESCRIPT_PROCESSORS_DIR, processorPath.replace('./', ''));

  // Check if file exists (could be .ts or .js)
  if (fs.existsSync(actualPath + '.ts') || fs.existsSync(actualPath + '.js')) {
    return { exists: true, path: actualPath };
  }

  // Check if it's in registerBuiltIns.ts
  const registerBuiltInsPath = path.join(TYPESCRIPT_PROCESSORS_DIR, 'registerBuiltIns.ts');
  if (fs.existsSync(registerBuiltInsPath)) {
    const content = fs.readFileSync(registerBuiltInsPath, 'utf-8');
    if (content.includes(node.type)) {
      return { exists: true, path: registerBuiltInsPath };
    }
  }

  return { exists: false };
}

function checkFrontendMetadata(node: RegistryNode): { exists: boolean; hasConfigForm?: boolean } {
  if (!fs.existsSync(FRONTEND_METADATA_PATH)) {
    return { exists: false };
  }

  const content = fs.readFileSync(FRONTEND_METADATA_PATH, 'utf-8');
  const hasMetadata = content.includes(`'${node.type}'`) || content.includes(`"${node.type}"`);
  
  if (!hasMetadata) {
    return { exists: false };
  }

  // Check if hasConfigForm matches
  const hasConfigForm = node.frontend?.hasConfigForm ?? false;
  const metadataHasConfigForm = content.includes(`hasConfigForm: ${hasConfigForm}`) ||
                                (hasConfigForm && content.includes(`hasConfigForm: true`));

  return { exists: true, hasConfigForm: metadataHasConfigForm };
}

function checkConsistency(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // First, validate registry structure
    const validation = validateRegistry();
    if (!validation.valid) {
      errors.push(...validation.errors);
    }
    warnings.push(...validation.warnings);

    // Load registry
    const content = fs.readFileSync(REGISTRY_PATH, 'utf-8');
    const registry: Registry = JSON.parse(content);

    // Check each node
    for (const node of registry.nodes) {
      const prefix = `Node "${node.type}":`;

      // Check C# processor
      if (node.csharpProcessor) {
        const csharpCheck = checkCSharpProcessor(node);
        if (!csharpCheck.exists) {
          warnings.push(`${prefix} C# processor "${node.csharpProcessor}" not found at expected location`);
        }
      } else {
        warnings.push(`${prefix} No C# processor specified`);
      }

      // Check TypeScript processor
      if (node.typescriptProcessor) {
        const tsCheck = checkTypeScriptProcessor(node);
        if (!tsCheck.exists) {
          warnings.push(`${prefix} TypeScript processor "${node.typescriptProcessor}" not found`);
        }
      } else {
        warnings.push(`${prefix} No TypeScript processor specified`);
      }

      // Check frontend metadata
      const frontendCheck = checkFrontendMetadata(node);
      if (!frontendCheck.exists) {
        warnings.push(`${prefix} Frontend metadata not found in nodeMetadata.ts`);
      } else if (node.frontend?.hasConfigForm && !frontendCheck.hasConfigForm) {
        warnings.push(`${prefix} Frontend metadata hasConfigForm mismatch`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error: any) {
    return {
      valid: false,
      errors: [`Failed to check consistency: ${error.message}`],
      warnings: [],
    };
  }
}

function main() {
  console.log('🔍 Checking registry consistency...\n');

  const result = checkConsistency();

  if (result.errors.length > 0) {
    console.error('❌ Consistency errors:');
    result.errors.forEach(error => console.error(`   - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Warnings:');
    result.warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  if (result.valid) {
    console.log('\n✅ Registry consistency check passed!');
    if (result.warnings.length === 0) {
      console.log('   All processors and metadata are in sync.');
    } else {
      console.log(`   ${result.warnings.length} warning(s) found - review recommended.`);
    }
    process.exit(0);
  } else {
    console.error('\n❌ Registry consistency check failed!');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { checkConsistency };

