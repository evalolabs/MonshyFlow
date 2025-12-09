import { useState, useEffect } from 'react';
import { adminService, type Tenant, type CreateTenantRequest, type UpdateTenantRequest } from '../services/adminService';
import { PageHeader } from '../components/Layout/PageHeader';
import { useIsSuperAdmin } from '../utils/permissions';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

export function TenantManagementPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const isSuperAdmin = useIsSuperAdmin();

  useEffect(() => {
    if (isSuperAdmin) {
      loadTenants();
    }
  }, [isSuperAdmin]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getAllTenants();
      setTenants(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tenants');
      console.error('Error loading tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTenant(null);
    setShowModal(true);
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This will also delete all associated users and data.')) {
      return;
    }

    try {
      await adminService.deleteTenant(id);
      await loadTenants();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete tenant');
    }
  };

  const handleSave = async (tenantData: CreateTenantRequest | UpdateTenantRequest) => {
    try {
      if (editingTenant) {
        await adminService.updateTenant(editingTenant.id, tenantData as UpdateTenantRequest);
      } else {
        await adminService.createTenant(tenantData as CreateTenantRequest);
      }
      setShowModal(false);
      await loadTenants();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${editingTenant ? 'update' : 'create'} tenant`);
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isSuperAdmin) {
    return (
      <>
        <PageHeader title="Tenants" description="Manage tenant organizations" />
        <div className="p-8" style={{ paddingTop: '80px' }}>
          <div className="text-center text-red-600">Access denied. Only superadmins can manage tenants.</div>
        </div>
      </>
    );
  }

  if (loading && tenants.length === 0) {
    return (
      <>
        <PageHeader title="Tenants" description="Manage tenant organizations" />
        <div className="p-8" style={{ paddingTop: '80px' }}>
          <div className="text-center">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Manage tenant organizations"
        actions={
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Tenant
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
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tenants Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tenant.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{tenant.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${tenant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {tenant.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(tenant)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tenant.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTenants.length === 0 && (
            <div className="text-center py-8 text-gray-500">No tenants found</div>
          )}
        </div>

        {/* Tenant Modal */}
        {showModal && (
          <TenantModal
            tenant={editingTenant}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          />
        )}
      </div>
    </>
  );
}

interface TenantModalProps {
  tenant: Tenant | null;
  onClose: () => void;
  onSave: (data: CreateTenantRequest | UpdateTenantRequest) => void;
}

function TenantModal({ tenant, onClose, onSave }: TenantModalProps) {
  const [name, setName] = useState(tenant?.name || '');
  const [description, setDescription] = useState(tenant?.description || '');
  const [isActive, setIsActive] = useState(tenant?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (tenant) {
      onSave({
        name,
        description,
        isActive,
      });
    } else {
      onSave({
        name,
        description,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">{tenant ? 'Edit Tenant' : 'Create Tenant'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {tenant && (
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
          )}

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
              {tenant ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

