/**
 * Registry Code Generator
 * 
 * Generates TypeScript and C# code from shared/registry.json
 * This ensures consistency across all systems.
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
  inputSchema?: any;
  outputSchema?: any;
  frontend?: {
    hasConfigForm?: boolean;
    useAutoConfigForm?: boolean;
    isUnique?: boolean;
    canDuplicate?: boolean;
    hasInput?: boolean;
    hasOutput?: boolean;
    configFormComponent?: string | null;
    fields?: Record<string, any>;
  };
  note?: string;
}

interface Registry {
  version: string;
  nodes: RegistryNode[];
}

const REGISTRY_PATH = path.join(__dirname, '../registry.json');
const FRONTEND_OUTPUT = path.join(__dirname, '../../frontend/src/components/WorkflowBuilder/nodeRegistry/generatedMetadata.ts');
const CSHARP_OUTPUT = path.join(__dirname, '../../AgentBuilder.AgentService/Processors/generatedNodeProcessorRegistration.cs');
const TYPESCRIPT_OUTPUT = path.join(__dirname, '../../execution-service/src/nodes/generatedRegisterBuiltIns.ts');
const REGISTER_BUILTINS_PATH = path.join(__dirname, '../../execution-service/src/nodes/registerBuiltIns.ts');

function loadRegistry(): Registry {
  const content = fs.readFileSync(REGISTRY_PATH, 'utf-8');
  return JSON.parse(content);
}

function generateFrontendMetadata(registry: Registry): string {
  const nodes = registry.nodes.map(node => {
    const frontend = node.frontend || {};
    const fields = frontend.fields ? JSON.stringify(frontend.fields, null, 8).split('\n').map((line, i) => i === 0 ? line : '      ' + line).join('\n') : undefined;
    const inputSchema = node.inputSchema ? JSON.stringify(node.inputSchema, null, 6).split('\n').map((line, i) => i === 0 ? line : '      ' + line).join('\n') : undefined;
    const outputSchema = node.outputSchema ? JSON.stringify(node.outputSchema, null, 6).split('\n').map((line, i) => i === 0 ? line : '      ' + line).join('\n') : undefined;
    
    return `  '${node.type}': {
    id: '${node.type}',
    name: '${node.name}',
    icon: '${node.icon}',
    description: '${node.description.replace(/'/g, "\\'")}',
    category: '${node.category}' as NodeCategoryId,
    animationSpeed: '${node.animationSpeed ?? 'fast'}',
    component: () => null, // Will be lazy-loaded
    hasConfigForm: ${frontend.hasConfigForm ?? false},
    useAutoConfigForm: ${frontend.useAutoConfigForm ?? false},
    ${frontend.isUnique !== undefined ? `isUnique: ${frontend.isUnique},` : ''}
    ${frontend.canDuplicate !== undefined ? `canDuplicate: ${frontend.canDuplicate},` : ''}
    ${frontend.hasInput !== undefined ? `hasInput: ${frontend.hasInput},` : ''}
    ${frontend.hasOutput !== undefined ? `hasOutput: ${frontend.hasOutput},` : ''}
    ${fields ? `fields: ${fields},` : ''}
    ${inputSchema ? `inputSchema: ${inputSchema},` : ''}
    ${outputSchema ? `outputSchema: ${outputSchema},` : ''}
  },`;
  }).join('\n');

  return `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * 
 * This file is generated from shared/registry.json
 * Run: npm run generate:registry
 * 
 * Last generated: ${new Date().toISOString()}
 */

import type { NodeCategoryId } from './nodeMetadata';

export const GENERATED_NODE_METADATA = {
${nodes}
};
`;
}

function generateCSharpRegistration(registry: Registry): string {
  // NOTE: C# Node Processors have been removed - all execution is now handled by TypeScript Execution Service
  // This file is kept for reference but is no longer used

  return `// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// 
// This file is generated from shared/registry.json
// Run: npm run generate:registry
//
// Last generated: ${new Date().toISOString()}
//
// NOTE: C# Node Processors have been removed.
// All workflow execution is now handled by the TypeScript Execution Service.
// This file is kept for reference but is no longer used in the codebase.

namespace AgentBuilder.AgentService.Processors;

