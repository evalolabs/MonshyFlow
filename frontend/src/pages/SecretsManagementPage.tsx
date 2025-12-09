import { useState, useEffect } from 'react';
import { secretsService, type SecretResponse, type CreateSecretRequest, type UpdateSecretRequest, SecretType, SecretTypeLabels, type DecryptedSecretResponse } from '../services/secretsService';
import { PageHeader } from '../components/Layout/PageHeader';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Copy, Check } from 'lucide-react';

export function SecretsManagementPage() {
  const [secrets, setSecrets] = useState<SecretResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSecret, setEditingSecret] = useState<SecretResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [decryptedSecret, setDecryptedSecret] = useState<DecryptedSecretResponse | null>(null);
  const [showDecrypted, setShowDecrypted] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSecrets();
  }, []);

  const loadSecrets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await secretsService.getAllSecrets();
      setSecrets(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load secrets');
      console.error('Error loading secrets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSecret(null);
    setShowModal(true);
  };

  const handleEdit = (secret: SecretResponse) => {
    setEditingSecret(secret);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this secret?')) {
      return;
    }

    try {
      await secretsService.deleteSecret(id);
      await loadSecrets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete secret');
    }
  };

  const handleViewDecrypted = async (id: string) => {
    try {
      const decrypted = await secretsService.getDecryptedSecret(id);
      setDecryptedSecret(decrypted);
      setShowDecrypted(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to decrypt secret');
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSave = async (secretData: CreateSecretRequest | UpdateSecretRequest) => {
    try {
      if (editingSecret) {
        await secretsService.updateSecret(editingSecret.id, secretData as UpdateSecretRequest);
      } else {
        await secretsService.createSecret(secretData as CreateSecretRequest);
      }
      setShowModal(false);
      await loadSecrets();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${editingSecret ? 'update' : 'create'} secret`);
    }
  };

  const filteredSecrets = secrets.filter(secret =>
    secret.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false
  );

  if (loading && secrets.length === 0) {
    return (
      <>
        <PageHeader title="Secrets" description="Manage API keys and passwords" />
        <div className="p-8" style={{ paddingTop: '80px' }}>
          <div className="text-center">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Secrets"
        description="Manage API keys and passwords"
        actions={
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Secret
          </button>
        }
      />
      <div className="p-8" style={{ paddingTop: '80px' }}>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search secrets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Secrets Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Accessed</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSecrets.map((secret) => (
                <tr key={secret.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{secret.name || 'Unnamed'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {SecretTypeLabels[secret.secretType as SecretType] || `Type ${secret.secretType}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${secret.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {secret.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {secret.lastAccessedAt ? new Date(secret.lastAccessedAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewDecrypted(secret.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View decrypted value"
                      >
                        {showDecrypted === secret.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleEdit(secret)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(secret.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSecrets.length === 0 && (
            <div className="text-center py-8 text-gray-500">No secrets found</div>
          )}
        </div>

        {/* Decrypted Value Display */}
        {showDecrypted && decryptedSecret && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Decrypted Value</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(decryptedSecret.value)}
                  className="text-blue-600 hover:text-blue-900"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setShowDecrypted(null);
                    setDecryptedSecret(null);
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-white p-3 rounded border border-gray-300 font-mono text-sm break-all">
              {decryptedSecret.value}
            </div>
          </div>
        )}

        {/* Secret Modal */}
        {showModal && (
          <SecretModal
            secret={editingSecret}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          />
        )}
      </div>
    </>
  );
}

interface SecretModalProps {
  secret: SecretResponse | null;
  onClose: () => void;
  onSave: (data: CreateSecretRequest | UpdateSecretRequest) => void;
}

const DEFAULT_SMTP_CONFIG = {
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

function SecretModal({ secret, onClose, onSave }: SecretModalProps) {
  const [name, setName] = useState(secret?.name || '');
  const [description, setDescription] = useState(secret?.description || '');
  const [secretType, setSecretType] = useState<number>(secret?.secretType ?? SecretType.ApiKey);
  const [provider, setProvider] = useState(secret?.provider || '');
  const [value, setValue] = useState('');
  const [isActive, setIsActive] = useState(secret?.isActive ?? true);
  const [showValue, setShowValue] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState({ ...DEFAULT_SMTP_CONFIG });
  const [loadingSmtpConfig, setLoadingSmtpConfig] = useState(false);
  const [smtpLoadError, setSmtpLoadError] = useState<string | null>(null);
  const [selectedProviderTemplate, setSelectedProviderTemplate] = useState<ProviderName | ''>('');
  const isSmtpType = secretType === SecretType.Smtp;

  useEffect(() => {
    let isMounted = true;

    const loadExistingSmtpConfig = async () => {
      if (!secret || secret.secretType !== SecretType.Smtp || !secret.id) return;
      try {
        setLoadingSmtpConfig(true);
        setSmtpLoadError(null);
        const decrypted = await secretsService.getDecryptedSecret(secret.id);
        if (!isMounted) return;
        if (decrypted?.value) {
          try {
            const parsed = JSON.parse(decrypted.value);
            setSmtpConfig({
              host: parsed.host || '',
              port: parsed.port ?? 587,
              username: parsed.username || '',
              password: parsed.password || '',
              fromEmail: parsed.fromEmail || '',
              fromName: parsed.fromName || '',
              enableSsl: parsed.enableSsl !== undefined ? parsed.enableSsl : true,
            });
          } catch (err) {
            console.error('Failed to parse SMTP secret JSON', err);
            setSmtpLoadError('Failed to parse SMTP configuration. Please recreate the secret.');
            setSmtpConfig({ ...DEFAULT_SMTP_CONFIG });
          }
        }
      } catch (err: any) {
        console.error('Failed to load SMTP secret', err);
        if (isMounted) {
          setSmtpLoadError(err.response?.data?.message || 'Failed to load SMTP configuration.');
        }
      } finally {
        if (isMounted) {
          setLoadingSmtpConfig(false);
        }
      }
    };

    if (secret && secret.secretType === SecretType.Smtp) {
      loadExistingSmtpConfig();
    } else if (isSmtpType) {
      setSmtpConfig({ ...DEFAULT_SMTP_CONFIG });
      setSmtpLoadError(null);
      setSelectedProviderTemplate('');
    }

    return () => {
      isMounted = false;
    };
  }, [secret?.id, secret?.secretType, isSmtpType]);

  // Reset provider template when secret type changes
  useEffect(() => {
    if (!isSmtpType) {
      setSelectedProviderTemplate('');
    }
  }, [isSmtpType]);

  const handleProviderTemplateChange = (providerName: ProviderName | '') => {
    setSelectedProviderTemplate(providerName);
    if (providerName && providerName !== 'Custom' && SMTP_PROVIDERS[providerName]) {
      const template = SMTP_PROVIDERS[providerName];
      setSmtpConfig((prev) => ({
        ...prev,
        host: template.host,
        port: template.port,
        enableSsl: template.enableSsl,
      }));
      setProvider(providerName);
    } else if (providerName === 'Custom') {
      // Reset to defaults for custom
      setSmtpConfig((prev) => ({
        ...prev,
        host: '',
        port: 587,
        enableSsl: true,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let payloadValue = value;

    if (isSmtpType) {
      if (!smtpConfig.host.trim() || !smtpConfig.username.trim() || !smtpConfig.password.trim()) {
        alert('SMTP host, username, and password are required');
        return;
      }
      // Remove spaces from password (Gmail App Passwords are often copied with spaces)
      const cleanedPassword = smtpConfig.password.replace(/\s/g, '');
      
      payloadValue = JSON.stringify({
        host: smtpConfig.host.trim(),
        port: Number(smtpConfig.port) || 587,
        username: smtpConfig.username.trim(),
        password: cleanedPassword,
        fromEmail: smtpConfig.fromEmail.trim(),
        fromName: smtpConfig.fromName.trim(),
        enableSsl: smtpConfig.enableSsl,
      });
    }

    if (secret) {
      onSave({
        name,
        description: description || undefined,
        secretType,
        provider: provider || undefined,
        value: payloadValue || undefined,
        isActive,
      });
    } else {
      if (!payloadValue) {
        alert(isSmtpType ? 'Please complete the SMTP configuration' : 'Value is required');
        return;
      }
      onSave({
        name,
        description: description || undefined,
        secretType,
        provider: provider || undefined,
        value: payloadValue,
        isActive,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{secret ? 'Edit Secret' : 'Create Secret'}</h2>
        
        {/* Hidden fake fields to prevent browser password saving */}
        <input type="text" name="username" autoComplete="username" style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} tabIndex={-1} readOnly />
        <input type="password" name="password" autoComplete="new-password" style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} tabIndex={-1} readOnly />
        
        <form 
          onSubmit={handleSubmit} 
          className="space-y-4" 
          autoComplete="off" 
          data-form-type="secret"
          data-lpignore="true"
          data-1p-ignore="true"
        >
          <div>
            <label htmlFor="secret-name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              id="secret-name"
              name="secret-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="off"
              data-form-type="secret"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="secret-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              id="secret-description"
              name="secret-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoComplete="off"
              data-form-type="secret"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label htmlFor="secret-type" className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select
              id="secret-type"
              name="secret-type"
              value={secretType}
              onChange={(e) => setSecretType(Number(e.target.value))}
              required
              data-form-type="secret"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Object.values(SecretType).filter(v => typeof v === 'number').map(type => (
                <option key={type} value={type}>{SecretTypeLabels[type as SecretType]}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="secret-provider" className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
            <input
              id="secret-provider"
              name="secret-provider"
              type="text"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              autoComplete="off"
              data-form-type="secret"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Gmail, Outlook, SendGrid, etc."
              readOnly={!!(isSmtpType && selectedProviderTemplate && selectedProviderTemplate !== 'Custom')}
            />
            {isSmtpType && selectedProviderTemplate && selectedProviderTemplate !== 'Custom' && (
              <p className="text-xs text-gray-500 mt-1">
                Auto-filled from {selectedProviderTemplate} template
              </p>
            )}
          </div>

          {!isSmtpType ? (
            <div>
              <label htmlFor="secret-value" className="block text-sm font-medium text-gray-700 mb-1">
                Value {!secret && '*'}
              </label>
              <div className="relative">
                <input
                  id="secret-value"
                  name="secret-value"
                  type="text" // Never use type="password" to prevent browser password saving
                  value={showValue ? value : (value ? '•'.repeat(value.length) : '')}
                  onChange={(e) => setValue(e.target.value)}
                  required={!secret}
                  autoComplete="off"
                  data-form-type="secret"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-dashlane-ignore="true"
                  data-bitwarden-watching="0"
                  style={!showValue && value ? ({
                    textSecurity: 'disc',
                    fontFamily: 'monospace',
                    WebkitTextSecurity: 'disc',
                  } as React.CSSProperties & { WebkitTextSecurity?: string }) : undefined}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={secret ? 'Leave empty to keep current value' : 'Enter secret value'}
                />
                <button
                  type="button"
                  onClick={() => setShowValue(!showValue)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {secret && (
                <p className="mt-1 text-xs text-gray-500">Leave empty to keep current value</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                Store full SMTP credentials securely. You can reuse this profile across Email nodes.
              </div>
              {loadingSmtpConfig ? (
                <div className="text-sm text-gray-500">Loading SMTP configuration...</div>
              ) : (
                <>
                  {smtpLoadError && (
                    <div className="text-sm text-red-600">{smtpLoadError}</div>
                  )}
                  
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host *</label>
                      <input
                        type="text"
                        value={smtpConfig.host}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                        value={smtpConfig.port}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, port: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                        value={smtpConfig.username}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                        value={smtpConfig.password}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                        value={smtpConfig.fromEmail}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="noreply@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Default From Name</label>
                      <input
                        type="text"
                        value={smtpConfig.fromName}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Automation Bot"
                      />
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={smtpConfig.enableSsl}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, enableSsl: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    Enable SSL
                  </label>
                </>
              )}
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {secret ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

