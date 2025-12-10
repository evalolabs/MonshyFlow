import { useState, useEffect } from 'react';
import { apiKeysService, type ApiKeyResponse, type CreateApiKeyRequest } from '../services/apiKeysService';
import { PageHeader } from '../components/Layout/PageHeader';
import { Plus, Trash2, Copy, Check, Key, AlertCircle, Calendar, Clock, EyeOff } from 'lucide-react';

export function ApiKeysManagementPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState<ApiKeyResponse | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiKeysService.getAllApiKeys();
      setApiKeys(data);
    } catch (err: any) {
      // Backend gibt {success: false, error: string} zurück
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to load API keys');
      console.error('Error loading API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setNewApiKey(null);
    setShowNewKey(false);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await apiKeysService.deleteApiKey(id);
      await loadApiKeys();
    } catch (err: any) {
      alert(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to delete API key');
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? It will no longer be usable.')) {
      return;
    }

    try {
      setRevokingId(id);
      await apiKeysService.revokeApiKey(id);
      await loadApiKeys();
    } catch (err: any) {
      alert(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to revoke API key');
    } finally {
      setRevokingId(null);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const handleSave = async (request: CreateApiKeyRequest) => {
    try {
      const created = await apiKeysService.createApiKey(request);
      setNewApiKey(created);
      setShowNewKey(true);
      setShowModal(false);
      await loadApiKeys();
    } catch (err: any) {
      alert(err.response?.data?.error || err.response?.data?.message || err.message || `Failed to create API key`);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (expiresAt?: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isExpiringSoon = (expiresAt?: string | null) => {
    if (!expiresAt) return false;
    const daysUntilExpiry = Math.floor((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  if (loading && apiKeys.length === 0) {
    return (
      <>
        <PageHeader title="API Keys" description="Manage API keys for external integrations" />
        <div className="p-8" style={{ paddingTop: '80px' }}>
          <div className="text-center">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="API Keys"
        description="Manage API keys for external integrations (e.g., MonshyBot, Twilio)"
        actions={
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create API Key
          </button>
        }
      />
      <div className="p-8" style={{ paddingTop: '80px' }}>
        {/* New API Key Success Message */}
        {newApiKey && showNewKey && newApiKey.key && (
          <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Key className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">API Key Created Successfully!</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    ⚠️ <strong>Important:</strong> Copy this key now. You won't be able to see it again.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowNewKey(false);
                  setNewApiKey(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <EyeOff className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-300 mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-500 uppercase">API Key</label>
                <button
                  onClick={() => handleCopy(newApiKey.key!, newApiKey.id)}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                >
                  {copied === newApiKey.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="font-mono text-sm break-all bg-gray-50 p-3 rounded border border-gray-200">
                {newApiKey.key}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Store this key securely. It will not be shown again.</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* API Keys Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No API keys</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first API key.</p>
              <button
                onClick={handleCreate}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create API Key
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Used</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {apiKeys.map((apiKey) => (
                  <tr key={apiKey.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{apiKey.name || 'Unnamed'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{apiKey.description || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 text-xs rounded w-fit ${apiKey.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {apiKey.isActive ? 'Active' : 'Revoked'}
                        </span>
                        {apiKey.isActive && isExpired(apiKey.expiresAt) && (
                          <span className="px-2 py-1 text-xs rounded w-fit bg-red-100 text-red-800">
                            Expired
                          </span>
                        )}
                        {apiKey.isActive && isExpiringSoon(apiKey.expiresAt) && !isExpired(apiKey.expiresAt) && (
                          <span className="px-2 py-1 text-xs rounded w-fit bg-amber-100 text-amber-800">
                            Expiring Soon
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(apiKey.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(apiKey.lastUsedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {apiKey.expiresAt ? (
                        <div className={`flex items-center gap-1 ${isExpired(apiKey.expiresAt) ? 'text-red-600' : isExpiringSoon(apiKey.expiresAt) ? 'text-amber-600' : ''}`}>
                          <Calendar className="w-4 h-4" />
                          {formatDate(apiKey.expiresAt)}
                        </div>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {apiKey.isActive && (
                          <button
                            onClick={() => handleRevoke(apiKey.id)}
                            disabled={revokingId === apiKey.id}
                            className="text-amber-600 hover:text-amber-900 disabled:opacity-50"
                            title="Revoke API key"
                          >
                            {revokingId === apiKey.id ? (
                              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(apiKey.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete API key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Usage Instructions */}
        {apiKeys.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">How to use API Keys</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Include the API key in the <code className="bg-blue-100 px-1 rounded">Authorization</code> header as a Bearer token</p>
              <p>• Example: <code className="bg-blue-100 px-1 rounded">Authorization: Bearer mshy_...</code></p>
              <p>• Always include the <code className="bg-blue-100 px-1 rounded">tenantId</code> query parameter when using API keys</p>
              <p>• Example: <code className="bg-blue-100 px-1 rounded">GET /api/workflows?tenantId=your-tenant-id</code></p>
            </div>
          </div>
        )}

        {/* Create API Key Modal */}
        {showModal && (
          <CreateApiKeyModal
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          />
        )}
      </div>
    </>
  );
}

interface CreateApiKeyModalProps {
  onClose: () => void;
  onSave: (data: CreateApiKeyRequest) => void;
}

function CreateApiKeyModal({ onClose, onSave }: CreateApiKeyModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [hasExpiration, setHasExpiration] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name || undefined,
      description: description || undefined,
      expiresAt: hasExpiration && expiresAt ? expiresAt : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create API Key</h2>
          <p className="text-sm text-gray-500 mt-1">Create a new API key for external integrations</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., MonshyBot Voice Calls"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">A descriptive name to identify this API key</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., API Key for Twilio Voice-Call Webhooks"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={hasExpiration}
                onChange={(e) => setHasExpiration(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Set expiration date</span>
            </label>
            {hasExpiration && (
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
            <p className="text-xs text-gray-500 mt-1">
              {hasExpiration ? 'The API key will automatically expire on this date' : 'Leave unchecked for no expiration'}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Create API Key
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

