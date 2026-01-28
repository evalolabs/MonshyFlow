# Contributing to MonshyFlow Frontend

Thank you for your interest in contributing! This guide focuses on **Node Development** - the most important part for contributors.

## 📋 Table of Contents

- [Node Development Guide](#-node-development-guide)
  - [Three Ways to Implement Nodes](#three-ways-to-implement-nodes)
  - [Method 1: Using Registry (Recommended)](#method-1-using-registry-recommended)
  - [Method 2: Manual Implementation (For Complex Nodes)](#method-2-manual-implementation-for-complex-nodes)
  - [Method 3: Hybrid Approach](#method-3-hybrid-approach)
- [Node Registry System](#node-registry-system)
- [Animation System](#animation-system)
- [Auto-Layout System](#auto-layout-system)
- [API Integration System](#api-integration-system)
- [Development Workflow](#development-workflow)

---

## 🎯 Node Development Guide

### Three Ways to Implement Nodes

The frontend supports **three different approaches** for implementing nodes, depending on complexity:

1. **Registry-based** (Recommended for simple nodes)
2. **Manual implementation** (For complex nodes with custom UI/behavior)
3. **Hybrid** (Registry for metadata, custom component for UI)

### Method 1: Using Registry (Recommended)

**Best for**: Simple nodes with standard configuration forms.

**⚠️ Common Issues with Registry Method**:

The `generate:registry` command can fail or cause problems in several ways:

1. **JSON Validation Errors**:
   - Invalid JSON syntax in `registry.json`
   - Missing required fields (`type`, `name`, `category`)
   - Duplicate node types

2. **File Path Issues**:
   - Output directories don't exist
   - Permission errors when writing generated files
   - Path resolution failures

3. **C# Generation Errors** (can be ignored):
   - C# processor generation is deprecated but may still throw errors
   - These can be safely ignored

4. **TypeScript Parsing Errors**:
   - Errors when reading/parsing `registerBuiltIns.ts`
   - Usually warnings, not fatal

5. **Overwriting Manual Changes**:
   - Generated files overwrite any manual edits
   - If you manually edit `generatedMetadata.ts`, changes are lost on next generation

**How Manual Registry Avoids These Issues**:
- ✅ No code generation = no generation errors
- ✅ No file overwriting = manual changes are preserved
- ✅ No JSON validation = more flexibility
- ✅ Direct control = no path/permission issues

**Steps**:

1. **Add to `shared/registry.json`**:
   ```json
   {
     "type": "my-node",
     "name": "My Node",
     "icon": "🎯",
     "description": "Does something cool",
     "category": "utility",
     "typescriptProcessor": "./nodes/registerBuiltIns#myNode",
     "frontend": {
       "hasConfigForm": true,
       "useAutoConfigForm": true,
       "fields": {
         "label": { "type": "text", "placeholder": "Node Name" },
         "myField": { "type": "expression", "placeholder": "Enter value..." }
       }
     }
   }
   ```

2. **Generate code**:
   ```bash
   cd shared
   pnpm run generate:registry
   ```

3. **Implement backend processor** in `packages/execution-service/src/nodes/registerBuiltIns.ts`

4. **Done!** The node will automatically:
   - Appear in the node selector
   - Use `BaseNode` component (standard UI)
   - Use auto-generated config form
   - Work with animation and auto-layout

**Pros**: 
- Fast, consistent, auto-generated code
- Single source of truth in `registry.json`
- Automatic metadata generation

**Cons**: 
- Limited to standard UI patterns
- Can fail with validation/file errors
- Generated files overwrite manual changes
- Less flexible for complex requirements

---

### Method 2: Manual Implementation (For Complex Nodes)

**Best for**: Complex nodes that need custom UI, special behavior, or advanced interactions.

**⚠️ Important**: With Manual Registry:
- **You do NOT need to add the node to `shared/registry.json`** (and should NOT, to avoid confusion)
- **You do NOT need to run `generate:registry`**
- Everything is done manually in the frontend code
- The node is completely independent of the registry system
- **Do NOT document it in `registry.json`** - keep it purely in the frontend code

**Steps**:

1. **Create Node Component** in `src/components/WorkflowBuilder/NodeTypes/MyNode.tsx`:
   ```tsx
   import { BaseNode } from './BaseNode';
   import type { NodeProps } from '@xyflow/react';
   
   export function MyNode(props: NodeProps) {
     // Custom implementation
     return (
       <BaseNode
         {...props}
         // Add custom props/behavior
       />
     );
   }
   ```

2. **Register Component** in `src/components/WorkflowBuilder/nodeRegistry/nodeRegistry.ts`:
   ```ts
   import type { ComponentType } from 'react';
   import { MyNode } from '../NodeTypes/MyNode';
   
   const NODE_COMPONENTS: Record<string, ComponentType<any>> = {
     // ... existing nodes
     'my-node': MyNode,
   };
   ```

3. **Add Metadata** in `src/components/WorkflowBuilder/nodeRegistry/nodeMetadata.ts`:
   ```ts
   export const NODE_METADATA_REGISTRY: Record<string, NodeMetadata> = {
     // ... existing nodes
     'my-node': {
       id: 'my-node',
       name: 'My Node',
       icon: '🎯',
       description: 'Does something cool',
       category: 'utility',
       animationSpeed: 'fast', // Optional: 'fast' or 'slow'
       component: () => null, // Will be lazy-loaded
       hasConfigForm: true,
       useAutoConfigForm: false, // Set to true if using auto-generated form
       hasInput: true,
       hasOutput: true,
       // Optional: fields for auto-config form
       // fields: { ... }
     },
   };
   ```

4. **Create Custom Config Form** (optional) in `src/components/WorkflowBuilder/NodeConfigForms/MyNodeConfigForm.tsx`:
   ```tsx
   interface MyNodeConfigFormProps {
     config: any;
     onConfigChange: (config: any) => void;
     nodes?: any[];
     edges?: any[];
     currentNodeId?: string;
     debugSteps?: any[];
   }
   
   export function MyNodeConfigForm({
     config,
     onConfigChange,
     nodes = [],
     edges = [],
     currentNodeId,
     debugSteps = [],
   }: MyNodeConfigFormProps) {
     // Custom config form UI
     // Use config for current values
     // Call onConfigChange(newConfig) to update
   }
   ```

5. **Register Config Form** in `src/components/WorkflowBuilder/nodeRegistry/configFormRegistry.tsx`:
   ```ts
   import { MyNodeConfigForm } from '../NodeConfigForms/MyNodeConfigForm';
   
   // Add to CUSTOM_CONFIG_FORMS object or use registerCustomConfigForm()
   registerCustomConfigForm('my-node', MyNodeConfigForm);
   ```
   
   **Alternative**: You can also directly add to the `CUSTOM_CONFIG_FORMS` object in `configFormRegistry.tsx`:
   ```ts
   const CUSTOM_CONFIG_FORMS: Record<string, ComponentType<any>> = {
     // ... existing forms
     'my-node': MyNodeConfigForm,
   };
   ```

6. **Implement backend processor** in `packages/execution-service/src/nodes/registerBuiltIns.ts`

**✅ No `registry.json` needed!**  
**✅ No `generate:registry` needed!**  
Everything is registered manually in the frontend code.

**Pros**: 
- Full control, custom UI, special behavior
- No code generation = no generation errors
- Manual changes are never overwritten
- More flexible for complex requirements
- No dependency on `registry.json` validation

**Cons**: 
- More code to maintain
- No auto-generation benefits
- Must manually keep metadata in sync

**Examples**: `CodeNode`, `VariableNode`, `AgentNode` (complex nodes with custom UI)

---

### Method 3: Hybrid Approach

**Best for**: Nodes that need custom UI but want to leverage registry for metadata.

**Steps**:

1. **Add to `shared/registry.json`** (for metadata and backend processor reference)

2. **Create custom component** (override the auto-generated one)

3. **Register component manually** in `nodeRegistry.ts` (manual registration takes priority)

4. **Run `generate:registry`** (metadata will be generated, but your custom component will be used)

**Result**: Registry metadata + custom component

**Note**: This method **does require** running `generate:registry` to generate the metadata, but your custom component registration takes priority over any auto-generated component.

---

## 🎯 Node Registry System

The frontend uses a **flexible registry system** with three priority levels:

### Troubleshooting Registry Generation

If `generate:registry` fails, check:

1. **JSON Syntax**: Validate `registry.json` with a JSON validator
2. **Required Fields**: Ensure all nodes have `type`, `name`, `category`
3. **No Duplicates**: Check for duplicate node types
4. **File Permissions**: Ensure write permissions for output directories
5. **C# Errors**: Can be safely ignored (deprecated)

**If generation keeps failing**: Consider using **Method 2 (Manual)** instead - it avoids all generation issues.

### Registry Priority System

The system uses a **priority-based lookup** for node metadata and components:

1. **Manual Registry** (`nodeMetadata.ts` + `nodeRegistry.ts`) - **Highest Priority**
   - Can override generated metadata
   - Used for complex nodes with custom components
   - Examples: `CodeNode`, `VariableNode`, `AgentNode`

2. **Generated Metadata** (from `registry.json` via `generate:registry`) - **Medium Priority**
   - Auto-generated from `shared/registry.json`
   - Used for simple nodes with standard UI
   - File: `generatedMetadata.ts`

3. **Auto-Discovered** (from backend at runtime) - **Lowest Priority**
   - Discovered dynamically from backend
   - Used for nodes added at runtime

### When to Use Each Method

| Method | Use When | Example Nodes |
|--------|----------|---------------|
| **Registry** | Simple nodes, standard UI | `delay`, `transform` |
| **Manual** | Complex UI, special behavior | `code`, `variable`, `agent` |
| **Hybrid** | Custom UI but want registry metadata | Custom nodes with special needs |

### Registry Structure (for Method 1)

```json
{
  "type": "your-node-type",
  "name": "Your Node Name",
  "icon": "🎯",
  "description": "Node description",
  "category": "core|ai|integration|logic|utility",
  "typescriptProcessor": "./nodes/registerBuiltIns#yourNode",
  "frontend": {
    "hasConfigForm": true,
    "useAutoConfigForm": true,
    "fields": {
      "label": { "type": "text", "placeholder": "Node Name" },
      "myField": { "type": "expression", "placeholder": "Enter value..." }
    }
  }
}
```

**Note**: The `csharpProcessor` field is deprecated and can be omitted.

**Important**: If you use **Method 2 (Manual Registry)**:
- **Do NOT add the node to `registry.json`** - this would cause confusion
- The node is registered directly in the frontend code only
- Keep documentation in the frontend code (comments, TypeScript types)

**See**: `shared/README.md` for detailed documentation on the registry system.

---

## 🎬 Animation System

The workflow execution animation system provides real-time visual feedback during workflow execution.

### Architecture

- **Status-Based Animation**: Uses execution status directly from backend (via SSE events)
- **Hook**: `useWorkflowAnimation` in `hooks/useWorkflowAnimation.ts`
- **State Machine**: `hooks/animation/animationStateMachine.ts` (for complex scenarios)

### How It Works

1. **Execution Steps**: Backend sends execution steps via Server-Sent Events (SSE)
2. **Status Tracking**: Each node has a status: `pending`, `running`, `completed`, `failed`
3. **Visual Feedback**: Nodes are highlighted/animated based on their current status
4. **Animation Speed**: Nodes can specify `animationSpeed: "fast" | "slow"` in registry

### Key Components

- `WorkflowCanvas.tsx`: Receives SSE events and updates `executionSteps`
- `useWorkflowAnimation`: Extracts animation state from execution steps
- Node components: Use `isNodeRunning`, `isNodeCompleted`, etc. from the hook

### Adding Animation to New Nodes

1. **For Registry-based nodes**: Add `animationSpeed: "fast" | "slow"` to `registry.json`
2. **For Manual Registry nodes**: Add `animationSpeed: "fast" | "slow"` to the metadata in `nodeMetadata.ts`
3. The animation system automatically works for all registered nodes (both registry and manual)
4. No additional code needed unless you need custom animation behavior

---

## 📐 Auto-Layout System

The auto-layout system automatically arranges workflow nodes in a readable layout.

### Layout Strategies

Located in `src/utils/layouts/`:

- **LayoutV1** (default): Horizontal flow (left to right)
  - Optimized for sequential workflows
  - Intelligent branch distribution
  - Handles loops, branches, and tool nodes

### How It Works

1. **DAG Analysis**: Uses `dagre` library to create a directed acyclic graph
2. **Node Grouping**: Identifies parent-child relationships:
   - Agent nodes → Tool nodes
   - While/ForEach → Loop body nodes
   - If/Else → Branch nodes
3. **Position Calculation**: Calculates optimal positions for all nodes
4. **Special Handling**:
   - Tool nodes: Positioned relative to their agent
   - Loop nodes: Grouped within loop boundaries
   - Branch nodes: Distributed vertically

### Key Files

- `utils/layouts/LayoutV1.ts`: Main layout implementation
- `utils/nodeGroupingUtils.ts`: Helper functions for finding parent-child relationships
- `utils/autoLayout.ts`: Layout orchestration

### Customizing Layout

To add a new layout strategy:

1. Create a new file in `utils/layouts/` implementing `LayoutStrategy` interface (see `LayoutV1.ts` for example)
2. Import and register it in `utils/layouts/LayoutRegistry.ts`:
   ```ts
   import { LayoutV3 } from './LayoutV3';
   layoutRegistry.set('v3', LayoutV3);
   ```
3. Make it available in the UI (WorkflowSettingsPanel) by adding it to the layout selector

---

## 🔌 API Integration System

The API integration system allows workflows to connect to external APIs.

### Architecture

- **Configuration Files**: `shared/apiIntegrations/*.json` - One file per API
- **Frontend Loader**: `src/config/apiIntegrations.ts` - Loads and caches integrations
- **Node Integration**: HTTP Request nodes can use pre-configured API endpoints

### Adding New API Integrations

1. **Create JSON file** in `shared/apiIntegrations/`:
   ```json
   {
     "id": "your-api-id",
     "name": "Your API Name",
     "baseUrl": "https://api.example.com",
     "auth": {
       "type": "bearer",
       "secretKey": "YOUR_API_KEY"
     },
     "endpoints": [ ... ]
   }
   ```

2. **Add to index**: Update `shared/apiIntegrations/index.json`

3. **Important**: Only include **secret names** (e.g., `OPENAI_API_KEY`), never real secret values!

4. **Frontend**: The frontend automatically loads all integrations from the index

### Using API Integrations in Nodes

- HTTP Request nodes can select from available API integrations
- The system auto-generates headers and URLs based on the integration config
- Secrets are resolved at runtime from the secrets service

**See**: `shared/apiIntegrations/` for examples.

---

## 🔄 Development Workflow

### ⚠️ Backward Compatibility & Breaking Changes

**Critical**: When contributing, you must consider backward compatibility. Users host this application and have workflows saved in their databases. Breaking changes can break their existing workflows.

#### What Can Break Existing Workflows?

1. **Removing or Renaming Node Types**:
   - ❌ **Don't**: Remove a node type (e.g., `while`, `foreach`)
   - ❌ **Don't**: Rename a node type (e.g., `http-request` → `httpRequest`)
   - ✅ **Do**: Add new node types instead
   - ✅ **Do**: Deprecate old nodes (mark as deprecated, keep working)

2. **Changing Node Data Schema**:
   - ❌ **Don't**: Remove required fields from node data
   - ❌ **Don't**: Change field types (string → number)
   - ✅ **Do**: Add new optional fields
   - ✅ **Do**: Make old fields optional if needed
   - ✅ **Do**: Provide migration logic if schema must change

3. **Changing Node Processor Behavior**:
   - ❌ **Don't**: Change output format without migration
   - ✅ **Do**: Support both old and new formats during transition
   - ✅ **Do**: Use feature flags for gradual rollout

#### Best Practices (How Other Open Source Projects Handle This)

1. **Semantic Versioning**:
   - Major version (1.0.0 → 2.0.0): Breaking changes allowed
   - Minor version (1.0.0 → 1.1.0): New features, backward compatible
   - Patch version (1.0.0 → 1.0.1): Bug fixes only

2. **Deprecation Policy**:
   - Mark features as deprecated first
   - Keep deprecated features working for at least 1 major version
   - Provide migration guides

3. **Migration Scripts**:
   - For breaking changes, provide migration scripts
   - Auto-migrate workflows when possible
   - Document manual migration steps

4. **Feature Flags**:
   - Use feature flags for new behavior
   - Allow users to opt-in to new features
   - Gradually enable by default

#### Current System Status

- ✅ Workflows have a `version` field (currently used for workflow versioning, not schema versioning)
- ⚠️ **No automatic migration system yet** - breaking changes will break existing workflows
- ⚠️ **No deprecation warnings** - removed nodes will silently fail

#### Recommendations for Contributors

**Before making changes that could break workflows**:

1. **Check if it's a breaking change**:
   - Will existing workflows fail to load?
   - Will existing workflows fail to execute?
   - Will node configurations become invalid?

2. **If breaking change is necessary**:
   - Create an issue first to discuss
   - Provide migration path/documentation
   - Consider feature flag for gradual rollout
   - Update major version number

3. **For node changes**:
   - Add new node types instead of modifying existing ones
   - Keep old node types working (deprecate, don't remove)
   - Support both old and new node data formats

4. **For schema changes**:
   - Make new fields optional
   - Provide default values for missing fields
   - Add validation that handles both old and new formats

#### Example: Safe Node Modification

**❌ Breaking Change**:
```ts
// OLD: node.data.myField (required)
// NEW: node.data.myField removed
// Result: Existing workflows break
```

**✅ Backward Compatible**:
```ts
// OLD: node.data.myField
// NEW: node.data.myField (deprecated, still works) + node.data.newField
// Result: Old workflows still work, new workflows use newField
```

### Before Making Changes

1. **Read the registry docs**: `shared/README.md`
2. **Understand the system**: Review existing nodes in `registry.json`
3. **Check generated files**: See what gets auto-generated

### Making Changes

1. **For new nodes** (choose your method):

   **Method 1 (Registry)**:
   - Add to `shared/registry.json`
   - Run `pnpm run generate:registry` in `shared/` (ignore any C# generation errors)
   - Implement TypeScript backend processor in `packages/execution-service/src/nodes/registerBuiltIns.ts`
   - Done! Node will use auto-generated UI

   **Method 2 (Manual)**:
   - Create component in `NodeTypes/MyNode.tsx`
   - Register in `nodeRegistry.ts`
   - Add metadata in `nodeMetadata.ts`
   - Create custom config form (optional) in `NodeConfigForms/`
   - Implement TypeScript backend processor
   - Register config form in `configFormRegistry.tsx`
   - **No `generate:registry` needed!** Everything is manual.

   **Method 3 (Hybrid)**:
   - Add to `shared/registry.json` for metadata
   - Create custom component (overrides auto-generated)
   - Register component manually in `nodeRegistry.ts`
   - Run `generate:registry` for metadata
   - Implement backend processor

2. **For existing nodes**:
   
   **If node is in `registry.json` (Method 1)**:
   - Modify `shared/registry.json`
   - Run `pnpm run generate:registry` in `shared/`
   - Update backend processors if schema changed
   
   **If node is Manual Registry (Method 2)**:
   - Modify component in `NodeTypes/`
   - Modify metadata in `nodeMetadata.ts`
   - Modify config form if needed in `NodeConfigForms/`
   - Update backend processors if schema changed
   - **No `generate:registry` needed!**

3. **For UI changes**:
   - Modify components in `components/WorkflowBuilder/`
   - Update types in `types/` if needed
   - Test with `pnpm dev`

### Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Linting
pnpm lint
```

### Before Submitting PR

- ✅ Run `pnpm lint` and fix all issues
- ✅ Run `pnpm test` and ensure all tests pass
- ✅ Run `pnpm run generate:registry` if you modified `shared/registry.json` (only for Method 1 or 3, not Method 2)
- ✅ Test your changes manually in the UI
- ✅ Update documentation if needed

---

## 📚 Additional Resources

- **Registry System**: `shared/README.md`
- **Node Development Guide**: `docs/NODE_DEVELOPMENT_GUIDE.md` (if exists)
- **API Integration Examples**: `shared/apiIntegrations/*.json`

---

## ❓ Questions?

If you're unsure about how something works:
1. Check the existing code for similar patterns
2. Look at `shared/registry.json` for node examples (if using Method 1)
3. Look at `nodeMetadata.ts` and `nodeRegistry.ts` for manual examples (if using Method 2)
4. Review the generated files to understand the output (for Method 1)
5. Ask in issues or discussions

Thank you for contributing! 🎉

