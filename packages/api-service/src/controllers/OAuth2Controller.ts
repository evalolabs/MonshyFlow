/**
 * OAuth2 Controller
 * 
 * Handles OAuth2 token exchange for API integrations
 */

import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import { logger } from '@monshy/core';
import axios from 'axios';
import { config } from '../config';

@injectable()
export class OAuth2Controller {
  private getSecretsServiceUrl(): string {
    return config.services.secrets.url;
  }

  private async getAuthHeaders(req: Request): Promise<Record<string, string>> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Exchange OAuth2 authorization code for access token
   * POST /api/oauth2/token
   */
  async exchangeToken(req: Request, res: Response): Promise<void> {
    try {
      const { apiId, code, state, codeVerifier, redirectUri } = req.body;
      const user = (req as any).user;

      if (!user || !user.tenantId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized: Invalid or missing authentication'
        });
        return;
      }

      if (!apiId || !code || !state) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameters: apiId, code, state'
        });
        return;
      }

      // Load API integration config
      // TODO: Load from shared/apiIntegrations/{apiId}.json
      // For now, we'll need to pass the config from frontend or load it here
      const apiConfig = await this.loadApiIntegration(apiId);
      
      if (!apiConfig || !apiConfig.authentication || apiConfig.authentication.type !== 'oauth2') {
        res.status(400).json({
          success: false,
          error: `API ${apiId} does not support OAuth2 authentication`
        });
        return;
      }

      const auth = apiConfig.authentication;
      
      if (!auth.tokenUrl) {
        res.status(400).json({
          success: false,
          error: 'OAuth2 token URL not configured'
        });
        return;
      }

      // Get client credentials from secrets
      const headers = await this.getAuthHeaders(req);
      const clientId = auth.clientIdSecretKey 
        ? await this.getSecretValueByName(user.tenantId, auth.clientIdSecretKey, headers)
        : null;
      
      const clientSecret = auth.clientSecretSecretKey
        ? await this.getSecretValueByName(user.tenantId, auth.clientSecretSecretKey, headers)
        : null;

      if (!clientId) {
        res.status(400).json({
          success: false,
          error: 'OAuth2 Client ID not configured. Please set up the client ID secret first.'
        });
        return;
      }

      // Exchange code for token
      const tokenRequestBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri || auth.redirectUri || `${req.protocol}://${req.get('host')}/oauth2/callback`,
        client_id: clientId,
        ...(clientSecret && { client_secret: clientSecret }),
        ...(codeVerifier && { code_verifier: codeVerifier })
      });

      const tokenResponse = await axios.post(auth.tokenUrl, tokenRequestBody.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });

      const tokenData = tokenResponse.data;

      if (tokenData.error) {
        logger.error({ apiId, error: tokenData.error, error_description: tokenData.error_description }, 'OAuth2 token exchange failed');
        res.status(400).json({
          success: false,
          error: tokenData.error_description || tokenData.error || 'Token exchange failed'
        });
        return;
      }

      // Save access token to secrets
      if (tokenData.access_token) {
        await this.saveTokenSecret(
          user.tenantId,
          auth.secretKey,
          tokenData.access_token,
          'OAuth2 Access Token',
          headers
        );
      }

      // Save refresh token if provided
      if (tokenData.refresh_token && auth.refreshTokenSecretKey) {
        await this.saveTokenSecret(
          user.tenantId,
          auth.refreshTokenSecretKey,
          tokenData.refresh_token,
          'OAuth2 Refresh Token',
          headers
        );
      }

      logger.info({ apiId, tenantId: user.tenantId }, 'OAuth2 token exchange successful');

      res.json({
        success: true,
        data: {
          access_token: tokenData.access_token,
          token_type: tokenData.token_type || 'Bearer',
          expires_in: tokenData.expires_in,
          refresh_token: tokenData.refresh_token,
          scope: tokenData.scope
        }
      });
    } catch (error: any) {
      logger.error({ error: error.message, stack: error.stack }, 'OAuth2 token exchange error');
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error during token exchange'
      });
    }
  }

  /**
   * Load API integration configuration
   */
  private async loadApiIntegration(apiId: string): Promise<any> {
    try {
      // Load from shared/apiIntegrations/{apiId}.json
      const fs = require('fs');
      const path = require('path');
      const apiPath = path.join(__dirname, '../../../../shared/apiIntegrations', `${apiId}.json`);
      
      if (fs.existsSync(apiPath)) {
        const content = fs.readFileSync(apiPath, 'utf-8');
        return JSON.parse(content);
      }
      
      return null;
    } catch (error) {
      logger.error({ apiId, error }, 'Failed to load API integration config');
      return null;
    }
  }

  /**
   * Get secret value by name from secrets service
   */
  private async getSecretValueByName(
    tenantId: string,
    secretKey: string,
    headers: Record<string, string>
  ): Promise<string | null> {
    try {
      // Get all secrets for tenant
      const response = await axios.get(`${this.getSecretsServiceUrl()}/api/secrets`, { headers });
      const secrets = response.data.success ? response.data.data : response.data;
      
      if (!Array.isArray(secrets)) {
        return null;
      }

      const secret = secrets.find((s: any) => s.name === secretKey && s.isActive);
      
      if (!secret) {
        return null;
      }

      // Get decrypted value
      const decryptResponse = await axios.get(
        `${this.getSecretsServiceUrl()}/api/secrets/${secret.id}/decrypt`,
        { headers }
      );
      const decrypted = decryptResponse.data.success ? decryptResponse.data.data : decryptResponse.data;
      
      return decrypted?.value || null;
    } catch (error: any) {
      logger.error({ tenantId, secretKey, error: error.message }, 'Failed to get secret value');
      return null;
    }
  }

  /**
   * Save token secret
   */
  private async saveTokenSecret(
    tenantId: string,
    secretKey: string,
    tokenValue: string,
    description: string,
    headers: Record<string, string>
  ): Promise<void> {
    try {
      // Get all secrets to check if exists
      const response = await axios.get(`${this.getSecretsServiceUrl()}/api/secrets`, { headers });
      const secrets = response.data.success ? response.data.data : response.data;
      
      if (!Array.isArray(secrets)) {
        throw new Error('Invalid secrets response');
      }

      const existing = secrets.find((s: any) => s.name === secretKey);

      if (existing) {
        // Update existing secret
        await axios.put(
          `${this.getSecretsServiceUrl()}/api/secrets/${existing.id}`,
          {
            value: tokenValue,
            isActive: true
          },
          { headers }
        );
      } else {
        // Create new secret
        await axios.post(
          `${this.getSecretsServiceUrl()}/api/secrets`,
          {
            name: secretKey,
            description,
            secretType: 2, // Token
            value: tokenValue,
            isActive: true
          },
          { headers }
        );
      }
    } catch (error: any) {
      logger.error({ tenantId, secretKey, error: error.message }, 'Failed to save token secret');
      throw error;
    }
  }
}

