# Node Development Guide

**Complete guide for adding and modifying nodes in MonshyFlow**

This guide explains how to add new nodes, modify existing nodes, and understand the registry system that powers MonshyFlow's extensible architecture.

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Understanding the Registry System](#understanding-the-registry-system)
3. [Adding a New Node](#adding-a-new-node)
4. [Modifying an Existing Node](#modifying-an-existing-node)
5. [Node Architecture](#node-architecture)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

MonshyFlow uses a **registry-based architecture** where `shared/registry.json` is the **Single Source of Truth** for all nodes and tools. This ensures consistency across:

- **Frontend** (React/TypeScript)
- **Backend** (TypeScript execution service)
- **Code Generation** (Auto-generated metadata files)

### Key Principles

1. **Registry First** - Always define nodes in `shared/registry.json` first
2. **Code Generation** - Run `npm run generate:registry` after registry changes
3. **Manual Override** - Custom forms/components can override auto-generated forms
4. **Validation** - Registry is validated before code generation

---

## Understanding the Registry System

### What is the Registry?

The registry (`shared/registry.json`) is a JSON file that defines:

- **Node Metadata** - Name, icon, description, category
- **Frontend Configuration** - Form fields, UI behavior, component references
- **Backend Configuration** - Processor references, input/output schemas
- **Code Generation Hints** - Information used to generate TypeScript/C# code

### Registry Structure

```json
{
  "version": "2.0.0",
  "nodes": [
    {
      "type": "my-node",
      "name": "My Node",
      "icon": "🎯",
      "description": "Does something useful",
      "category": "utility",
      "animationSpeed": "fast",
      "typescriptProcessor": "./nodes/registerBuiltIns#my-node",
      "inputSchema": { ... },
      "outputSchema": { ... },
      "frontend": {
        "hasConfigForm": true,
        "useAutoConfigForm": true,
        "fields": { ... }
      }
    }
  ]
}
```

### Generated Files

When you run `npm run generate:registry`, the following files are generated:

1. **Frontend Metadata** (`frontend/src/components/WorkflowBuilder/nodeRegistry/generatedMetadata.ts`)
   - TypeScript metadata for all nodes
   - Used by NodeSelectorPopup, NodeConfigPanel, etc.

2. **Backend Registration** (if applicable)
   - TypeScript processor registration
   - C# processor registration (if C# backend exists)

### Registry vs Manual Registration

**Registry-Based (Recommended):**
- ✅ Single Source of Truth
- ✅ Automatic code generation
- ✅ Consistent across frontend/backend
- ✅ Easy to maintain

**Manual Registration (Legacy/Override):**
- ⚠️ Only for custom components that need special handling
- ⚠️ Must be kept in sync manually
- ⚠️ Can override registry settings

**Important:** Manual registrations in `nodeMetadata.ts` take priority over generated metadata.

---

## Adding a New Node

### Step 1: Define Node in Registry

Add your node definition to `shared/registry.json`:

```json
{
  "type": "my-custom-node",
  "name": "My Custom Node",
  "icon": "🎯",
  "description": "A custom node that does something specific",
  "category": "utility",
  "animationSpeed": "fast",
  "typescriptProcessor": "./nodes/registerBuiltIns#my-custom-node",
  "inputSchema": {
    "type": "object",
    "description": "Accepts any input from previous nodes",
    "additionalProperties": true
  },
  "outputSchema": {
    "type": "object",
    "description": "Returns processed data",
    "additionalProperties": true
  },
  "frontend": {
    "hasConfigForm": true,
    "useAutoConfigForm": true,
    "isUnique": false,
    "canDuplicate": true,
    "hasInput": true,
    "hasOutput": true,
    "fields": {
      "label": {
        "type": "text",
        "placeholder": "My Custom Node Name"
      },
      "customField": {
        "type": "expression",
        "multiline": false,
        "placeholder": "Enter custom value or use {{variables}}"
      }
    }
  }
}
```

### Step 2: Generate Metadata

Run the registry generation script:

```bash
cd shared
npm run generate:registry
```

This will:
- Generate `frontend/src/components/WorkflowBuilder/nodeRegistry/generatedMetadata.ts`
- Update backend registration files (if applicable)
- Validate the registry structure

### Step 3: Create Frontend Component (Optional)

If you need a custom component (not using the default BaseNode), create:

**File:** `frontend/src/components/WorkflowBuilder/NodeTypes/MyCustomNode.tsx`

```typescript
import type { NodeProps } from '@xyflow/react';
import { BaseNode } from '../BaseNode';

export function MyCustomNode(props: NodeProps) {
  const { data, id, type, selected } = props;
  const safeData = data || {};
  const label = (safeData.label as string) || 'My Custom Node';

  return (
    <BaseNode
      label={label}
      icon="🎯"
      category="utility"
      hasInput={true}
      hasOutput={true}
      node={{
        id: id || '',
        type: type || 'my-custom-node',
        data: safeData,
        position: { x: 0, y: 0 },
      }}
      selected={selected}
      isAnimating={(safeData as any).isAnimating}
      executionStatus={(safeData as any).executionStatus}
    />
  );
}
```

### Step 4: Register Component (If Custom)

If you created a custom component, register it in:

**File:** `frontend/src/components/WorkflowBuilder/nodeRegistry/nodeRegistry.ts`

```typescript
import { MyCustomNode } from '../NodeTypes/MyCustomNode';

const NODE_COMPONENTS: Record<string, ComponentType<any>> = {
  // ... existing components
  'my-custom-node': MyCustomNode,
};
```

### Step 5: Create Custom Config Form (Optional)

If you need a custom configuration form (not auto-generated), create:

**File:** `frontend/src/components/WorkflowBuilder/NodeConfigForms/MyCustomNodeConfigForm.tsx`

```typescript
import { useState } from 'react';
import { ExpressionEditor } from '../ExpressionEditor';

interface MyCustomNodeConfigFormProps {
  config: any;
  onConfigChange: (config: any) => void;
  nodes?: any[];
  edges?: any[];
  currentNodeId?: string;
  debugSteps?: any[];
}

export function MyCustomNodeConfigForm({
  config,
  onConfigChange,
  nodes = [],
  edges = [],
  currentNodeId,
  debugSteps = [],
}: MyCustomNodeConfigFormProps) {
  const [customField, setCustomField] = useState<string>(config.customField || '');

  const handleChange = (value: string) => {
    setCustomField(value);
    onConfigChange({
      ...config,
      customField: value,
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Custom Field
        </label>
        <ExpressionEditor
          value={customField}
          onChange={handleChange}
          nodes={nodes}
          edges={edges}
          currentNodeId={currentNodeId}
          debugSteps={debugSteps}
          placeholder="Enter custom value or use {{variables}}"
        />
      </div>
    </div>
  );
}
```

Then register it in:

**File:** `frontend/src/components/WorkflowBuilder/nodeRegistry/configFormRegistry.tsx`

```typescript
import { MyCustomNodeConfigForm } from '../NodeConfigForms/MyCustomNodeConfigForm';

const CUSTOM_CONFIG_FORMS: Record<string, ComponentType<any>> = {
  // ... existing forms
  'my-custom-node': MyCustomNodeConfigForm,
};
```

**Important:** If you create a custom config form, set `"useAutoConfigForm": false` in the registry.

### Step 6: Implement Backend Processor

Create the backend processor in:

**File:** `packages/execution-service/src/nodes/registerBuiltIns.ts`

```typescript
import { registerNodeProcessor } from './index';
import type { NodeProcessorContext } from './index';
import { createNodeData, extractData } from '../models/nodeData';

// Register your node processor
registerNodeProcessor({
  type: 'my-custom-node',
  name: 'My Custom Node',
  description: 'A custom node that does something specific',
  processNodeData: async (node, input, context) => {
    const nodeData = node.data || {};
    const customField = nodeData.customField || '';

    // Your processing logic here
    const result = {
      processed: true,
      customField,
      input: extractData(input),
    };

    return createNodeData(
      result,
      node.id,
      node.type || 'my-custom-node',
      input?.metadata?.nodeId
    );
  },
  validate: (node) => {
    const nodeData = node.data || {};
    if (!nodeData.customField) {
      return { valid: false, error: 'Custom field is required' };
    }
    return { valid: true };
  },
});
```

### Step 7: Test Your Node

1. **Start the development server:**
   ```bash
   cd frontend
   pnpm dev
   ```

2. **Open the workflow builder** and verify:
   - Node appears in the node selector
   - Node can be added to canvas
   - Configuration form works correctly
   - Node executes properly in debug mode

3. **Test execution:**
   - Create a simple workflow with your node
   - Test with different inputs
   - Verify output format

---

## Modifying an Existing Node

### When to Modify Registry vs Code

**Modify Registry (`shared/registry.json`) when:**
- ✅ Adding/removing fields
- ✅ Changing field types or placeholders
- ✅ Updating descriptions or metadata
- ✅ Changing UI behavior flags (hasInput, hasOutput, etc.)

**Modify Code directly when:**
- ✅ Changing component appearance (custom component)
- ✅ Changing form layout (custom config form)
- ✅ Changing backend processing logic
- ✅ Adding custom validation

### Example: Modifying the Agent Node

The Agent Node was recently updated to match OpenAI's Agent Builder UI. Here's what was changed:

#### 1. Registry Changes

**File:** `shared/registry.json`

```json
{
  "type": "agent",
  "frontend": {
    "fields": {
      "systemPrompt": {
        "placeholder": "Enter instructions for the agent. Use {{variables}} for dynamic content"
        // Changed from "Enter system prompt..."
      }
    }
  }
}
```

#### 2. Frontend Code Changes

**File:** `frontend/src/components/WorkflowBuilder/NodeConfigPanel.tsx`

- Changed label from "System Prompt" to "Instructions"
- Reordered fields: Name → Model → Instructions → User Prompt
- Added Tools button
- Improved Output Format dropdown with categories
- Moved advanced settings to collapsible section

#### 3. After Changes

**Always run:**
```bash
cd shared
npm run generate:registry
```

This ensures generated metadata files are updated.

### Common Modifications

#### Adding a New Field

1. **Add to registry:**
   ```json
   "fields": {
     "newField": {
       "type": "text",
       "placeholder": "Enter new field value"
     }
   }
   ```

2. **Run generation:**
   ```bash
   npm run generate:registry
   ```

3. **If using auto-config form:** Field appears automatically
4. **If using custom form:** Add field to custom form component

#### Changing Field Label

**For auto-config forms:**
- Labels are auto-generated from field names
- Use `label` property in registry to override:
  ```json
  "newField": {
    "type": "text",
    "label": "Custom Label Name",
    "placeholder": "..."
  }
  ```

**For custom forms:**
- Update label directly in component code

#### Changing Field Type

1. Update field type in registry
2. Run `npm run generate:registry`
3. Update custom form if needed (auto-config forms handle this automatically)

---

## Node Architecture

### Frontend Architecture

```
Node Component (NodeTypes/MyNode.tsx)
  ↓
BaseNode (shared component)
  ↓
Node Registry (nodeRegistry.ts)
  ↓
Generated Metadata (generatedMetadata.ts)
  ↓
Registry (shared/registry.json)
```

### Backend Architecture

```
Execution Service
  ↓
Node Processor (registerBuiltIns.ts)
  ↓
NodeData Model (models/nodeData.ts)
  ↓
Registry Reference (shared/registry.json)
```

### Data Flow

```
User Input → Node Config → Registry → Backend Processor → NodeData → Next Node
```

---

## Best Practices

### ✅ DO

1. **Always start with the registry**
   - Define node in `shared/registry.json` first
   - Run `npm run generate:registry` after changes
   - Commit registry changes with generated files

2. **Use auto-config forms when possible**
   - Set `"useAutoConfigForm": true` in registry
   - Only create custom forms for complex UIs

3. **Follow naming conventions**
   - Node types: `kebab-case` (e.g., `my-custom-node`)
   - Field names: `camelCase` (e.g., `customField`)
   - Component names: `PascalCase` (e.g., `MyCustomNode`)

4. **Document your changes**
   - Add comments in registry for complex nodes
   - Update this guide if you discover new patterns

5. **Test thoroughly**
   - Test in debug mode
   - Test with different input types
   - Test edge cases

### ❌ DON'T

1. **Don't hardcode metadata**
   ```typescript
   // ❌ BAD
   if (node.type === 'my-node') {
     const name = 'My Node'; // Hardcoded!
   }
   
   // ✅ GOOD
   const metadata = getNodeMetadata(node.type);
   const name = metadata.name; // From registry
   ```

2. **Don't skip registry generation**
   ```bash
   # ❌ BAD - Changes registry but doesn't generate
   # Edit registry.json
   # Forget to run generate:registry
   
   # ✅ GOOD
   # Edit registry.json
   npm run generate:registry
   ```

3. **Don't mix manual and registry registration**
   - If using registry, use it consistently
   - Don't manually register fields that are in registry

4. **Don't ignore validation errors**
   - Registry validation catches many errors
   - Fix validation errors before proceeding

---

## Troubleshooting

### Node doesn't appear in selector

**Possible causes:**
1. Registry not generated - Run `npm run generate:registry`
2. Node not in registry - Check `shared/registry.json`
3. Component not registered - Check `nodeRegistry.ts`
4. Type mismatch - Ensure `type` matches exactly

**Solution:**
```bash
cd shared
npm run generate:registry
# Check for errors
# Restart dev server
```

### Config form doesn't show fields

**Possible causes:**
1. `useAutoConfigForm: false` but no custom form
2. Custom form not registered
3. Fields not in registry

**Solution:**
- Check registry for `useAutoConfigForm` setting
- Verify custom form is registered in `configFormRegistry.tsx`
- Ensure fields are defined in registry

### Backend processor not found

**Possible causes:**
1. Processor not registered in `registerBuiltIns.ts`
2. Type mismatch between registry and processor
3. Import path incorrect

**Solution:**
- Check processor registration
- Verify `type` matches registry exactly
- Check import paths

### Generated metadata out of sync

**Solution:**
```bash
cd shared
npm run generate:registry
# Check for errors
# Verify generatedMetadata.ts was updated
```

### Field changes not reflected

**Possible causes:**
1. Using custom form that doesn't read from registry
2. Manual registration overriding registry
3. Cache issues

**Solution:**
- Check if using custom form
- Verify manual registrations in `nodeMetadata.ts`
- Clear browser cache and restart dev server

---

## Registry Field Types

### Supported Field Types

| Type | Description | Example |
|------|-------------|---------|
| `text` | Single-line text input | `"label": { "type": "text" }` |
| `expression` | Expression editor with `{{variables}}` | `"prompt": { "type": "expression" }` |
| `number` | Number input with min/max | `"temperature": { "type": "number", "min": 0, "max": 2 }` |
| `select` | Dropdown with options | `"model": { "type": "select", "options": [...] }` |
| `textarea` | Multi-line text input | `"description": { "type": "textarea" }` |
| `secret` | Secret selector | `"apiKey": { "type": "secret", "secretType": "ApiKey" }` |

### Field Properties

```json
{
  "type": "expression",
  "label": "Custom Label",           // Override auto-generated label
  "placeholder": "Enter value...",    // Placeholder text
  "multiline": true,                  // Multi-line input
  "rows": 4,                          // Number of rows (for multiline)
  "required": true,                   // Field is required
  "default": "default value",         // Default value
  "min": 0,                           // Minimum value (for number)
  "max": 100,                         // Maximum value (for number)
  "step": 0.1,                        // Step value (for number)
  "options": [                        // Options (for select)
    { "value": "option1", "label": "Option 1" }
  ],
  "displayCondition": {               // Conditional display
    "field": "otherField",
    "operator": "equals",
    "value": "someValue"
  }
}
```

---

## Examples

### Example 1: Simple Utility Node

**Registry Entry:**
```json
{
  "type": "delay",
  "name": "Delay",
  "icon": "⏱️",
  "description": "Wait for a specified amount of time",
  "category": "utility",
  "animationSpeed": "slow",
  "typescriptProcessor": "./nodes/registerBuiltIns#delay",
  "frontend": {
    "hasConfigForm": true,
    "useAutoConfigForm": true,
    "fields": {
      "delaySeconds": {
        "type": "number",
        "placeholder": "Delay in seconds",
        "default": 1,
        "min": 0,
        "max": 3600,
        "required": true
      }
    }
  }
}
```

**Backend Processor:**
```typescript
registerNodeProcessor({
  type: 'delay',
  name: 'Delay',
  processNodeData: async (node, input, context) => {
    const delaySeconds = node.data?.delaySeconds || 1;
    await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
    return createNodeData(input, node.id, 'delay');
  },
});
```

### Example 2: Complex Node with Custom Form

See the **Code Node** implementation:
- Custom config form with CodeMirror editor
- Custom component (optional, uses BaseNode)
- Backend processor with VM sandbox

**Files:**
- `shared/registry.json` - Registry definition
- `frontend/src/components/WorkflowBuilder/NodeConfigForms/CodeNodeConfigForm.tsx` - Custom form
- `frontend/src/components/WorkflowBuilder/NodeTypes/CodeNode.tsx` - Custom component
- `packages/execution-service/src/nodes/registerBuiltIns.ts` - Backend processor

---

## Quick Reference

### Adding a Node Checklist

- [ ] Define node in `shared/registry.json`
- [ ] Run `npm run generate:registry`
- [ ] Create frontend component (if custom)
- [ ] Register component in `nodeRegistry.ts` (if custom)
- [ ] Create config form (if custom, otherwise auto-generated)
- [ ] Register config form in `configFormRegistry.tsx` (if custom)
- [ ] Implement backend processor in `registerBuiltIns.ts`
- [ ] Test node in workflow builder
- [ ] Test node execution
- [ ] Update documentation if needed

### Modifying a Node Checklist

- [ ] Update `shared/registry.json` (if changing metadata/fields)
- [ ] Run `npm run generate:registry`
- [ ] Update custom component (if changing appearance)
- [ ] Update custom config form (if changing form)
- [ ] Update backend processor (if changing logic)
- [ ] Test changes thoroughly
- [ ] Verify generated files are updated

### Common Commands

```bash
# Generate registry metadata
cd shared
npm run generate:registry

# Validate registry
cd shared
npm run validate:registry

# Start frontend dev server
cd frontend
pnpm dev

# Run tests
cd frontend
pnpm test
```

---

## Additional Resources

- **Registry Schema:** See `shared/registry.json` for complete schema
- **Existing Nodes:** Study existing nodes for patterns
  - Simple: `delay` node
  - Medium: `transform` node
  - Complex: `agent` node, `code` node
- **Code Examples:** Check `frontend/src/components/WorkflowBuilder/NodeTypes/` for component examples
- **Backend Examples:** Check `packages/execution-service/src/nodes/registerBuiltIns.ts` for processor examples

---

## Questions?

If you encounter issues or have questions:

1. Check this guide first
2. Review existing node implementations
3. Check registry validation errors
4. Review generated metadata files
5. Check console for runtime errors

---

**Last Updated:** 2026-01-17  
**Version:** 1.0.0

