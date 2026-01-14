/**
 * OAuth2 Service
 * 
 * Handles OAuth2 authentication flow for API integrations
 */

import { api } from './api';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthorizationUrl,
  refreshAccessToken,
  storeOAuth2State,
  retrieveOAuth2State,
  clearOAuth2State,
  generateRandomString,
  type TokenResponse
} from '../utils/oauth2';
import type { ApiIntegration } from '../types/apiIntegrations';
import { secretsService } from './secretsService';

export interface OAuth2FlowParams {
  apiIntegration: ApiIntegration;
  clientId: string;
  clientSecret?: string;
  redirectUri?: string;
  workflowId?: string;
  nodeId?: string;
}

export interface OAuth2CallbackParams {
  code: string;
  state: string;
  apiId: string;
  secretKey: string;
  error?: string;
  error_description?: string;
}

/**
 * Start OAuth2 authorization flow
 */
export async function startOAuth2Flow(params: OAuth2FlowParams): Promise<void> {
  const { apiIntegration, clientId, redirectUri, workflowId, nodeId } = params;
  const auth = apiIntegration.authentication;

  if (!auth || auth.type !== 'oauth2') {
    throw new Error('API does not support OAuth2 authentication');
  }

  if (!auth.authorizationUrl) {
    throw new Error('OAuth2 authorization URL not configured');
  }

  // Generate PKCE values
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString();

  // Store state and code verifier for later verification
  storeOAuth2State(state, codeVerifier, apiIntegration.id, auth.secretKey);

  // Build authorization URL
  const finalRedirectUri = redirectUri || 
    auth.redirectUri || 
    `${window.location.origin}/oauth2/callback`;

  const authUrl = buildAuthorizationUrl({
    authorizationUrl: auth.authorizationUrl,
    clientId,
    redirectUri: finalRedirectUri,
    scope: auth.scope,
    state,
    codeChallenge,
    codeChallengeMethod: 'S256',
    additionalParams: {
      ...(workflowId && { workflow_id: workflowId }),
      ...(nodeId && { node_id: nodeId })
    }
  });

  // Redirect to OAuth provider
  window.location.href = authUrl;
}

/**
 * Handle OAuth2 callback and exchange code for token
 */
export async function handleOAuth2Callback(
  params: OAuth2CallbackParams
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const { code, state, apiId, secretKey, error, error_description } = params;

  if (error) {
    throw new Error(error_description || error || 'OAuth2 authorization failed');
  }

  // Retrieve stored state and code verifier
  const stored = retrieveOAuth2State(apiId, secretKey);
  if (!stored) {
    throw new Error('OAuth2 state not found. Please try again.');
  }

  // Verify state
  if (stored.state !== state) {
    clearOAuth2State(apiId, secretKey);
    throw new Error('OAuth2 state mismatch. Security check failed.');
  }

  // Get API integration config
  // TODO: Load from API integrations registry
  // For now, we'll need to pass this from the callback handler
  
  // Exchange code for token
  // This will be done via backend endpoint for security (client secret)
  const response = await api.post('/api/oauth2/token', {
    apiId,
    code,
    state,
    codeVerifier: stored.codeVerifier,
    redirectUri: window.location.origin + window.location.pathname
  });

  // Clear stored state
  clearOAuth2State(apiId, secretKey);

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
    expiresIn: response.data.expires_in
  };
}

/**
 * Save OAuth2 tokens to secrets
 */
export async function saveOAuth2Tokens(
  secretKey: string,
  accessToken: string,
  refreshToken?: string
): Promise<void> {
  // Save access token
  try {
    await secretsService.createSecret({
      name: secretKey,
      description: `OAuth2 Access Token for ${secretKey}`,
      secretType: 2, // Token
      value: accessToken,
      isActive: true
    });
  } catch (error: any) {
    // If secret already exists, update it
    if (error.response?.status === 409) {
      const secrets = await secretsService.getAllSecrets();
      const existing = secrets.find((s: any) => s.name === secretKey);
      if (existing) {
        await secretsService.updateSecret(existing.id, {
          value: accessToken,
          isActive: true
        });
      }
    } else {
      throw error;
    }
  }

  // Save refresh token if provided
  if (refreshToken && secretKey.includes('ACCESS_TOKEN')) {
    const refreshTokenKey = secretKey.replace('ACCESS_TOKEN', 'REFRESH_TOKEN');
    try {
      await secretsService.createSecret({
        name: refreshTokenKey,
        description: `OAuth2 Refresh Token for ${refreshTokenKey}`,
        secretType: 2, // Token
        value: refreshToken,
        isActive: true
      });
    } catch (error: any) {
      if (error.response?.status === 409) {
        const secrets = await secretsService.getAllSecrets();
        const existing = secrets.find((s: any) => s.name === refreshTokenKey);
        if (existing) {
          await secretsService.updateSecret(existing.id, {
            value: refreshToken,
            isActive: true
          });
        }
      }
    }
  }
}

/**
 * Refresh OAuth2 access token
 */
export async function refreshOAuth2Token(
  apiIntegration: ApiIntegration,
  refreshToken: string,
  clientId: string,
  clientSecret?: string
): Promise<TokenResponse> {
  const auth = apiIntegration.authentication;
  if (!auth || auth.type !== 'oauth2' || !auth.tokenUrl) {
    throw new Error('OAuth2 token URL not configured');
  }

  return await refreshAccessToken({
    tokenUrl: auth.tokenUrl,
    refreshToken,
    clientId,
    clientSecret,
    scope: auth.scope
  });
}


