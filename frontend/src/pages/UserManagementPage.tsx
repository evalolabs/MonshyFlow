import { useState, useEffect } from 'react';
import { adminService, type User, type CreateUserRequest, type UpdateUserRequest, type Tenant, type Role } from '../services/adminService';
import { PageHeader } from '../components/Layout/PageHeader';
import { useIsSuperAdmin, useCurrentUserTenantId } from '../utils/permissions';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('');
  const isSuperAdmin = useIsSuperAdmin();
  const currentTenantId = useCurrentUserTenantId();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load users - filtered by tenant if not superadmin
      const usersData = await adminService.getAllUsers(isSuperAdmin ? selectedTenantFilter || undefined : undefined);
      setUsers(usersData);

      // Load tenants only if superadmin
      if (isSuperAdmin) {
        const tenantsData = await adminService.getAllTenants();
        setTenants(tenantsData);
      }

      // Load roles
      const rolesData = await adminService.getRoles();
      setRoles(rolesData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [selectedTenantFilter, isSuperAdmin]);

  const handleCreate = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await adminService.deleteUser(id);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleSave = async (userData: CreateUserRequest | UpdateUserRequest) => {
    try {
      if (editingUser) {
        await adminService.updateUser(editingUser.id, userData as UpdateUserRequest);
      } else {
        await adminService.createUser(userData as CreateUserRequest);
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${editingUser ? 'update' : 'create'} user`);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTenant = !selectedTenantFilter || user.tenantId === selectedTenantFilter;
    
    return matchesSearch && matchesTenant;
  });

  if (loading && users.length === 0) {
    return (
      <>
        <PageHeader title="Users" description="Manage system users" />
        <div className="p-8" style={{ paddingTop: '80px' }}>
          <div className="text-center">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage system users"
        actions={
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New User
          </button>
        }
      />
      <div className="p-8" style={{ paddingTop: '80px' }}>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {isSuperAdmin && (
            <select
              value={selectedTenantFilter}
              onChange={(e) => setSelectedTenantFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Tenants</option>
              {tenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                {isSuperAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.firstName || user.lastName
                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map(role => (
                        <span key={role} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.tenantName || user.tenantId}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">No users found</div>
          )}
        </div>

        {/* User Modal */}
        {showModal && (
          <UserModal
            user={editingUser}
            tenants={tenants}
            roles={roles}
            isSuperAdmin={isSuperAdmin}
            currentTenantId={currentTenantId}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          />
        )}
      </div>
    </>
  );
}

interface UserModalProps {
  user: User | null;
  tenants: Tenant[];
  roles: Role[];
  isSuperAdmin: boolean;
  currentTenantId?: string;
  onClose: () => void;
  onSave: (data: CreateUserRequest | UpdateUserRequest) => void;
}

function UserModal({ user, tenants, roles, isSuperAdmin, currentTenantId, onClose, onSave }: UserModalProps) {
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user?.roles || []);
  const [selectedTenantId, setSelectedTenantId] = useState(user?.tenantId || currentTenantId || '');
  const [isActive, setIsActive] = useState(user?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (user) {
      onSave({
        email,
        firstName,
        lastName,
        roles: selectedRoles,
        tenantId: isSuperAdmin ? selectedTenantId : undefined,
        isActive,
      });
    } else {
      if (!password) {
        alert('Password is required');
        return;
      }
      onSave({
        email,
        password,
        firstName,
        lastName,
        roles: selectedRoles,
        tenantId: isSuperAdmin ? selectedTenantId : currentTenantId,
      });
    }
  };

  const toggleRole = (roleName: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleName)) {
        return prev.filter(r => r !== roleName);
      } else {
        // Tenant-Admins dürfen keine system-internen Rollen vergeben
        if (!isSuperAdmin && (roleName === 'superadmin' || roleName === 'support')) {
          return prev;
        }
        return [...prev, roleName];
      }
    });
  };

  // Filter out system roles (superadmin/support) if not superadmin
  const availableRoles = roles.filter(role => {
    if (!isSuperAdmin && (role.name === 'superadmin' || role.name === 'support')) {
      return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{user ? 'Edit User' : 'Create User'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Tenant</option>
                {tenants.map(tenant => (
                  <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
            <div className="space-y-2">
              {availableRoles.map(role => (
                <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.name)}
                    onChange={() => toggleRole(role.name)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">{role.name}</span>
                  {role.isSystemRole && <span className="text-xs text-gray-500">(System)</span>}
                </label>
              ))}
            </div>
          </div>

          {user && (
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
              {user ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

