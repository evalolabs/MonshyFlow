import { useCallback, useEffect, useState } from 'react';
import type { SecretResponse } from '../../../services/secretsService';
import { secretsService } from '../../../services/secretsService';

interface UseSecretsResult {
  secrets: SecretResponse[];
  secretsLoading: boolean;
  reloadSecrets: () => Promise<void>;
}

/**
 * Load secrets once and expose a reload helper.
 * Filters out inactive secrets just like the previous inline effect.
 */
export function useSecrets(): UseSecretsResult {
  const [secrets, setSecrets] = useState<SecretResponse[]>([]);
  const [secretsLoading, setSecretsLoading] = useState(false);

  const loadSecrets = useCallback(async () => {
    setSecretsLoading(true);
    try {
      const allSecrets = await secretsService.getAllSecrets();
      setSecrets(allSecrets.filter((secret: SecretResponse) => secret.isActive));
    } catch (error) {
      console.error('Failed to load secrets:', error);
      setSecrets([]);
    } finally {
      setSecretsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSecrets();
  }, [loadSecrets]);

  return {
    secrets,
    secretsLoading,
    reloadSecrets: loadSecrets,
  };
}


