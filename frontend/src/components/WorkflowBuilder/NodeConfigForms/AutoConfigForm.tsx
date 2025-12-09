/**
 * AutoConfigForm Component
 * 
 * Automatically generates configuration forms from node metadata.
 * This eliminates the need for manual switch-cases in NodeConfigPanel.
 */

import type { Node, Edge } from '@xyflow/react';
import { renderField } from '../helpers/renderField';
import type { NodeMetadata, FieldConfig } from '../nodeRegistry/nodeMetadata';
import type { SecretResponse } from '../../../services/secretsService';

interface AutoConfigFormProps {
  nodeType: string;
  nodeMetadata: NodeMetadata;
  config: any;
  onConfigChange: (updates: any) => void;
  nodes: Node[];
  edges: Edge[];
  currentNodeId: string;
  debugSteps?: any[];
  secrets?: SecretResponse[];
  secretsLoading?: boolean;
  reloadSecrets?: () => Promise<void>;
}

export function AutoConfigForm({
  nodeType,
  nodeMetadata,
  config,
  onConfigChange,
  nodes,
  edges,
  currentNodeId,
  debugSteps = [],
  secrets = [],
  secretsLoading = false,
  reloadSecrets,
}: AutoConfigFormProps) {

  // If no fields defined, show message
  if (!nodeMetadata.fields || Object.keys(nodeMetadata.fields).length === 0) {
    return (
      <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
        <p>No configuration fields defined for this node type.</p>
        <p className="mt-2 text-xs">
          To add configuration, define <code className="bg-gray-200 px-1 rounded">fields</code> in the node metadata.
        </p>
      </div>
    );
  }

  // Helper function to check if field should be displayed based on displayCondition
  const shouldDisplayField = (fieldConfig: FieldConfig, config: any): boolean => {
    if (!fieldConfig.displayCondition) {
      return true; // No condition, always show
    }

    const { field, operator, value } = fieldConfig.displayCondition;
    let fieldValue = config[field] ?? '';
    
    // Handle empty or "None" values from SecretSelector
    // SecretSelector returns empty string when "None" is selected
    if (fieldValue === '' || fieldValue === 'None (use default configuration)' || fieldValue === 'None (use direct fields below)') {
      fieldValue = '';
    }

    switch (operator) {
      case 'equals':
        // Show field if the condition field is empty (no secret selected)
        return fieldValue === value;
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);
      case 'notIn':
        return Array.isArray(value) && !value.includes(fieldValue);
      default:
        return true;
    }
  };

  // Group fields for better UX (especially for Email node with SMTP configuration)
  const regularFields: Array<[string, FieldConfig]> = [];
  const smtpProfileSecret: Array<[string, FieldConfig]> = [];
  const smtpLegacySecretFields: Array<[string, FieldConfig]> = [];
  const smtpDirectFields: Array<[string, FieldConfig]> = [];
  const smtpSenderFields: Array<[string, FieldConfig]> = []; // From Name Secret, etc.
  
  Object.entries(nodeMetadata.fields).forEach(([fieldName, fieldConfig]) => {
    if (fieldName === 'smtpProfileSecret') {
      // Primary SMTP Profile selector (new way)
      smtpProfileSecret.push([fieldName, fieldConfig]);
    } else if (fieldName === 'fromNameSecret') {
      // Sender information (From Name) - part of SMTP configuration
      smtpSenderFields.push([fieldName, fieldConfig]);
    } else if (fieldName.includes('Secret') && (fieldName.includes('smtp') || fieldName.includes('Smtp'))) {
      // Legacy SMTP secrets (old way)
      smtpLegacySecretFields.push([fieldName, fieldConfig]);
    } else if (fieldName.includes('smtp') || fieldName.includes('Smtp')) {
      // Direct SMTP fields (fallback)
      smtpDirectFields.push([fieldName, fieldConfig]);
    } else {
      regularFields.push([fieldName, fieldConfig]);
    }
  });

  const renderFieldItem = ([fieldName, fieldConfig]: [string, FieldConfig]) => {
    // Check display condition
    if (!shouldDisplayField(fieldConfig, config)) {
      return null;
    }

    const fieldValue = config[fieldName] ?? fieldConfig.default ?? '';

    if (fieldConfig.hideWhenEmpty && (fieldValue === '' || fieldValue === undefined || fieldValue === null)) {
      return null;
    }
    
    // Generate label from field name if not provided
    const label = fieldConfig.label || 
      fieldName
        .split(/(?=[A-Z])|[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    return (
      <div key={fieldName}>
        {renderField({
          nodeType,
          fieldName,
          label,
          value: fieldValue,
          onChange: (value) => {
            onConfigChange({ ...config, [fieldName]: value });
          },
          nodes,
          edges,
          currentNodeId,
          debugSteps,
          options: fieldConfig.options,
          min: fieldConfig.min,
          max: fieldConfig.max,
          step: fieldConfig.step,
          secretType: (fieldConfig as any)?.secretType,
          secrets,
          secretsLoading,
          reloadSecrets,
        })}
        {fieldConfig.placeholder && !fieldConfig.multiline && (
          <p className="text-xs text-gray-500 mt-1 ml-1">
            {fieldConfig.placeholder}
          </p>
        )}
      </div>
    );
  };


  // Check if SMTP profile is selected
  const hasSmtpProfile = config.smtpProfileSecret && config.smtpProfileSecret !== '';
  
  // Check if any legacy secrets are selected
  const hasLegacySecrets = smtpLegacySecretFields.some(([fieldName]) => {
    const value = config[fieldName];
    return value && value !== '' && value !== 'None (use direct fields below)';
  });
  
  // Check if any direct SMTP fields should be shown (only if no profile and no legacy secrets)
  // Note: We don't check shouldDisplayField here because the displayCondition is already
  // checked in renderFieldItem, and we want to show the section if any direct fields exist
  const showDirectFields = !hasSmtpProfile && !hasLegacySecrets && smtpDirectFields.length > 0;

  return (
    <div className="space-y-4">
      {/* Regular fields */}
      {regularFields.map(renderFieldItem)}

      {/* SMTP Configuration Section */}
      {(smtpProfileSecret.length > 0 || smtpLegacySecretFields.length > 0 || smtpDirectFields.length > 0 || smtpSenderFields.length > 0) && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">SMTP Configuration</h3>
            {!hasSmtpProfile && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-blue-800 mb-1">
                  📧 How to configure SMTP:
                </p>
                <ol className="text-xs text-blue-700 space-y-1 ml-4 list-decimal">
                  <li><strong>Recommended:</strong> Select or create an SMTP Profile below (stores all SMTP settings in one place)</li>
                  <li>Or use direct fields at the bottom (for quick testing only)</li>
                </ol>
              </div>
            )}
          </div>
          
          {/* Primary: SMTP Profile Selector (new way) */}
          {smtpProfileSecret.length > 0 && (
            <div className="space-y-4 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
                <p className="text-xs font-medium text-green-800">
                  ✅ <strong>Recommended:</strong> Use SMTP Profile (stores all settings securely)
                </p>
              </div>
              {smtpProfileSecret.map(renderFieldItem)}
              {hasSmtpProfile && (
                <p className="text-xs text-green-600 bg-green-50 border border-green-200 rounded p-2">
                  ✅ Using SMTP Profile: <strong>{config.smtpProfileSecret}</strong>
                </p>
              )}
            </div>
          )}

          {/* Legacy: Individual SMTP Secrets (old way - hidden by default, only show if explicitly needed) */}
          {false && !hasSmtpProfile && smtpLegacySecretFields.length > 0 && (
            <div className="space-y-4 mb-4">
              <details className="bg-amber-50 border border-amber-200 rounded p-2">
                <summary className="text-xs text-amber-600 cursor-pointer font-medium">
                  ⚠️ Legacy: Individual SMTP secrets (click to expand)
                </summary>
                <p className="text-xs text-amber-700 mt-2 mb-3">
                  These are old individual secret fields. We recommend using SMTP Profile above instead.
                </p>
                <div className="space-y-4">
                  {smtpLegacySecretFields.map(renderFieldItem)}
                </div>
              </details>
            </div>
          )}

          {/* Fallback: SMTP Direct Fields (only shown if no profile and no legacy secrets) */}
          {showDirectFields && (
            <div className="space-y-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-amber-600 text-lg">⚠️</span>
                <div>
                  <p className="text-xs font-medium text-amber-800 mb-1">
                    Direct SMTP Configuration (Quick Testing Only)
                  </p>
                  <p className="text-xs text-amber-700">
                    <strong>Not recommended for production.</strong> These fields are shown because no SMTP profile is selected above. 
                    For better security and reusability, please create an SMTP Profile instead.
                  </p>
                </div>
              </div>
              {smtpDirectFields.map(renderFieldItem)}
            </div>
          )}

          {/* Sender Information (From Name) */}
          {smtpSenderFields.length > 0 && (
            <div className="space-y-4 mt-6 pt-4 border-t border-gray-200">
              <div className="mb-2">
                <h4 className="text-xs font-semibold text-gray-700 mb-1">Email Sender Information</h4>
                <p className="text-xs text-gray-500">
                  Optional: Set the display name that appears as the sender in the email (e.g., "Marketing Team" or "Support Bot").
                  If not set, the SMTP Profile's default "From Name" will be used, or "Agent Builder" as fallback.
                </p>
              </div>
              {smtpSenderFields.map(renderFieldItem)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

