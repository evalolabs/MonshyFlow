/**
 * Registry Validator
 * 
 * Validates registry.json for consistency and completeness
 */

import * as fs from 'fs';
import * as path from 'path';

type AnimationSpeed = 'fast' | 'slow';

interface RegistryNode {
  type: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  animationSpeed?: AnimationSpeed;
  csharpProcessor?: string;
  typescriptProcessor?: string;
  frontend?: {
    hasConfigForm?: boolean;
    useAutoConfigForm?: boolean;
    fields?: Record<string, any>;
  };
}

interface Registry {
  version: string;
  nodes: RegistryNode[];
  tools: any[];
}

const REGISTRY_PATH = path.join(__dirname, '../registry.json');
const REQUIRED_CATEGORIES = ['core', 'ai', 'logic', 'data', 'integration', 'utility', 'tools'];

function validateRegistry(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const content = fs.readFileSync(REGISTRY_PATH, 'utf-8');
    const registry: Registry = JSON.parse(content);

    // Validate structure
    if (!registry.version) {
      errors.push('Registry missing version field');
    }

    if (!Array.isArray(registry.nodes)) {
      errors.push('Registry.nodes must be an array');
    }

    if (!Array.isArray(registry.tools)) {
      errors.push('Registry.tools must be an array');
    }

    // Validate nodes
    const nodeTypes = new Set<string>();
    registry.nodes.forEach((node, index) => {
      const prefix = `Node[${index}] (${node.type || 'unknown'}):`;

      if (!node.type) {
        errors.push(`${prefix} Missing type`);
      } else if (nodeTypes.has(node.type)) {
        errors.push(`${prefix} Duplicate type "${node.type}"`);
      } else {
        nodeTypes.add(node.type);
      }

      if (!node.name) {
        errors.push(`${prefix} Missing name`);
      }

      if (!node.icon) {
        warnings.push(`${prefix} Missing icon`);
      }

      if (!node.description) {
        warnings.push(`${prefix} Missing description`);
      }

      if (!node.category) {
        errors.push(`${prefix} Missing category`);
      } else if (!REQUIRED_CATEGORIES.includes(node.category)) {
        warnings.push(`${prefix} Unknown category "${node.category}"`);
      }

      // Validate animation speed
      if (node.animationSpeed && !['fast', 'slow'].includes(node.animationSpeed)) {
        errors.push(`${prefix} Invalid animationSpeed "${node.animationSpeed}" (expected "fast" or "slow")`);
      }

      // Check processor registration
      if (!node.csharpProcessor && !node.typescriptProcessor) {
        warnings.push(`${prefix} No processor defined (neither C# nor TypeScript)`);
      }

      // Validate frontend config
      if (node.frontend?.useAutoConfigForm && !node.frontend?.fields) {
        warnings.push(`${prefix} useAutoConfigForm is true but no fields defined`);
      }

      if (node.frontend?.fields) {
        Object.entries(node.frontend.fields).forEach(([fieldName, fieldConfig]: [string, any]) => {
          if (!fieldConfig.type) {
            errors.push(`${prefix} Field "${fieldName}" missing type`);
          }

          const validTypes = ['text', 'expression', 'select', 'number', 'textarea', 'secret', 'smtpProfile'];
          if (fieldConfig.type && !validTypes.includes(fieldConfig.type)) {
            errors.push(`${prefix} Field "${fieldName}" has invalid type "${fieldConfig.type}"`);
          }

          if (fieldConfig.type === 'select' && !fieldConfig.options) {
            errors.push(`${prefix} Field "${fieldName}" is select type but missing options`);
          }
        });
      }
    });

    // Validate tools
    const toolTypes = new Set<string>();
    registry.tools.forEach((tool, index) => {
      const prefix = `Tool[${index}] (${tool.type || 'unknown'}):`;

      if (!tool.type) {
        errors.push(`${prefix} Missing type`);
      } else if (toolTypes.has(tool.type)) {
        errors.push(`${prefix} Duplicate type "${tool.type}"`);
      } else {
        toolTypes.add(tool.type);
      }

      if (!tool.typescriptCreator) {
        warnings.push(`${prefix} No TypeScript creator defined`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error: any) {
    return {
      valid: false,
      errors: [`Failed to parse registry: ${error.message}`],
      warnings: [],
    };
  }
}

function main() {
  console.log('🔍 Validating registry...\n');

  const result = validateRegistry();

  if (result.errors.length > 0) {
    console.error('❌ Validation errors:');
    result.errors.forEach(error => console.error(`   - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Warnings:');
    result.warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  if (result.valid) {
    console.log('\n✅ Registry is valid!');
    process.exit(0);
  } else {
    console.error('\n❌ Registry validation failed!');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { validateRegistry };

