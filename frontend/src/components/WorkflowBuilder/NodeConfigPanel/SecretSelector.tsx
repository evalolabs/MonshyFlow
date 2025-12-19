import React from 'react';
import type { SecretResponse } from '../../../services/secretsService';
import { RotateCcw, Settings } from 'lucide-react';

export type SecretSelectorType = 'ApiKey' | 'Password' | 'Token' | 'Generic' | 'Smtp';

interface SecretSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  secretType?: SecretSelectorType;
  helpText?: string;
  secrets: SecretResponse[];
  secretsLoading: boolean;
  /** Default secret name (e.g., from API integration metadata) */
  defaultSecretName?: string;
  /** Show advanced override options */
  showAdvanced?: boolean;
}

const SECRET_TYPE_MAP: Record<SecretSelectorType, number> = {
  ApiKey: 0,
  Password: 1,
  Token: 2,
  Generic: 3,
  Smtp: 4,
};

export function SecretSelector({
  label,
  value,
  onChange,
  secretType = 'ApiKey',
  helpText,
  secrets,
  secretsLoading,
  defaultSecretName,
  showAdvanced = false,
}: SecretSelectorProps) {
  const filteredSecrets = secrets.filter(secret => secret.secretType === SECRET_TYPE_MAP[secretType]);
  
  // Check if default secret exists
  const defaultSecretExists = defaultSecretName 
    ? filteredSecrets.some(s => s.name === defaultSecretName)
    : false;
  
  // Determine if current value is the default
  const isUsingDefault = defaultSecretName && value === defaultSecretName;
  const isOverridden = defaultSecretName && value && value !== defaultSecretName && value !== '';
  
  // Effective value: use default if empty and default exists, otherwise use provided value
  const effectiveValue = (!value && defaultSecretName && defaultSecretExists) 
    ? defaultSecretName 
    : value;

  // Auto-apply default if empty and default exists
  React.useEffect(() => {
    if (!value && defaultSecretName && defaultSecretExists && effectiveValue === defaultSecretName) {
      onChange(defaultSecretName);
    }
  }, [defaultSecretName, defaultSecretExists, value, effectiveValue, onChange]);

  const handleResetToDefault = () => {
    if (defaultSecretName && defaultSecretExists) {
      onChange(defaultSecretName);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
        {isOverridden && (
          <span className="px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded flex items-center gap-1">
            <Settings className="w-3 h-3" />
            Overridden
          </span>
        )}
        {isUsingDefault && defaultSecretName && (
          <span className="px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded">
            Using Default
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
      <select
          value={effectiveValue || ''}
        onChange={(event) => onChange(event.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        disabled={secretsLoading}
      >
        <option value="">None (use direct fields below)</option>
          {defaultSecretName && defaultSecretExists && (
            <optgroup label="Default">
              <option value={defaultSecretName}>
                {defaultSecretName} {secrets.find(s => s.name === defaultSecretName)?.provider ? `(${secrets.find(s => s.name === defaultSecretName)?.provider})` : ''} [Default]
              </option>
            </optgroup>
          )}
          {filteredSecrets.length > 0 && (
            <optgroup label={defaultSecretName && defaultSecretExists ? "Custom" : "Available Secrets"}>
              {filteredSecrets
                .filter(s => !defaultSecretName || s.name !== defaultSecretName)
                .map(secret => (
          <option key={secret.id} value={secret.name}>
            {secret.name} {secret.provider ? `(${secret.provider})` : ''}
          </option>
        ))}
            </optgroup>
          )}
      </select>
        
        {isOverridden && showAdvanced && (
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-2 py-2 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 border border-gray-300 rounded-md flex items-center gap-1 transition-colors"
            title="Reset to default secret"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>
      
      {helpText && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
      {defaultSecretName && !defaultSecretExists && (
        <p className="mt-1 text-xs text-amber-600">
          ⚠️ Default secret "{defaultSecretName}" not found. Create it or select a custom secret.
        </p>
      )}
      {secretsLoading && (
        <p className="mt-1 text-xs text-gray-400">Loading secrets...</p>
      )}
      {!secretsLoading && filteredSecrets.length === 0 && !defaultSecretName && (
        <p className="mt-1 text-xs text-gray-400">
          No {secretType.toLowerCase()} secrets found. Create one in the Secrets section.
        </p>
      )}
    </div>
  );
}


