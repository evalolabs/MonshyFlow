import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { SecretType, type SecretResponse } from '../../../services/secretsService';
import { secretsService } from '../../../services/secretsService';

interface SmtpProfileSelectorProps {
  value: string;
  onChange: (value: string) => void;
  secrets: SecretResponse[];
  secretsLoading: boolean;
  reloadSecrets?: () => Promise<void>;
}

interface SmtpProfileFormState {
  profileName: string;
  provider: string;
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  enableSsl: boolean;
}

const DEFAULT_SMTP_FORM: SmtpProfileFormState = {
  profileName: 'smtp_profile_',
  provider: '',
  host: '',
  port: 587,
  username: '',
  password: '',
  fromEmail: '',
  fromName: '',
  enableSsl: true,
};

// Known SMTP provider templates
const SMTP_PROVIDERS = {
  Gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    enableSsl: true,
    helpText: 'Use an App Password (not your regular Gmail password). Enable 2FA and create an App Password in your Google Account settings.',
  },
  Outlook: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    enableSsl: true,
    helpText: 'Use your Microsoft account password or an App Password if 2FA is enabled.',
  },
  Yahoo: {
    host: 'smtp.mail.yahoo.com',
    port: 587,
    enableSsl: true,
    helpText: 'Use an App Password (not your regular Yahoo password). Generate one in your Yahoo Account Security settings.',
  },
  SendGrid: {
    host: 'smtp.sendgrid.net',
    port: 587,
    enableSsl: true,
    helpText: 'Use your SendGrid API key as the password. Username should be "apikey".',
  },
  Custom: {
    host: '',
    port: 587,
    enableSsl: true,
    helpText: 'Enter your custom SMTP server details.',
  },
} as const;

type ProviderName = keyof typeof SMTP_PROVIDERS;

