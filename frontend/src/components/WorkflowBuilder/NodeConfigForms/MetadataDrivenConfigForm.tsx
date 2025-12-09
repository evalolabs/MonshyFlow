/**
 * Metadata-Driven Config Form
 * 
 * Automatically renders config forms based on node metadata.
 * This eliminates the need for manual switch-cases in NodeConfigPanel.
 */

import type { Node, Edge } from '@xyflow/react';
import { getNodeMetadata } from '../nodeRegistry/nodeMetadata';
import { getCustomConfigForm } from '../nodeRegistry/configFormRegistry';
import { AutoConfigForm } from './AutoConfigForm';
import type { SecretResponse } from '../../../services/secretsService';

interface MetadataDrivenConfigFormProps {
  nodeType: string;
  config: any;
  onConfigChange: (updates: any) => void;
  nodes: Node[];
  edges: Edge[];
  currentNodeId: string;
  debugSteps?: any[];
  // Special props for custom forms
  validationResult?: any;
  workflowId?: string;
  secrets?: SecretResponse[];
  secretsLoading?: boolean;
  reloadSecrets?: () => Promise<void>;
  [key: string]: any; // Allow additional props for custom forms
}

/**
 * Renders config form based on node metadata
 * Priority:
 * 1. Custom config form component (if registered)
 * 2. Auto-config form (if useAutoConfigForm: true and fields defined)
 * 3. Fallback to manual rendering (for backward compatibility)
 */
export function MetadataDrivenConfigForm({
  nodeType,
  config,
  onConfigChange,
  nodes,
  edges,
  currentNodeId,
  debugSteps = [],
  secrets = [],
  secretsLoading = false,
  reloadSecrets,
  ...additionalProps
}: MetadataDrivenConfigFormProps) {
  // Get node metadata
  const nodeMetadata = getNodeMetadata(nodeType);
  
  if (!nodeMetadata) {
    return (
      <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
        <p>No metadata found for node type: <code className="bg-gray-200 px-1 rounded">{nodeType}</code></p>
        <p className="mt-2 text-xs">
          This node type is not registered in the node metadata registry.
        </p>
      </div>
    );
  }

  // Check if node has config form enabled
  if (!nodeMetadata.hasConfigForm) {
    return (
      <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
        <p>No configuration available for this node type.</p>
      </div>
    );
  }

  // Priority 1: Check for custom config form component
  const CustomForm = getCustomConfigForm(nodeType);
  if (CustomForm) {
    return (
      <CustomForm
        config={config}
        onConfigChange={onConfigChange}
        nodes={nodes}
        edges={edges}
        currentNodeId={currentNodeId}
        debugSteps={debugSteps}
        {...additionalProps}
      />
    );
  }

  // Priority 2: Check for auto-config form
  if (nodeMetadata.useAutoConfigForm && nodeMetadata.fields) {
    return (
      <AutoConfigForm
        nodeType={nodeType}
        nodeMetadata={nodeMetadata}
        config={config}
        onConfigChange={onConfigChange}
        nodes={nodes}
        edges={edges}
        currentNodeId={currentNodeId}
        debugSteps={debugSteps}
        secrets={secrets}
        secretsLoading={secretsLoading}
        reloadSecrets={reloadSecrets}
      />
    );
  }

  // Priority 3: Fallback - show message if fields are defined but useAutoConfigForm is false
  if (nodeMetadata.fields && !nodeMetadata.useAutoConfigForm) {
    return (
      <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="font-semibold mb-2">⚠️ Custom Config Form Required</p>
        <p className="text-xs mb-2">
          This node has field definitions but uses a custom config form.
        </p>
        <p className="text-xs">
          To enable auto-config form, set <code className="bg-amber-100 px-1 rounded">useAutoConfigForm: true</code> in node metadata.
        </p>
      </div>
    );
  }

  // Final fallback
  return (
    <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
      <p>No configuration form available for this node type.</p>
      <p className="mt-2 text-xs">
        To add configuration:
      </p>
      <ul className="mt-1 text-xs list-disc list-inside space-y-1">
        <li>Define <code className="bg-gray-200 px-1 rounded">fields</code> in node metadata</li>
        <li>Set <code className="bg-gray-200 px-1 rounded">useAutoConfigForm: true</code></li>
        <li>Or register a custom config form component</li>
      </ul>
    </div>
  );
}

