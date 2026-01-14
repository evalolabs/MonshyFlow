/**
 * OAuth2 Utilities
 * 
 * Provides utilities for OAuth2 authentication flow including PKCE
 */

/**
 * Generate a random string for OAuth2 state and code verifier
 */
export function generateRandomString(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
}

/**
 * Generate code verifier for PKCE (RFC 7636)
 */
export function generateCodeVerifier(): string {
  return generateRandomString(128);
}

/**
 * Generate code challenge from code verifier (SHA256 + Base64URL)
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to Base64URL
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Build OAuth2 authorization URL
 */
export interface OAuth2Config {
  authorizationUrl: string;
  clientId: string;
  redirectUri: string;
  scope?: string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
  responseType?: string;
  additionalParams?: Record<string, string>;
}

export function buildAuthorizationUrl(config: OAuth2Config): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: config.responseType || 'code',
    ...(config.scope && { scope: config.scope }),
    ...(config.state && { state: config.state }),
    ...(config.codeChallenge && { 
      code_challenge: config.codeChallenge,
      code_challenge_method: config.codeChallengeMethod || 'S256'
    }),
    ...(config.additionalParams || {})
  });

  const separator = config.authorizationUrl.includes('?') ? '&' : '?';
  return `${config.authorizationUrl}${separator}${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export interface TokenExchangeRequest {
  tokenUrl: string;
  code: string;
  redirectUri: string;
  clientId: string;
  clientSecret?: string;
  codeVerifier?: string; // For PKCE
  grantType?: string;
  additionalParams?: Record<string, string>;
}

export interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

export async function exchangeCodeForToken(
  request: TokenExchangeRequest
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: request.grantType || 'authorization_code',
    code: request.code,
    redirect_uri: request.redirectUri,
    client_id: request.clientId,
    ...(request.clientSecret && { client_secret: request.clientSecret }),
    ...(request.codeVerifier && { code_verifier: request.codeVerifier }),
    ...(request.additionalParams || {})
  });

  const response = await fetch(request.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: body.toString()
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      error: 'unknown_error',
      error_description: `HTTP ${response.status}: ${response.statusText}`
    }));
    throw new Error(error.error_description || error.error || 'Token exchange failed');
  }

  return await response.json();
}

/**
 * Refresh access token using refresh token
 */
export interface RefreshTokenRequest {
  tokenUrl: string;
  refreshToken: string;
  clientId: string;
  clientSecret?: string;
  scope?: string;
}

export async function refreshAccessToken(
  request: RefreshTokenRequest
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: request.refreshToken,
    client_id: request.clientId,
    ...(request.clientSecret && { client_secret: request.clientSecret }),
    ...(request.scope && { scope: request.scope })
  });

  const response = await fetch(request.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: body.toString()
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      error: 'unknown_error',
      error_description: `HTTP ${response.status}: ${response.statusText}`
    }));
    throw new Error(error.error_description || error.error || 'Token refresh failed');
  }

  return await response.json();
}

/**
 * Store OAuth2 state and code verifier in sessionStorage
 */
export function storeOAuth2State(
  state: string,
  codeVerifier: string,
  apiId: string,
  secretKey: string
): void {
  const key = `oauth2_${apiId}_${secretKey}`;
  sessionStorage.setItem(key, JSON.stringify({
    state,
    codeVerifier,
    timestamp: Date.now()
  }));
}

/**
 * Retrieve OAuth2 state and code verifier from sessionStorage
 */
export function retrieveOAuth2State(
  apiId: string,
  secretKey: string
): { state: string; codeVerifier: string } | null {
  const key = `oauth2_${apiId}_${secretKey}`;
  const stored = sessionStorage.getItem(key);
  if (!stored) return null;

  try {
    const data = JSON.parse(stored);
    // Clean up old entries (older than 1 hour)
    if (Date.now() - data.timestamp > 3600000) {
      sessionStorage.removeItem(key);
      return null;
    }
    return { state: data.state, codeVerifier: data.codeVerifier };
  } catch {
    return null;
  }
}

/**
 * Clear OAuth2 state from sessionStorage
 */
export function clearOAuth2State(apiId: string, secretKey: string): void {
  const key = `oauth2_${apiId}_${secretKey}`;
  sessionStorage.removeItem(key);
}