/// <summary>
/// AUTO-GENERATED: Node processor registrations from registry.json
/// NOTE: This class is no longer used - execution is handled by TypeScript Execution Service
/// </summary>
public static partial class NodeProcessorRegistration
{
    /// <summary>
    /// Register all processors defined in registry.json
    /// NOTE: This method is no longer used - execution is handled by TypeScript Execution Service
    /// </summary>
    [System.Obsolete("Node processors have been removed. Execution is handled by TypeScript Execution Service.")]
    public static void RegisterFromRegistry(object serviceProvider, object registry)
    {
        // No-op: Node processors have been removed
        // All execution is now handled by the TypeScript Execution Service
    }
}
`;
}

function generateTypeScriptRegistration(registry: Registry): string {
  const nodesWithProcessors = registry.nodes.filter(node => node.typescriptProcessor);
  
  const registrations = nodesWithProcessors.map(node => {
    const processorPath = node.typescriptProcessor || './nodes/registerBuiltIns';
    const processorName = processorPath.split('#').pop() || node.type;
    
    return `// ${node.name} - ${node.description}
// Processor: ${processorPath}
// Note: This processor should be registered in ${processorPath}
// 
// To register this processor, add the following to registerBuiltIns.ts:
// 
// registerNodeProcessor({
//     type: '${node.type}',
//     name: '${node.name}',
//     description: '${node.description}',
//     processNodeData: async (node, input, context) => {
//         // TODO: Implement processor logic
//         // For now, just pass through the input
//         return input || createNodeData(
//             context.input || {},
//             node.id,
//             node.type || '${node.type}',
//             input?.metadata?.nodeId
//         );
//     },
// });`;
  }).join('\n\n');

  const nodesWithoutProcessors = registry.nodes.filter(node => !node.typescriptProcessor);
  const missingProcessors = nodesWithoutProcessors.length > 0 
    ? `\n// ⚠️  WARNING: The following nodes do not have TypeScript processors defined:\n${nodesWithoutProcessors.map(n => `//   - ${n.type} (${n.name})`).join('\n')}\n`
    : '';

  return `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * 
 * This file is generated from shared/registry.json
 * Run: npm run generate:registry
 * 
 * Last generated: ${new Date().toISOString()}
 * 
 * This file documents which processors should be registered.
 * The actual registration happens in the files referenced by typescriptProcessor.
 * 
 * IMPORTANT: This file is for documentation only. Processors must be manually
 * registered in registerBuiltIns.ts. Use this file as a reference for which
 * processors need to be implemented.
 */

${registrations}${missingProcessors}
/**
 * Registry Summary:
 * - Total nodes: ${registry.nodes.length}
 * - Nodes with TypeScript processors: ${nodesWithProcessors.length}
 * - Nodes without TypeScript processors: ${nodesWithoutProcessors.length}
 */
`;
}

/**
 * Extract already registered node types from registerBuiltIns.ts
 * Only counts nodes that are IMPLEMENTED (outside AUTO-GENERATED section)
 */
function getRegisteredNodeTypes(): Set<string> {
  const registeredTypes = new Set<string>();
  
  if (!fs.existsSync(REGISTER_BUILTINS_PATH)) {
    return registeredTypes;
  }
  
  try {
    const content = fs.readFileSync(REGISTER_BUILTINS_PATH, 'utf-8');
    
    // Find AUTO-GENERATED section boundaries
    const autoGeneratedStart = '// ============================================\n// AUTO-GENERATED REGISTRATIONS - DO NOT EDIT';
    const autoGeneratedEnd = '// ============================================\n// END AUTO-GENERATED REGISTRATIONS';
    
    const startIndex = content.indexOf(autoGeneratedStart);
    const endIndex = content.indexOf(autoGeneratedEnd);
    
    // Match pattern: type: 'node-type' or type: "node-type"
    const typeRegex = /type:\s*['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = typeRegex.exec(content)) !== null) {
      const nodeType = match[1];
      const matchIndex = match.index;
      
      // Skip if it's in a comment line
      const lineStart = content.lastIndexOf('\n', matchIndex) + 1;
      const beforeType = content.substring(lineStart, matchIndex);
      if (beforeType.trim().startsWith('//')) {
        continue;
      }
      
      // Only count if it's OUTSIDE the AUTO-GENERATED section
      // (i.e., it's a real implementation, not a template)
      if (startIndex === -1 || endIndex === -1) {
        // No AUTO-GENERATED section, all registrations are real
        registeredTypes.add(nodeType);
      } else if (matchIndex < startIndex || matchIndex > endIndex) {
        // Outside AUTO-GENERATED section = real implementation
        registeredTypes.add(nodeType);
      }
      // If inside AUTO-GENERATED section, skip it (it's just a template)
    }
  } catch (error: any) {
    console.warn(`⚠️  Could not parse registerBuiltIns.ts: ${error.message}`);
  }
  
  return registeredTypes;
}

