import type { SecretResponse } from '../../../services/secretsService';

export type SecretSelectorType = 'ApiKey' | 'Password' | 'Token' | 'Generic' | 'Smtp';

interface SecretSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  secretType?: SecretSelectorType;
  helpText?: string;
  secrets: SecretResponse[];
  secretsLoading: boolean;
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
}: SecretSelectorProps) {
  const filteredSecrets = secrets.filter(secret => secret.secretType === SECRET_TYPE_MAP[secretType]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <select
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        disabled={secretsLoading}
      >
        <option value="">None (use direct fields below)</option>
        {filteredSecrets.map(secret => (
          <option key={secret.id} value={secret.name}>
            {secret.name} {secret.provider ? `(${secret.provider})` : ''}
          </option>
        ))}
      </select>
      {helpText && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
      {secretsLoading && (
        <p className="mt-1 text-xs text-gray-400">Loading secrets...</p>
      )}
      {!secretsLoading && filteredSecrets.length === 0 && (
        <p className="mt-1 text-xs text-gray-400">
          No {secretType.toLowerCase()} secrets found. Create one in the Secrets section.
        </p>
      )}
    </div>
  );
}


