import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Key, Building2, LogOut, Workflow, Shield, Eye, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useIsSuperAdmin, useIsTenantAdmin } from '../../utils/permissions';

export function Navigation() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isSuperAdmin = useIsSuperAdmin();
  const isTenantAdmin = useIsTenantAdmin();

  // Don't show navigation in workflow editor
  const isWorkflowPage = location.pathname.startsWith('/workflow/') || location.pathname.startsWith('/webhook-test/');
  
  if (isWorkflowPage) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/workflows';
    }
    return location.pathname.startsWith(path);
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/admin',
      icon: LayoutDashboard,
      permission: null, // Always visible
    },
    {
      name: 'Workflows',
      path: '/',
      icon: Workflow,
      permission: null, // Always visible
    },
    {
      name: 'Users',
      path: '/admin/users',
      icon: Users,
      permission: null, // Always visible
    },
    {
      name: 'Secrets',
      path: '/admin/secrets',
      icon: Key,
      permission: null, // Always visible
    },
    {
      name: 'API Keys',
      path: '/admin/apikeys',
      icon: Shield,
      permission: null, // Always visible
    },
    {
      name: 'Support Consents',
      path: '/admin/support-consents',
      icon: ShieldCheck,
      permission: 'admin', // Only tenant admins
    },
    {
      name: 'Audit-Logs',
      path: '/admin/audit-logs',
      icon: Eye,
      permission: null, // Always visible - Tenants can see their logs
    },
    {
      name: 'Tenants',
      path: '/admin/tenants',
      icon: Building2,
      permission: 'superadmin', // Only for superadmin
    },
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-0 left-0 z-50 h-16 w-16 flex items-center justify-center bg-white border-r border-b border-gray-200"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {mobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-40 transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo Section */}
        <div className="h-16 border-b border-gray-200 flex items-center px-6 flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900">Monshy</h1>
        </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-3">
          {navigationItems
            .filter(item => {
              if (item.permission === 'superadmin') {
                return isSuperAdmin;
              }
              if (item.permission === 'admin') {
                // Tenant-Admin-only: Superadmin should NOT see this menu item (System Console vs Tenant Console)
                return isTenantAdmin;
              }
              return true;
            })
            .map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.email || 'User'}
            </p>
            {user?.roles && user.roles.length > 0 && (
              <p className="text-xs text-gray-500 truncate">
                {user.roles.join(', ')}
              </p>
            )}
            {user?.tenantName && (
              <p className="text-xs text-blue-600 truncate mt-1 font-medium">
                🏢 {user.tenantName}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
      </div>
    </>
  );
}

