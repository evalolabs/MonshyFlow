/**
 * Helper function to render form fields consistently
 * 
 * Automatically uses ExpressionEditor for expression-type fields,
 * regular inputs for other types.
 */

import type { Node, Edge } from '@xyflow/react';
import { ExpressionEditor } from '../ExpressionEditor';
import { getFieldConfig } from '../nodeFieldConfig';
import { SecretSelector } from '../NodeConfigPanel/SecretSelector';
import { SmtpProfileSelector } from '../NodeConfigPanel/SmtpProfileSelector';
import type { SecretResponse } from '../../../services/secretsService';

interface RenderFieldProps {
  nodeType: string;
  fieldName: string;
  label?: string;
  value: any;
  onChange: (value: any) => void;
  nodes: Node[];
  edges: Edge[];
  currentNodeId: string;
  previewSource?: any;
  debugSteps?: any[];
  // For special cases (select, range, etc.)
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  helpText?: string; // Help text for fields (especially secrets)
  // For secret fields
  secretType?: 'ApiKey' | 'Password' | 'Token' | 'Generic' | 'Smtp';
  secrets?: SecretResponse[];
  secretsLoading?: boolean;
  defaultSecretName?: string; // Default secret name (e.g., from API integration)
  showAdvanced?: boolean; // Show advanced override options
  reloadSecrets?: () => Promise<void>;
}

export function renderField({
  nodeType,
  fieldName,
  label,
  value,
  onChange,
  nodes,
  edges,
  currentNodeId,
  previewSource,
  debugSteps,
  options,
  min,
  max,
  step,
  placeholder,
  helpText,
  secretType,
  secrets = [],
  secretsLoading = false,
  defaultSecretName,
  showAdvanced = false,
  reloadSecrets,
}: RenderFieldProps) {
  const fieldConfig = getFieldConfig(nodeType, fieldName);
  
  if (fieldConfig?.type === 'smtpProfile') {
    return (
      <SmtpProfileSelector
        value={String(value || '')}
        onChange={onChange}
        secrets={secrets || []}
        secretsLoading={secretsLoading}
        reloadSecrets={reloadSecrets}
      />
    );
  }
  
  // Secret field - use SecretSelector
  if (fieldConfig?.type === 'secret' || secretType) {
    const effectiveSecretType = (fieldConfig as any)?.secretType || secretType || 'Generic';
    return (
      <div key={fieldName}>
        <SecretSelector
          label={label || fieldName}
          value={String(value || '')}
          onChange={onChange}
          secretType={effectiveSecretType as 'ApiKey' | 'Password' | 'Token' | 'Generic' | 'Smtp'}
          helpText={helpText || fieldConfig?.placeholder}
          secrets={secrets}
          secretsLoading={secretsLoading}
          defaultSecretName={defaultSecretName}
          showAdvanced={showAdvanced}
        />
      </div>
    );
  }
  
  // Expression field - use ExpressionEditor -
  if (fieldConfig?.type === 'expression') {
    return (
      <div key={fieldName}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <ExpressionEditor
          value={String(value || '')}
          onChange={onChange}
          placeholder={placeholder || fieldConfig.placeholder}
          multiline={fieldConfig.multiline}
          rows={fieldConfig.rows}
          nodes={nodes}
          edges={edges}
          currentNodeId={currentNodeId}
          previewSource={previewSource}
          debugSteps={debugSteps}
        />
      </div>
    );
  }

  // Select field
  if (fieldConfig?.type === 'select' || options) {
    return (
      <div key={fieldName}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }

  // Number/Range field
  if (fieldConfig?.type === 'number') {
    return (
      <div key={fieldName}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        {min !== undefined && max !== undefined ? (
          <>
            <input
              type="range"
              min={min}
              max={max}
              step={step || 1}
              value={value || min}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-500">{value || min}</div>
          </>
        ) : (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={fieldConfig.placeholder}
          />
        )}
      </div>
    );
  }

  // Multiline textarea (non-expression)
  if (fieldConfig?.type === 'textarea') {
    return (
      <div key={fieldName}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={fieldConfig.rows || 4}
          placeholder={fieldConfig.placeholder}
        />
      </div>
    );
  }

  // Default: text input
  return (
    <div key={fieldName}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={fieldConfig?.placeholder}
      />
    </div>
  );
}

