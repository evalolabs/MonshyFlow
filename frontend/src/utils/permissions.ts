import { useAuth } from '../contexts/AuthContext';

// Permission constants
export const Permissions = {
  WORKFLOW_READ: 'workflow.read',
  WORKFLOW_CREATE: 'workflow.create',
  WORKFLOW_UPDATE: 'workflow.update',
  WORKFLOW_DELETE: 'workflow.delete',
  WORKFLOW_EXECUTE: 'workflow.execute',
  WORKFLOW_PUBLISH: 'workflow.publish',

  TENANT_READ: 'tenant.read',
  TENANT_CREATE: 'tenant.create',
  TENANT_UPDATE: 'tenant.update',
  TENANT_DELETE: 'tenant.delete',

  USER_READ: 'user.read',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_ASSIGN_ROLE: 'user.assign-role',

  SECRET_READ: 'secret.read',
  SECRET_CREATE: 'secret.create',
  SECRET_UPDATE: 'secret.update',
  SECRET_DELETE: 'secret.delete',
  SECRET_DECRYPT: 'secret.decrypt',

  ROLE_READ: 'role.read',
  ROLE_CREATE: 'role.create',
  ROLE_UPDATE: 'role.update',
  ROLE_DELETE: 'role.delete',
  PERMISSION_READ: 'permission.read',
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];

export function useHasPermission(permission: Permission): boolean {
  const { user } = useAuth();
  if (!user || !user.permissions) {
    return false;
  }
  return user.permissions.includes(permission);
}

export function useHasAnyPermission(permissions: Permission[]): boolean {
  const { user } = useAuth();
  if (!user || !user.permissions) {
    return false;
  }
  return permissions.some(p => user.permissions!.includes(p));
}

export function useIsSuperAdmin(): boolean {
  const { user } = useAuth();
  return user?.roles?.includes('superadmin') ?? false;
}

export function useIsAdmin(): boolean {
  const { user } = useAuth();
  return user?.roles?.includes('admin') ?? false;
}

export function useCurrentUserTenantId(): string | undefined {
  const { user } = useAuth();
  return user?.tenantId;
}

