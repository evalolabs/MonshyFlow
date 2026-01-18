import { useState, useEffect } from 'react';
import { auditLogService, type AuditLog } from '../services/auditLogService';
import { PageHeader } from '../components/Layout/PageHeader';
import { useCurrentUserTenantId, useIsSuperAdmin } from '../utils/permissions';
import { Search, Filter, Calendar, User, Shield, FileText, Eye } from 'lucide-react';

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [limit] = useState(100);
  const [skip, setSkip] = useState(0);
  const [filter, setFilter] = useState<'all' | 'superadmin'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const currentTenantId = useCurrentUserTenantId();
  const isSuperAdmin = useIsSuperAdmin();

  useEffect(() => {
    loadLogs();
  }, [skip, filter, currentTenantId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (filter === 'superadmin' && isSuperAdmin) {
        response = await auditLogService.getSuperAdminAccessLogs(limit, skip);
      } else if (currentTenantId) {
        response = await auditLogService.getTenantAuditLogs(currentTenantId, limit, skip);
      } else {
        throw new Error('Tenant ID not found');
      }

      setLogs(response.data);
      setTotal(response.pagination?.total || response.data.length);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load audit logs');
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'ACCESS':
        return 'bg-blue-100 text-blue-800';
      case 'LIST':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'CREATE':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource.toLowerCase()) {
      case 'workflow':
        return '📊';
      case 'user':
        return '👤';
      case 'secret':
        return '🔐';
      case 'apikey':
        return '🔑';
      case 'tenant':
        return '🏢';
      default:
        return '📄';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(search) ||
      log.resource.toLowerCase().includes(search) ||
      log.userEmail?.toLowerCase().includes(search) ||
      log.reason?.toLowerCase().includes(search) ||
      log.ipAddress?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Audit-Logs"
        description="Einsehen aller Zugriffe auf Ihre Daten (DSGVO-Konformität: Transparenz)"
        icon={Eye}
      />

      {/* Filter und Suche */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Suche nach Aktion, Ressource, Email, Grund, IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {isSuperAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFilter('all');
                setSkip(0);
              }}
              className={`px-4 py-2 rounded-lg border ${
                filter === 'all'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Alle Logs
            </button>
            <button
              onClick={() => {
                setFilter('superadmin');
                setSkip(0);
              }}
              className={`px-4 py-2 rounded-lg border ${
                filter === 'superadmin'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Superadmin-Zugriffe
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Lade Audit-Logs...</p>
        </div>
      )}

      {/* Logs Table */}
      {!loading && !error && (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zeitpunkt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktion
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ressource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Benutzer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grund
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP-Adresse
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p>Keine Audit-Logs gefunden</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            {formatDate(log.timestamp)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <span className="mr-2">{getResourceIcon(log.resource)}</span>
                            <span className="font-medium">{log.resource}</span>
                            {log.resourceId && (
                              <span className="ml-2 text-gray-500 text-xs">
                                ({log.resourceId.substring(0, 8)}...)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            {log.userRole === 'superadmin' ? (
                              <Shield className="w-4 h-4 text-red-500 mr-2" />
                            ) : (
                              <User className="w-4 h-4 text-gray-400 mr-2" />
                            )}
                            <div>
                              <div className="font-medium">
                                {log.userEmail || log.userId}
                              </div>
                              <div className="text-xs text-gray-500">{log.userRole}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {log.reason || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.ipAddress || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Zeige {skip + 1} bis {Math.min(skip + limit, total)} von {total} Logs
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSkip(Math.max(0, skip - limit))}
                  disabled={skip === 0}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Zurück
                </button>
                <button
                  onClick={() => setSkip(skip + limit)}
                  disabled={skip + limit >= total}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Weiter
                </button>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex">
              <Eye className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">
                  DSGVO-Konformität: Transparenz
                </h3>
                <p className="text-sm text-blue-700">
                  Diese Seite zeigt alle Zugriffe auf Ihre Daten. Superadmin-Zugriffe werden
                  automatisch protokolliert und hier angezeigt, um vollständige Transparenz zu
                  gewährleisten (Art. 13 DSGVO).
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