/**
 * Extract template node types (nodes in AUTO-GENERATED section that need implementation)
 */
function getTemplateNodeTypes(): Set<string> {
  const templateTypes = new Set<string>();
  
  if (!fs.existsSync(REGISTER_BUILTINS_PATH)) {
    return templateTypes;
  }
  
  try {
    const content = fs.readFileSync(REGISTER_BUILTINS_PATH, 'utf-8');
    
    // Find AUTO-GENERATED section boundaries
    const autoGeneratedStart = '// ============================================\n// AUTO-GENERATED REGISTRATIONS - DO NOT EDIT';
    const autoGeneratedEnd = '// ============================================\n// END AUTO-GENERATED REGISTRATIONS';
    
    const startIndex = content.indexOf(autoGeneratedStart);
    const endIndex = content.indexOf(autoGeneratedEnd);
    
    // Only look for templates if AUTO-GENERATED section exists
    if (startIndex === -1 || endIndex === -1) {
      return templateTypes;
    }
    
    // Match pattern: type: 'node-type' or type: "node-type"
    const typeRegex = /type:\s*['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = typeRegex.exec(content)) !== null) {
      const nodeType = match[1];
      const matchIndex = match.index;
      
      // Skip if it's in a comment line
      const lineStart = content.lastIndexOf('\n', matchIndex) + 1;
      const beforeType = content.substring(lineStart, matchIndex);
      if (beforeType.trim().startsWith('//')) {
        continue;
      }
      
      // Only count if it's INSIDE the AUTO-GENERATED section (template)
      if (matchIndex >= startIndex && matchIndex <= endIndex) {
        templateTypes.add(nodeType);
      }
    }
  } catch (error: any) {
    console.warn(`⚠️  Could not parse registerBuiltIns.ts: ${error.message}`);
  }
  
  return templateTypes;
}

/**
 * Generate template registration code for a node
 */
function generateNodeRegistrationTemplate(node: RegistryNode): string {
  return `// ${node.name} Node Processor
// ${node.description}
// 
// ⚠️  TODO: Implement the processor logic below
// This is a template generated by npm run generate:registry
// Replace this template with your actual implementation
//
// Available in context:
//   - context.input: The workflow input data
//   - context.secrets: Object with resolved secrets (e.g., context.secrets.API_KEY)
//   - context.execution: Execution context with trace, workflow, etc.
//   - context.workflow: Workflow configuration
//
// Available helpers:
//   - createNodeData(data, nodeId, nodeType, previousNodeId): Create NodeData output
//   - extractData(nodeData): Extract data from NodeData
//   - expressionResolutionService.resolveExpressions(template, context, execution, nodeId): Resolve {{...}} expressions
//
// Example: Access node configuration
//   const delaySeconds = node.data?.delaySeconds || 1;
//
// Example: Resolve expressions in node data
//   const resolvedValue = expressionResolutionService.resolveExpressions(
//     node.data?.someField || '',
//     { input: input?.json || {}, steps: {}, secrets: context.secrets || {} },
//     context.execution,
//     node.id
//   );
//
registerNodeProcessor({
    type: '${node.type}',
    name: '${node.name}',
    description: '${node.description.replace(/'/g, "\\'")}',
    processNodeData: async (node, input, context) => {
        // TODO: Implement ${node.name} processor logic
        // 
        // Step 1: Extract configuration from node.data
        //   const configValue = node.data?.fieldName || defaultValue;
        //
        // Step 2: Resolve expressions if needed (e.g., {{steps.nodeId.json.field}})
        //   const resolvedValue = expressionResolutionService.resolveExpressions(
        //     configValue,
        //     { input: input?.json || {}, steps: {}, secrets: context.secrets || {} },
        //     context.execution,
        //     node.id
        //   );
        //
        // Step 3: Implement your node logic
        //   const result = await yourLogic(resolvedValue);
        //
        // Step 4: Return NodeData
        //   return createNodeData(
        //     result,
        //     node.id,
        //     node.type || '${node.type}',
        //     undefined  // previousNodeId: optional, set if you need to track the previous node
        //   );
        
        // TEMPLATE: For now, just pass through the input
        // Replace this with your actual implementation
        if (input) {
            return input;
        }
        
        return createNodeData(
            context.input || {},
            node.id,
            node.type || '${node.type}',
            undefined  // previousNodeId: optional, set if you need to track the previous node
        );
    },
    // Legacy method for backward compatibility (optional)
    // process: async (node, input, context) => {
    //     // Legacy implementation if needed
    //     return extractData(await this.processNodeData(node, input, context));
    // },
});`;
}

