import { useState, useEffect } from 'react';
import { adminService, type Statistics } from '../services/adminService';
import { PageHeader } from '../components/Layout/PageHeader';
import { useIsSuperAdmin } from '../utils/permissions';
import { Users, Building2, Workflow, Key, TrendingUp } from 'lucide-react';

export function AdminDashboardPage() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSuperAdmin = useIsSuperAdmin();

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getStatistics();
      setStatistics(data);
    } catch (err: any) {
      // Backend gibt {success: false, error: string} zurück
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to load statistics');
      console.error('Error loading statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Dashboard" description="Overview of your system" />
        <div className="p-8" style={{ paddingTop: '80px' }}>
          <div className="text-center">Loading...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Dashboard" description="Overview of your system" />
        <div className="p-8" style={{ paddingTop: '80px' }}>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        </div>
      </>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of your system" />
      <div className="p-8" style={{ paddingTop: '80px' }}>
        {/* Statistics Cards */}
        <div className={`grid gap-6 mb-8 ${isSuperAdmin ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Workflows</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalWorkflows}</p>
              </div>
              <Workflow className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Secrets</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalSecrets}</p>
              </div>
              <Key className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          {isSuperAdmin && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Tenants</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.totalTenants}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Additional Stats for Superadmin */}
        {isSuperAdmin && (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Super Admins</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.superAdmins}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.admins}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Published Workflows</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.publishedWorkflows}</p>
                </div>
                <Workflow className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

