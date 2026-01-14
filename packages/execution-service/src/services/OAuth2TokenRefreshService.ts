/**
 * OAuth2 Token Refresh Service
 * 
 * Handles automatic OAuth2 token refresh when access tokens expire
 */

import axios from 'axios';
import { logger } from '@monshy/core';

interface OAuth2Config {
  apiId: string;
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
  scope?: string;
  refreshTokenSecretKey: string;
  accessTokenSecretKey: string;
}

interface TokenRefreshResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export class OAuth2TokenRefreshService {
  /**
   * Check if error indicates token expiration
   */
  static isTokenExpiredError(error: any): boolean {
    if (!error) return false;
    
    // Check HTTP status
    if (error.response?.status === 401) {
      return true;
    }
    
    // Check error message for common OAuth2 error codes
    const errorBody = error.response?.data;
    if (errorBody) {
      const errorCode = errorBody.error || errorBody.error_code;
      const errorMessage = (errorBody.error_description || errorBody.message || '').toLowerCase();
      
      // Common OAuth2 error codes
      if (errorCode === 'invalid_token' || 
          errorCode === 'expired_token' ||
          errorCode === 'token_expired' ||
          errorMessage.includes('expired') ||
          errorMessage.includes('invalid token') ||
          errorMessage.includes('unauthorized')) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Refresh OAuth2 access token
   */
  static async refreshToken(
    config: OAuth2Config,
    refreshToken: string,
    secretsService: any,
    tenantId: string
  ): Promise<TokenRefreshResult> {
    try {
      logger.info({ apiId: config.apiId, tenantId }, 'Refreshing OAuth2 access token');

      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: config.clientId,
        ...(config.clientSecret && { client_secret: config.clientSecret }),
        ...(config.scope && { scope: config.scope })
      });

      const response = await axios.post(config.tokenUrl, body.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });

      const tokenData = response.data;

      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error || 'Token refresh failed');
      }

      // Update secrets with new tokens (if secretsService is available)
      if (secretsService && tokenData.access_token) {
        await this.updateSecret(
          secretsService,
          tenantId,
          config.accessTokenSecretKey,
          tokenData.access_token
        );
      }

      if (secretsService && tokenData.refresh_token && config.refreshTokenSecretKey) {
        await this.updateSecret(
          secretsService,
          tenantId,
          config.refreshTokenSecretKey,
          tokenData.refresh_token
        );
      }

      logger.info({ apiId: config.apiId, tenantId }, 'OAuth2 token refreshed successfully');

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in
      };
    } catch (error: any) {
      logger.error({ 
        apiId: config.apiId, 
        tenantId, 
        error: error.message 
      }, 'Failed to refresh OAuth2 token');
      throw error;
    }
  }

  /**
   * Update secret value
   */
  private static async updateSecret(
    secretsService: any,
    tenantId: string,
    secretKey: string,
    value: string
  ): Promise<void> {
    try {
      // Get all secrets for tenant
      const secrets = await secretsService.getByTenantId(tenantId);
      const existing = secrets.find((s: any) => s.name === secretKey);

      if (existing) {
        // Update existing secret
        await secretsService.update(existing.id, tenantId, {
          value,
          isActive: true
        });
      } else {
        logger.warn({ tenantId, secretKey }, 'Secret not found for token refresh update');
      }
    } catch (error: any) {
      logger.error({ tenantId, secretKey, error: error.message }, 'Failed to update secret after token refresh');
      // Don't throw - token refresh succeeded, secret update is secondary
    }
  }

  /**
   * Get OAuth2 config from API integration and secrets
   */
  static async getOAuth2Config(
    apiId: string,
    secrets: Record<string, string>,
    apiIntegrations: Record<string, any>
  ): Promise<OAuth2Config | null> {
    const apiIntegration = apiIntegrations[apiId];
    
    if (!apiIntegration || 
        !apiIntegration.authentication || 
        apiIntegration.authentication.type !== 'oauth2') {
      return null;
    }

    const auth = apiIntegration.authentication;
    
    if (!auth.tokenUrl || !auth.refreshTokenSecretKey) {
      return null;
    }

    const clientId = auth.clientIdSecretKey ? secrets[auth.clientIdSecretKey] : null;
    const clientSecret = auth.clientSecretSecretKey ? secrets[auth.clientSecretSecretKey] : undefined;
    const refreshToken = secrets[auth.refreshTokenSecretKey];

    if (!clientId || !refreshToken) {
      return null;
    }

    return {
      apiId,
      tokenUrl: auth.tokenUrl,
      clientId,
      clientSecret,
      scope: auth.scope,
      refreshTokenSecretKey: auth.refreshTokenSecretKey,
      accessTokenSecretKey: auth.secretKey
    };
  }
}