/**
 * Update registerBuiltIns.ts with new node registrations
 */
function updateRegisterBuiltIns(registry: Registry): { added: string[]; skipped: string[] } {
  const registeredTypes = getRegisteredNodeTypes();
  const nodesWithProcessors = registry.nodes.filter(n => n.typescriptProcessor);
  
  // Filter nodes that should be registered in registerBuiltIns.ts
  const nodesForRegisterBuiltIns = nodesWithProcessors.filter(node => {
    const processorPath = node.typescriptProcessor || './nodes/registerBuiltIns';
    return processorPath.startsWith('./nodes/registerBuiltIns') || processorPath === './nodes/registerBuiltIns';
  });
  
  // Find new nodes that aren't registered yet
  const newNodes = nodesForRegisterBuiltIns.filter(node => !registeredTypes.has(node.type));
  const skippedNodes = nodesForRegisterBuiltIns.filter(node => registeredTypes.has(node.type));
  
  if (newNodes.length === 0) {
    return { added: [], skipped: skippedNodes.map(n => n.type) };
  }
  
  // Read existing file
  let existingContent = '';
  if (fs.existsSync(REGISTER_BUILTINS_PATH)) {
    existingContent = fs.readFileSync(REGISTER_BUILTINS_PATH, 'utf-8');
  }
  
  // Check if AUTO-GENERATED section exists
  const autoGeneratedStart = '// ============================================\n// AUTO-GENERATED REGISTRATIONS - DO NOT EDIT\n// ============================================';
  const autoGeneratedEnd = '// ============================================\n// END AUTO-GENERATED REGISTRATIONS\n// ============================================';
  
  const hasAutoGeneratedSection = existingContent.includes(autoGeneratedStart);
  
  // Generate new registrations
  const newRegistrations = newNodes.map(node => generateNodeRegistrationTemplate(node)).join('\n\n');
  
  const autoGeneratedSection = `${autoGeneratedStart}
// This section is automatically generated by npm run generate:registry
// It contains template registrations for new nodes that haven't been implemented yet.
// To implement a node, replace the template with your actual implementation.
// Last generated: ${new Date().toISOString()}
// ============================================

${newRegistrations}

${autoGeneratedEnd}`;
  
  // Update file
  if (hasAutoGeneratedSection) {
    // Find the start and end of the AUTO-GENERATED section
    const startIndex = existingContent.indexOf(autoGeneratedStart);
    const endIndex = existingContent.indexOf(autoGeneratedEnd);
    
    if (startIndex !== -1 && endIndex !== -1) {
      // Get content before and after the section
      const beforeSection = existingContent.substring(0, startIndex).trimEnd();
      const afterSection = existingContent.substring(endIndex + autoGeneratedEnd.length).trimStart();
      
      // Remove any orphaned END markers before the section (handle both \n and \r\n)
      const orphanedEndMarker1 = '// ============================================\n// END AUTO-GENERATED REGISTRATIONS\n// ============================================';
      const orphanedEndMarker2 = orphanedEndMarker1.replace(/\n/g, '\r\n');
      let cleanedBefore = beforeSection;
      
      // Remove all occurrences of orphaned markers
      while (cleanedBefore.endsWith(orphanedEndMarker1) || cleanedBefore.endsWith(orphanedEndMarker2)) {
        if (cleanedBefore.endsWith(orphanedEndMarker1)) {
          cleanedBefore = cleanedBefore.substring(0, cleanedBefore.lastIndexOf(orphanedEndMarker1)).trimEnd();
        } else {
          cleanedBefore = cleanedBefore.substring(0, cleanedBefore.lastIndexOf(orphanedEndMarker2)).trimEnd();
        }
      }
      
      // Reconstruct with clean section
      existingContent = cleanedBefore + '\n\n' + autoGeneratedSection + '\n' + (afterSection ? afterSection + '\n' : '');
    } else {
      // Fallback: use regex replacement
      const regex = new RegExp(
        autoGeneratedStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + autoGeneratedEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'g'
      );
      existingContent = existingContent.replace(regex, autoGeneratedSection);
    }
  } else {
    // Remove any orphaned END markers at the end
    const orphanedEndMarker = '// ============================================\n// END AUTO-GENERATED REGISTRATIONS\n// ============================================';
    let cleanedContent = existingContent.trimEnd();
    if (cleanedContent.endsWith(orphanedEndMarker)) {
      cleanedContent = cleanedContent.substring(0, cleanedContent.lastIndexOf(orphanedEndMarker)).trimEnd();
    }
    
    // Append AUTO-GENERATED section at the end
    existingContent = cleanedContent + '\n\n' + autoGeneratedSection + '\n';
  }
  
  fs.writeFileSync(REGISTER_BUILTINS_PATH, existingContent, 'utf-8');
  
  return {
    added: newNodes.map(n => n.type),
    skipped: skippedNodes.map(n => n.type)
  };
}

