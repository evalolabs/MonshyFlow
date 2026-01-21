import { useEffect, useState } from 'react';
import { PageHeader } from '../components/Layout/PageHeader';
import { Plus, Trash2 } from 'lucide-react';
import { supportConsentService, type SupportConsent } from '../services/supportConsentService';
import { useIsTenantAdmin } from '../utils/permissions';

export function SupportConsentsPage() {
  const isTenantAdmin = useIsTenantAdmin();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consents, setConsents] = useState<SupportConsent[]>([]);

  const [grantedToUserId, setGrantedToUserId] = useState('');
  const [expiresInMinutes, setExpiresInMinutes] = useState(60);
  const [ticketId, setTicketId] = useState('');
  const [reason, setReason] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await supportConsentService.listConsents();
      setConsents(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load support consents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    try {
      setLoading(true);
      setError(null);
      await supportConsentService.createConsent({
        grantedToUserId: grantedToUserId.trim(),
        expiresInMinutes,
        ticketId: ticketId.trim() || undefined,
        reason: reason.trim() || undefined,
        scopes: ['workflow:read:content'],
      });
      setGrantedToUserId('');
      setTicketId('');
      setReason('');
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to create consent');
    } finally {
      setLoading(false);
    }
  };

  const onRevoke = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await supportConsentService.revokeConsent(id);
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke consent');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (iso: string) => new Date(iso).toLocaleString('de-DE');

  if (!isTenantAdmin) {
    return (
      <div className="p-6">
        <PageHeader title="Support-Freigaben" description="Nur für Tenant-Admins" />
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Forbidden: Nur Tenant-Admins dürfen Support-Freigaben verwalten.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Support-Freigaben"
        description="Workflow-Inhalte nur nach zeitlich begrenzter Freigabe (Secrets sind immer ausgeschlossen)"
      />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Support User ID</label>
            <input
              value={grantedToUserId}
              onChange={(e) => setGrantedToUserId(e.target.value)}
              placeholder="z.B. 65f0... (Support muss seine UserId liefern)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dauer (Min)</label>
            <input
              type="number"
              min={5}
              max={240}
              value={expiresInMinutes}
              onChange={(e) => setExpiresInMinutes(parseInt(e.target.value || '60', 10))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ticket (optional)</label>
            <input
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="z.B. JIRA-123"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Grund (optional)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Kurz beschreiben, warum Support Workflow-Inhalte sehen muss"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onCreate}
            disabled={loading || !grantedToUserId.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Freigabe erteilen (workflow:read:content)
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Aktualisieren
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          Hinweis: Support bekommt damit Zugriff auf Workflow-Inhalte Ihres Tenants für die angegebene Zeit.
          <b> Secrets bleiben immer gesperrt.</b>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Support User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scopes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktion
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {consents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Keine Freigaben vorhanden
                  </td>
                </tr>
              ) : (
                consents.map((c) => {
                  const active = !c.revokedAt && new Date(c.expiresAt).getTime() > Date.now();
                  return (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-mono text-xs">{c.grantedToUserId}</div>
                        {(c.ticketId || c.reason) && (
                          <div className="text-xs text-gray-500">
                            {c.ticketId ? `Ticket: ${c.ticketId}` : null}
                            {c.ticketId && c.reason ? ' · ' : null}
                            {c.reason ? c.reason : null}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(c.scopes || []).join(', ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {fmt(c.expiresAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {c.revokedAt ? (
                          <span className="text-gray-500">revoked</span>
                        ) : active ? (
                          <span className="text-green-700">active</span>
                        ) : (
                          <span className="text-gray-500">expired</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => onRevoke(c._id)}
                          disabled={loading || !!c.revokedAt}
                          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Widerrufen
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


