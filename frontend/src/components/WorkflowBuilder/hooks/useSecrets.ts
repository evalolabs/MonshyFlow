import { useCallback, useEffect, useState } from 'react';
import type { SecretResponse } from '../../../services/secretsService';
import { secretsService } from '../../../services/secretsService';
import { useCurrentUserTenantId } from '../../../utils/permissions';

interface UseSecretsResult {
  secrets: SecretResponse[];
  secretsLoading: boolean;
  reloadSecrets: () => Promise<void>;
}

/**
 * Load secrets once and expose a reload helper.
 * Filters out inactive secrets and ensures only secrets from the current tenant are shown.
 * 
 * SECURITY NOTE: This frontend filter is a DEFENSE-IN-DEPTH layer only.
 * The backend ALREADY filters secrets by tenant via auth token (see SecretsController.ts):
 * - getAll() → getByTenantId(user.tenantId)
 * - getById() → checks secret.tenantId !== tenantId → NotFoundError
 * - All CRUD operations validate tenantId
 * 
 * This frontend filter provides:
 * 1. Additional safety in case of backend misconfiguration
 * 2. Clear UX (user only sees their tenant's secrets)
 * 3. Protection against potential token manipulation attacks
 */
export function useSecrets(): UseSecretsResult {
  const [secrets, setSecrets] = useState<SecretResponse[]>([]);
  const [secretsLoading, setSecretsLoading] = useState(false);
  const currentTenantId = useCurrentUserTenantId();

  const loadSecrets = useCallback(async () => {
    setSecretsLoading(true);
    try {
      const allSecrets = await secretsService.getAllSecrets();
      // Filter: only active secrets AND only from current tenant (DEFENSE-IN-DEPTH layer)
      // Backend already filters by tenant, but this adds extra safety + better UX
      const filtered = allSecrets.filter((secret: SecretResponse) => {
        const isActive = secret.isActive;
        const isFromCurrentTenant = !currentTenantId || secret.tenantId === currentTenantId;
        return isActive && isFromCurrentTenant;
      });
      setSecrets(filtered);
    } catch (error) {
      console.error('Failed to load secrets:', error);
      setSecrets([]);
    } finally {
      setSecretsLoading(false);
    }
  }, [currentTenantId]);

  useEffect(() => {
    void loadSecrets();
  }, [loadSecrets]);

  return {
    secrets,
    secretsLoading,
    reloadSecrets: loadSecrets,
  };
}


