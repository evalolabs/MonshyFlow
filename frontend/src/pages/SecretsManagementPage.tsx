import { useEffect, useMemo, useState } from 'react';
import { secretsService, type SecretResponse, type CreateSecretRequest, type UpdateSecretRequest, SecretType, SecretTypeLabels, type DecryptedSecretResponse } from '../services/secretsService';
import { PageHeader } from '../components/Layout/PageHeader';
import { Plus, Edit, Trash2, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DataTable } from '../components/DataTable/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

export function SecretsManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [secrets, setSecrets] = useState<SecretResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSecret, setEditingSecret] = useState<SecretResponse | null>(null);
  const [decryptedSecret, setDecryptedSecret] = useState<DecryptedSecretResponse | null>(null);
  const [showDecrypted, setShowDecrypted] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [prefillCreate, setPrefillCreate] = useState<SecretCreatePrefill | null>(null);
  const [returnTo, setReturnTo] = useState<string | null>(null);

  const deepLink = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const create = params.get('create') === '1';
    const name = params.get('name') || '';
    const type = params.get('type') || '';
    const provider = params.get('provider') || '';
    const description = params.get('description') || '';
    const rt = params.get('returnTo') || '';
    return { create, name, type, provider, description, returnTo: rt };
  }, [location.search]);

  useEffect(() => {
    loadSecrets();
  }, []);

  // Deep-link: /admin/secrets?create=1&name=OPENAI_API_KEY&type=ApiKey&provider=OpenAI&returnTo=/workflow/123
  useEffect(() => {
    if (!deepLink.create) {
      return;
    }

    const mappedType = mapSecretTypeFromQuery(deepLink.type);
    setEditingSecret(null);
    setPrefillCreate({
      name: deepLink.name,
      secretType: mappedType,
      provider: deepLink.provider,
      description: deepLink.description,
    });
    setReturnTo(deepLink.returnTo || null);
    setShowModal(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLink.create]);

  const loadSecrets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await secretsService.getAllSecrets();
      setSecrets(data);
    } catch (err: any) {
      // Backend gibt {success: false, error: string} zurück
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to load secrets');
      console.error('Error loading secrets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSecret(null);
    setPrefillCreate(null);
    setReturnTo(null);
    setShowModal(true);
  };

  const handleEdit = (secret: SecretResponse) => {
    setEditingSecret(secret);
    setPrefillCreate(null);
    setReturnTo(null);
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
        alert(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to delete secret');
    }
  };

  const handleViewDecrypted = async (id: string) => {
    try {
      const decrypted = await secretsService.getDecryptedSecret(id);
      setDecryptedSecret(decrypted);
      setShowDecrypted(id);
    } catch (err: any) {
        alert(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to decrypt secret');
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
      setEditingSecret(null);
      setPrefillCreate(null);
      const rt = returnTo;
      setReturnTo(null);
      await loadSecrets();

      // If user came here from a deep-link, return them to the workflow.
      if (!editingSecret && rt) {
        navigate(rt);
      } else if (!editingSecret && deepLink.create) {
        // Clear query params after a deep-link create to avoid re-opening the modal on refresh.
        navigate('/admin/secrets', { replace: true });
      }
    } catch (err: any) {
        alert(err.response?.data?.error || err.response?.data?.message || err.message || `Failed to ${editingSecret ? 'update' : 'create'} secret`);
    }
  };

  const columns = useMemo<ColumnDef<SecretResponse>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="text-sm font-medium text-gray-900">{row.original.name || 'Unnamed'}</span>
        ),
        size: 200,
      },
      {
        accessorKey: 'secretType',
        header: 'Type',
        cell: ({ row }) => (
          <span className="text-sm text-gray-500">
            {SecretTypeLabels[row.original.secretType as SecretType] || `Type ${row.original.secretType}`}
          </span>
        ),
        size: 150,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <span
            className={`px-2 py-1 text-xs rounded ${
              row.original.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {row.original.isActive ? 'Active' : 'Inactive'}
          </span>
        ),
        size: 120,
      },
      {
        accessorKey: 'lastAccessedAt',
        header: 'Last Accessed',
        cell: ({ row }) => (
          <span className="text-sm text-gray-500">
            {row.original.lastAccessedAt ? new Date(row.original.lastAccessedAt).toLocaleDateString() : 'Never'}
          </span>
        ),
        size: 150,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleViewDecrypted(row.original.id)}
              className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50"
              title="View decrypted value"
            >
              {showDecrypted === row.original.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleEdit(row.original)}
              className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
        size: 150,
        enableSorting: false,
      },
    ],
    [showDecrypted]
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
        {/* Tenant Badge */}
        {user?.tenantName && (
          <div className="mb-4 flex items-center gap-2">
            <span className="px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
              🏢 {user.tenantName}
            </span>
            <span className="text-xs text-gray-500">
              Showing secrets for your organization
            </span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Secrets Table */}
        <DataTable
          columns={columns}
          data={secrets}
          searchable={true}
          searchPlaceholder="Search secrets..."
          enablePagination={true}
          pageSize={10}
          enableSorting={true}
          enableColumnResize={true}
          onRowDoubleClick={(secret) => handleEdit(secret)}
        />

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
            prefill={prefillCreate}
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
  prefill?: SecretCreatePrefill | null;
  onClose: () => void;
  onSave: (data: CreateSecretRequest | UpdateSecretRequest) => void;
}

interface SecretCreatePrefill {
  name?: string;
  description?: string;
  secretType?: number;
  provider?: string;
}

function mapSecretTypeFromQuery(value: string): number {
  const v = (value || '').toLowerCase();
  if (v === 'apikey' || v === 'api_key' || v === 'api-key') return SecretType.ApiKey;
  if (v === 'password') return SecretType.Password;
  if (v === 'token') return SecretType.Token;
  if (v === 'generic') return SecretType.Generic;
  if (v === 'smtp') return SecretType.Smtp;
  return SecretType.ApiKey;
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

function SecretModal({ secret, prefill, onClose, onSave }: SecretModalProps) {
  const isCreate = !secret;
  const [name, setName] = useState(secret?.name || prefill?.name || '');
  const [description, setDescription] = useState(secret?.description || prefill?.description || '');
  const [secretType, setSecretType] = useState<number>(secret?.secretType ?? prefill?.secretType ?? SecretType.ApiKey);
  const [provider, setProvider] = useState(secret?.provider || prefill?.provider || '');
  const [value, setValue] = useState('');
  const [isActive, setIsActive] = useState(secret?.isActive ?? true);
  const [showValue, setShowValue] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState({ ...DEFAULT_SMTP_CONFIG });
  const [loadingSmtpConfig, setLoadingSmtpConfig] = useState(false);
  const [smtpLoadError, setSmtpLoadError] = useState<string | null>(null);
  const [selectedProviderTemplate, setSelectedProviderTemplate] = useState<ProviderName | ''>('');
  const isSmtpType = secretType === SecretType.Smtp;

  // If prefill changes while creating (deep-link), update fields once.
  useEffect(() => {
    if (!isCreate) return;
    if (!prefill) return;
    if (prefill.name !== undefined) setName(prefill.name);
    if (prefill.description !== undefined) setDescription(prefill.description);
    if (prefill.secretType !== undefined) setSecretType(prefill.secretType);
    if (prefill.provider !== undefined) setProvider(prefill.provider);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreate, prefill?.name, prefill?.description, prefill?.secretType, prefill?.provider]);

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