export function SmtpProfileSelector({
  value,
  onChange,
  secrets,
  secretsLoading,
  reloadSecrets,
}: SmtpProfileSelectorProps) {
  // Debug: Log all received secrets
  console.log('[SmtpProfileSelector] Component rendered with secrets:', {
    totalSecrets: secrets.length,
    secrets: secrets.map(s => ({ 
      name: s.name, 
      secretType: s.secretType, 
      provider: s.provider,
      isActive: s.isActive
    })),
    secretsLoading,
    value
  });

  const smtpSecrets = useMemo(
    () => {
      // Filter for SMTP Profile secrets
      // Include: 
      // 1) Secrets with SecretType.Smtp
      // 2) Generic secrets that look like SMTP profiles (name contains "smtp" - case insensitive)
      // 3) Any secret with provider "Gmail", "Outlook", "Yahoo", "SendGrid" (likely SMTP profiles)
      const filtered = secrets.filter((secret) => {
        const nameLower = secret.name.toLowerCase();
        
        // Primary: SecretType.Smtp
        if (secret.secretType === SecretType.Smtp) {
          return true;
        }
        
        // Fallback 1: Generic secrets with SMTP-like names (for backwards compatibility)
        if (secret.secretType === SecretType.Generic && nameLower.includes('smtp')) {
          return true;
        }
        
        // Fallback 2: Secrets with email provider names (likely SMTP profiles)
        const emailProviders = ['gmail', 'outlook', 'yahoo', 'sendgrid'];
        if (secret.provider && emailProviders.some(p => secret.provider!.toLowerCase().includes(p))) {
          return true;
        }
        
        return false;
      });
      
      // Debug: Log filtered secrets to help diagnose issues
      console.log('[SmtpProfileSelector] Filtering secrets:', {
        total: secrets.length,
        filtered: filtered.length,
        allSecrets: secrets.map(s => ({ 
          name: s.name, 
          secretType: s.secretType, 
          provider: s.provider,
          matches: s.secretType === SecretType.Smtp || 
                   (s.secretType === SecretType.Generic && s.name.toLowerCase().includes('smtp')) ||
                   (s.provider && ['gmail', 'outlook', 'yahoo', 'sendgrid'].some(p => s.provider!.toLowerCase().includes(p)))
        }))
      });
      
      return filtered;
    },
    [secrets]
  );

  const selectedSecret = smtpSecrets.find((secret) => secret.name === value);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'select' | 'create'>('select');
  const [selectedSecretName, setSelectedSecretName] = useState<string>(value || '');
  const [formState, setFormState] = useState<SmtpProfileFormState>({ ...DEFAULT_SMTP_FORM });
  const [selectedProviderTemplate, setSelectedProviderTemplate] = useState<ProviderName | ''>('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSecretName(value || '');
  }, [value]);

  useEffect(() => {
    if (!isModalOpen) {
      setFormState({ ...DEFAULT_SMTP_FORM });
      setSelectedProviderTemplate('');
      setError(null);
    }
  }, [isModalOpen]);

  const handleProviderTemplateChange = (providerName: ProviderName | '') => {
    setSelectedProviderTemplate(providerName);
    if (providerName && providerName !== 'Custom' && SMTP_PROVIDERS[providerName]) {
      const template = SMTP_PROVIDERS[providerName];
      const providerLower = providerName.toLowerCase();
      setFormState((prev) => ({
        ...prev,
        provider: providerName,
        profileName: prev.profileName === DEFAULT_SMTP_FORM.profileName || !prev.profileName.trim()
          ? `smtp_${providerLower}_${Date.now().toString().slice(-6)}`
          : prev.profileName,
        host: template.host,
        port: template.port,
        enableSsl: template.enableSsl,
      }));
    } else if (providerName === 'Custom') {
      // Reset to defaults for custom
      setFormState((prev) => ({
        ...prev,
        host: '',
        port: 587,
        enableSsl: true,
      }));
    }
  };

  const handleSelect = () => {
    if (!selectedSecretName) {
      setError('Please select an SMTP profile');
      return;
    }
    setError(null);
    onChange(selectedSecretName);
    setIsModalOpen(false);
  };

  const handleCreate = async () => {
    if (!formState.profileName.trim()) {
      setError('Profile name is required');
      return;
    }
    if (!formState.host.trim()) {
      setError('SMTP host is required');
      return;
    }
    if (!formState.username.trim()) {
      setError('SMTP username is required');
      return;
    }
    if (!formState.password.trim()) {
      setError('SMTP password is required');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      // Remove spaces from password (Gmail App Passwords are often copied with spaces)
      const cleanedPassword = formState.password.replace(/\s/g, '');
      
      const payload = {
        host: formState.host.trim(),
        port: Number(formState.port) || 587,
        username: formState.username.trim(),
        password: cleanedPassword,
        fromEmail: formState.fromEmail.trim(),
        fromName: formState.fromName.trim(),
        enableSsl: formState.enableSsl,
      };

      await secretsService.createSecret({
        name: formState.profileName.trim(),
        description: formState.provider ? `SMTP for ${formState.provider}` : undefined,
        secretType: SecretType.Smtp,
        provider: formState.provider || undefined,
        value: JSON.stringify(payload),
        isActive: true,
      });

      if (reloadSecrets) {
        await reloadSecrets();
      }
      onChange(formState.profileName.trim());
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create SMTP profile');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          SMTP Profile <span className="text-green-600">(Recommended)</span>
        </label>
        {selectedSecret ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  ✅ Selected: <strong>{selectedSecret.name}</strong>
                </p>
                {selectedSecret.provider && (
                  <p className="text-xs text-green-600 mt-1">Provider: {selectedSecret.provider}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-xs text-red-600 hover:text-red-800 px-2 py-1 border border-red-200 rounded hover:bg-red-50"
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700 mb-3">
              <strong>No profile selected.</strong> Choose an option below:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalMode('select');
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 text-sm border border-blue-300 rounded-lg bg-white hover:bg-blue-50 text-blue-700 font-medium"
                disabled={secretsLoading}
              >
                📋 Select Existing Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalMode('create');
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 text-sm border border-transparent rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-2 font-medium"
              >
                <Plus className="w-4 h-4" />
                Create New Profile
              </button>
            </div>
          </div>
        )}
      </div>

      {!selectedSecret && (
        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded p-2">
          💡 <strong>Tip:</strong> SMTP Profiles store all your SMTP settings (host, port, username, password) securely. 
          Create one profile per email provider (Gmail, Outlook, etc.) and reuse it across all Email nodes.
        </p>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {modalMode === 'select' ? 'Select SMTP Profile' : 'Create SMTP Profile'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {modalMode === 'select' ? (
              <div className="space-y-4">
                {smtpSecrets.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No SMTP profiles found. Create one to get started.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {smtpSecrets.map((secret) => (
                      <label
                        key={secret.id}
                        className={`border rounded-lg p-3 flex flex-col gap-1 cursor-pointer ${
                          selectedSecretName === secret.name
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-800">{secret.name}</div>
                          <input
                            type="radio"
                            name="selected-smtp-secret"
                            value={secret.name}
                            checked={selectedSecretName === secret.name}
                            onChange={() => setSelectedSecretName(secret.name)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        {secret.provider && (
                          <div className="text-xs text-gray-500">Provider: {secret.provider}</div>
                        )}
                        {secret.description && (
                          <div className="text-xs text-gray-400">{secret.description}</div>
                        )}
                      </label>
                    ))}
                  </div>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSelect}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
                    disabled={smtpSecrets.length === 0}
                  >
                    Use Selected
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Provider Template Selector */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Setup - Select Provider
                  </label>
                  <select
                    value={selectedProviderTemplate}
                    onChange={(e) => handleProviderTemplateChange(e.target.value as ProviderName | '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Select a provider to auto-fill settings --</option>
                    <option value="Gmail">📧 Gmail</option>
                    <option value="Outlook">📧 Outlook / Microsoft 365</option>
                    <option value="Yahoo">📧 Yahoo Mail</option>
                    <option value="SendGrid">📧 SendGrid</option>
                    <option value="Custom">⚙️ Custom SMTP Server</option>
                  </select>
                  {selectedProviderTemplate && selectedProviderTemplate !== 'Custom' && (
                    <div className="mt-3 p-3 bg-white rounded border border-blue-300">
                      <p className="text-xs text-blue-800 font-medium mb-1">
                        💡 {SMTP_PROVIDERS[selectedProviderTemplate as ProviderName].helpText}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profile Name *</label>
                    <input
                      type="text"
                      value={formState.profileName}
                      onChange={(e) => setFormState({ ...formState, profileName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={selectedProviderTemplate === 'Gmail' ? 'smtp_gmail_marketing' : 'smtp_profile_name'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use a clear naming convention (e.g., smtp_provider_team)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                    <input
                      type="text"
                      value={formState.provider}
                      onChange={(e) => setFormState({ ...formState, provider: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Gmail, Outlook, SendGrid..."
                      readOnly={!!(selectedProviderTemplate && selectedProviderTemplate !== 'Custom')}
                    />
                    {selectedProviderTemplate && selectedProviderTemplate !== 'Custom' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-filled from template
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host *</label>
                    <input
                      type="text"
                      value={formState.host}
                      onChange={(e) => setFormState({ ...formState, host: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="smtp.gmail.com"
                      readOnly={!!(selectedProviderTemplate && selectedProviderTemplate !== 'Custom')}
                    />
                    {selectedProviderTemplate && selectedProviderTemplate !== 'Custom' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-filled from {selectedProviderTemplate} template
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port *</label>
                    <input
                      type="number"
                      value={formState.port}
                      onChange={(e) => setFormState({ ...formState, port: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="587"
                      readOnly={!!(selectedProviderTemplate && selectedProviderTemplate !== 'Custom')}
                    />
                    {selectedProviderTemplate && selectedProviderTemplate !== 'Custom' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-filled from {selectedProviderTemplate} template
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                    <input
                      type="text"
                      value={formState.username}
                      onChange={(e) => setFormState({ ...formState, username: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={
                        selectedProviderTemplate === 'Gmail' 
                          ? 'your-email@gmail.com' 
                          : selectedProviderTemplate === 'SendGrid'
                          ? 'apikey'
                          : 'your-email@example.com'
                      }
                    />
                    {selectedProviderTemplate === 'SendGrid' && (
                      <p className="text-xs text-gray-500 mt-1">
                        For SendGrid, use "apikey" as username
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password / App Password *</label>
                    <input
                      type="text"
                      value={formState.password}
                      onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={
                        selectedProviderTemplate === 'Gmail' || selectedProviderTemplate === 'Yahoo'
                          ? 'App Password (e.g., ykdv qqru ofie bcad)'
                          : selectedProviderTemplate === 'SendGrid'
                          ? 'SendGrid API Key'
                          : 'Password or App Password'
                      }
                    />
                    {(selectedProviderTemplate === 'Gmail' || selectedProviderTemplate === 'Yahoo') && (
                      <p className="text-xs text-gray-500 mt-1">
                        ⚠️ Use an App Password, not your regular email password.
                        <br />
                        💡 <strong>Tip:</strong> You can paste the password exactly as copied from Gmail (e.g., "ykdv qqru ofie bcad") - spaces will be automatically removed.
                      </p>
                    )}
                    {selectedProviderTemplate && selectedProviderTemplate !== 'Gmail' && selectedProviderTemplate !== 'Yahoo' && selectedProviderTemplate !== 'Custom' && (
                      <p className="text-xs text-gray-500 mt-1">
                        💡 <strong>Tip:</strong> You can paste passwords with spaces - they will be automatically cleaned.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default From Email</label>
                    <input
                      type="email"
                      value={formState.fromEmail}
                      onChange={(e) => setFormState({ ...formState, fromEmail: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="noreply@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default From Name</label>
                    <input
                      type="text"
                      value={formState.fromName}
                      onChange={(e) => setFormState({ ...formState, fromName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Marketing Bot"
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formState.enableSsl}
                    onChange={(e) => setFormState({ ...formState, enableSsl: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  Enable SSL (recommended)
                </label>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-sm"
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
                    disabled={creating}
                  >
                    {creating ? 'Creating...' : 'Create Profile'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
