/**
 * TypeScript types for API Integrations from registry.json
 */

export interface ApiAuthentication {
  type: 'apiKey' | 'oauth2' | 'basic' | 'aws' | 'bearer';
  headerName?: string;
  headerFormat?: string; // e.g., "Bearer {apiKey}" or "Basic {base64(email:apiToken)}"
  secretKey: string; // Name of the secret in workflow secrets (for OAuth2: access token)
  emailSecretKey?: string; // For basic auth, if email is separate
  usernameSecretKey?: string; // For basic auth, if username is separate
  accessKeyIdSecretKey?: string; // For AWS, the access key ID secret name
  regionSecretKey?: string; // For AWS, the region secret name
  // URL Placeholder (e.g., Telegram: /bot{token}/)
  urlPlaceholder?: string; // Placeholder in URL path (e.g., "{token}")
  location?: 'query' | 'header'; // Authentication location
  parameterName?: string; // Query parameter name (if location is 'query')
  queryParamName?: string; // Legacy: query parameter name
  userParamName?: string; // Query parameter name for user key (multi-secret)
  // OAuth2 specific fields
  authorizationUrl?: string; // OAuth2 authorization endpoint
  tokenUrl?: string; // OAuth2 token endpoint
  clientIdSecretKey?: string; // OAuth2 client ID secret name
  clientSecretSecretKey?: string; // OAuth2 client secret secret name
  scope?: string; // OAuth2 scopes (space-separated)
  redirectUri?: string; // OAuth2 redirect URI
  refreshTokenSecretKey?: string; // OAuth2 refresh token secret name (optional)
  note?: string; // Additional notes about authentication
}

export interface ApiEndpoint {
  id: string;
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, any>;
  bodySchema?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
  urlTemplate: string; // Full URL template with placeholders like {searchTerm}
}

export interface ApiIntegrationColor {
  bg: string; // Background gradient (e.g., 'from-teal-100 to-cyan-100')
  border: string; // Border color (e.g., 'border-teal-500')
  icon: string; // Icon color (e.g., 'text-teal-700')
  handle: string; // Handle color (e.g., 'bg-teal-600')
}

export interface ApiIntegration {
  id: string;
  name: string;
  icon: string; // Emoji fallback
  logoUrl?: string; // URL to real provider logo (e.g., from simple-icons CDN)
  description: string;
  baseUrl: string;
  authentication: ApiAuthentication;
  color?: ApiIntegrationColor; // Optional custom color for nodes created from this API
  endpoints: ApiEndpoint[];
}

export interface ApiIntegrationsRegistry {
  apiIntegrations: ApiIntegration[];
}