function validateGeneratedCode(registry: Registry): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if all nodes have required fields
  registry.nodes.forEach((node, index) => {
    if (!node.type) {
      errors.push(`Node at index ${index} is missing 'type' field`);
    }
    if (!node.name) {
      errors.push(`Node '${node.type}' is missing 'name' field`);
    }
    if (!node.icon) {
      warnings.push(`Node '${node.type}' is missing 'icon' field`);
    }
    if (!node.description) {
      warnings.push(`Node '${node.type}' is missing 'description' field`);
    }
    if (node.frontend?.useAutoConfigForm && !node.frontend?.fields) {
      warnings.push(`Node '${node.type}' uses autoConfigForm but has no fields defined`);
    }
  });

  // Check for duplicate node types
  const nodeTypes = registry.nodes.map(n => n.type);
  const duplicates = nodeTypes.filter((type, index) => nodeTypes.indexOf(type) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate node types found: ${[...new Set(duplicates)].join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function main() {
  console.log('🔄 Generating registry code...\n');
  
  try {
    const registry = loadRegistry();
    console.log(`📋 Loaded registry:`);
    console.log(`   - Nodes: ${registry.nodes.length}`);
    console.log(`   - Version: ${registry.version}\n`);

    // Validate registry
    console.log('🔍 Validating registry...');
    const validation = validateGeneratedCode(registry);
    
    if (validation.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      validation.warnings.forEach(warning => console.log(`   - ${warning}`));
      console.log('');
    }

    if (!validation.valid) {
      console.error('❌ Validation failed:');
      validation.errors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }
    console.log('✅ Validation passed\n');

    // Generate frontend metadata
    console.log('📝 Generating frontend metadata...');
    const frontendCode = generateFrontendMetadata(registry);
    fs.writeFileSync(FRONTEND_OUTPUT, frontendCode, 'utf-8');
    console.log(`   ✅ ${FRONTEND_OUTPUT}`);
    console.log(`   📊 Generated ${registry.nodes.length} node metadata entries\n`);

    // Generate C# registration
    console.log('📝 Generating C# registration (deprecated)...');
    const csharpCode = generateCSharpRegistration(registry);
    fs.writeFileSync(CSHARP_OUTPUT, csharpCode, 'utf-8');
    console.log(`   ✅ ${CSHARP_OUTPUT}\n`);

    // Generate TypeScript documentation
    console.log('📝 Generating TypeScript documentation...');
    const tsCode = generateTypeScriptRegistration(registry);
    fs.writeFileSync(TYPESCRIPT_OUTPUT, tsCode, 'utf-8');
    const nodesWithProcessors = registry.nodes.filter(n => n.typescriptProcessor);
    console.log(`   ✅ ${TYPESCRIPT_OUTPUT}`);
    console.log(`   📊 ${nodesWithProcessors.length} nodes with TypeScript processors\n`);

    // Update registerBuiltIns.ts with new node registrations
    console.log('📝 Updating registerBuiltIns.ts with new node registrations...');
    const registrationResult = updateRegisterBuiltIns(registry);
    
    if (registrationResult.added.length > 0) {
      console.log(`   ✅ Added ${registrationResult.added.length} new node registration template(s):`);
      registrationResult.added.forEach(nodeType => {
        const node = registry.nodes.find(n => n.type === nodeType);
        console.log(`      ✨ ${nodeType} (${node?.name || 'Unknown'})`);
      });
      console.log(`   📝 Templates added to AUTO-GENERATED section in:`);
      console.log(`      ${REGISTER_BUILTINS_PATH}`);
      console.log(`   ⚠️  Next steps:`);
      console.log(`      1. Open the file and find the AUTO-GENERATED section`);
      console.log(`      2. Replace the template with your actual implementation`);
      console.log(`      3. Move it outside the AUTO-GENERATED section when done\n`);
    } else {
      console.log(`   ✅ All nodes already registered (no new templates needed)\n`);
    }
    
    if (registrationResult.skipped.length > 0) {
      console.log(`   ℹ️  Already implemented (${registrationResult.skipped.length}): ${registrationResult.skipped.join(', ')}\n`);
    }

    // Show warning only for template nodes (nodes waiting for implementation)
    const templateNodeTypes = getTemplateNodeTypes();
    const templateNodes = nodesWithProcessors.filter(node => templateNodeTypes.has(node.type));
    
    if (templateNodes.length > 0) {
      console.log('⚠️  TEMPLATES WAITING FOR IMPLEMENTATION:');
      console.log(`   The following ${templateNodes.length} node(s) have template code that needs to be implemented:`);
      console.log('');
      
      // Group by processor file
      const processorGroups: Record<string, RegistryNode[]> = {};
      templateNodes.forEach(node => {
        const processorPath = node.typescriptProcessor || './nodes/registerBuiltIns';
        const filePath = processorPath.split('#')[0];
        if (!processorGroups[filePath]) {
          processorGroups[filePath] = [];
        }
        processorGroups[filePath].push(node);
      });
      
      Object.entries(processorGroups).forEach(([filePath, nodes]) => {
        console.log(`   📁 File: execution-service/src/${filePath.replace('./', '')}`);
        nodes.forEach(node => {
          console.log(`      ⏳ ${node.type} (${node.name}) - Template code waiting for implementation`);
        });
        console.log('');
      });
      
      console.log('   📝 Next steps:');
      console.log('      1. Open execution-service/src/nodes/registerBuiltIns.ts');
      console.log('      2. Find the AUTO-GENERATED section');
      console.log('      3. Replace the template code with your actual implementation');
      console.log('      4. Move the implementation outside the AUTO-GENERATED section');
      console.log('');
      console.log('   📖 See generated file for code examples:');
      console.log(`      ${TYPESCRIPT_OUTPUT}`);
      console.log('');
    } else {
      console.log('✅ All node processors are fully implemented (no templates waiting)\n');
    }

    // Summary
    console.log('📊 Summary:');
    console.log(`   - Total nodes: ${registry.nodes.length}`);
    console.log(`   - Nodes with TypeScript processors: ${nodesWithProcessors.length}`);
    console.log(`   - Nodes with C# processors: ${registry.nodes.filter(n => n.csharpProcessor).length}`);
    console.log(`   - Nodes with auto-config forms: ${registry.nodes.filter(n => n.frontend?.useAutoConfigForm).length}`);

    console.log('🎉 Registry code generation complete!');
  } catch (error: any) {
    console.error('❌ Error during code generation:');
    console.error(`   ${error.message}`);
    if (error.stack) {
      console.error(`\n   Stack trace:\n   ${error.stack.split('\n').slice(1).join('\n   ')}`);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { generateFrontendMetadata, generateCSharpRegistration, generateTypeScriptRegistration };

