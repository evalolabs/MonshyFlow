/**
 * API Authentication Configuration Component
 * 
 * Displays and manages authentication configuration for API-integrated HTTP Request nodes
 */

import { useEffect, useState } from 'react';
import type { ApiIntegration } from '../../../types/apiIntegrations';
import type { SecretResponse } from '../../../services/secretsService';
import { renderField } from '../helpers/renderField';
import type { Node, Edge } from '@xyflow/react';
import { startOAuth2Flow } from '../../../services/oauth2Service';

interface ApiAuthConfigProps {
  apiIntegration: ApiIntegration;
  config: any;
  setConfig: (config: any) => void;
  secrets: SecretResponse[];
  secretsLoading: boolean;
  reloadSecrets?: () => Promise<void>;
  nodes: Node[];
  edges: Edge[];
  currentNodeId: string;
  workflowId?: string;
  debugSteps?: any[];
}

export function ApiAuthConfig({
  apiIntegration,
  config,
  setConfig,
  secrets,
  secretsLoading,
  reloadSecrets,
  nodes,
  edges,
  currentNodeId,
  workflowId,
  debugSteps = [],
}: ApiAuthConfigProps) {
  const auth = apiIntegration.authentication;

  // Helper to get secret value from config
  const getSecretValue = (secretKey: string): string => {
    // Try different possible config keys
    return config[`auth_${secretKey}`] || 
           config[secretKey] || 
           '';
  };

  // Helper to set secret value in config
  const setSecretValue = (secretKey: string, value: string) => {
    setConfig({ ...config, [`auth_${secretKey}`]: value });
  };

  // Get current secret values for header generation
  const currentSecretValue = getSecretValue(auth.secretKey);
  const currentUsernameValue = auth.usernameSecretKey ? getSecretValue(auth.usernameSecretKey) : null;
  const currentEmailValue = auth.emailSecretKey ? getSecretValue(auth.emailSecretKey) : null;

  // Auto-generate headers and update URL from selected secrets
  useEffect(() => {
    if (!auth) return;

    try {
      const headers: Record<string, string> = {};
      
      // Parse existing headers if present
      if (config.headers) {
        if (typeof config.headers === 'string') {
          try {
            const parsed = JSON.parse(config.headers);
            if (parsed && typeof parsed === 'object') {
              Object.assign(headers, parsed);
            }
          } catch (e) {
            // Invalid JSON, start fresh
          }
        } else if (typeof config.headers === 'object') {
          Object.assign(headers, config.headers);
        }
      }

      // Check if authentication is in URL (e.g., Telegram: /bot{token}/)
      const useUrlAuth = (auth as any).urlPlaceholder !== undefined;
      
      // Determine if auth is via query parameter
      const useQueryAuth = (auth as any).location === 'query' || (auth as any).queryParamName;
      
      // Update URL if token is in URL path (e.g., Telegram)
      if (useUrlAuth && currentSecretValue && config.url) {
        const placeholder = (auth as any).urlPlaceholder;
        const placeholderPattern = placeholder.startsWith('{') && placeholder.endsWith('}') 
          ? placeholder 
          : `{${placeholder}}`;
        
        // Replace URL placeholder with secret reference
        let updatedUrl = config.url;
        const regex = new RegExp(placeholderPattern.replace(/[{}]/g, '\\$&'), 'g');
        const secretRef = `{{secrets.${currentSecretValue}}}`;
        
        // Only update if URL contains the placeholder and it's not already replaced
        if (regex.test(updatedUrl) && !updatedUrl.includes(secretRef)) {
          updatedUrl = updatedUrl.replace(regex, secretRef);
          setConfig((prevConfig: any) => ({ ...prevConfig, url: updatedUrl }));
        }
      }
      
      // Only add header if NOT using URL auth
      if (!useUrlAuth && !useQueryAuth && currentSecretValue) {
        // Header authentication
        // Build header value based on format
        let headerValue = `{{secrets.${currentSecretValue}}}`;
        
        if (auth.headerFormat) {
          // Replace placeholders in headerFormat
          headerValue = auth.headerFormat
            .replace('{apiKey}', `{{secrets.${currentSecretValue}}}`)
            .replace('{accessToken}', `{{secrets.${currentSecretValue}}}`)
            .replace('{base64(email:apiToken)}', `{{secrets.${currentSecretValue}}}`);
        }
        
        headers[auth.headerName || 'Authorization'] = headerValue;
      } else if (useUrlAuth) {
        // Remove Authorization header if using URL auth (Telegram doesn't need it)
        delete headers['Authorization'];
        delete headers[auth.headerName || 'Authorization'];
      }

      // Update headers in config (only if changed to avoid infinite loops)
      const newHeadersStr = JSON.stringify(headers, null, 2);
      const currentHeadersStr = typeof config.headers === 'string' 
        ? config.headers 
        : JSON.stringify(config.headers || {}, null, 2);
      
      // Only update if headers actually changed
      if (newHeadersStr !== currentHeadersStr && (newHeadersStr !== '{}' || currentHeadersStr !== '{}')) {
        setConfig((prevConfig: any) => ({ ...prevConfig, headers: newHeadersStr }));
      }
    } catch (error) {
      console.error('[ApiAuthConfig] Error generating headers/URL:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    auth?.secretKey,
    auth?.headerName,
    auth?.headerFormat,
    auth?.urlPlaceholder,
    currentSecretValue,
    currentUsernameValue,
    currentEmailValue,
  ]);

  // Determine secret type based on auth type
  const getSecretType = (): 'ApiKey' | 'Password' | 'Token' | 'Generic' => {
    switch (auth.type) {
      case 'apiKey':
        return 'ApiKey';
      case 'bearer':
        return 'Token';
      case 'basic':
        return 'Password';
      default:
        return 'Generic';
    }
  };

  return (
    <div className="border-t border-gray-200 pt-3 mt-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <span>🔐</span>
          <span>Authentication</span>
        </h3>
        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded font-medium">
          {apiIntegration.name}
        </span>
      </div>

      {/* Auth Type Badge */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
            Type: {auth.type.toUpperCase()}
          </span>
          {(auth as any).location === 'query' && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-800">
              Query Parameter
            </span>
          )}
        </div>
        {auth.note && (
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{auth.note}</p>
        )}
      </div>

      {/* Secret Selectors based on Auth Type */}
      <div className="space-y-3">
        {auth.type === 'apiKey' && (
          <div>
            {renderField({
              nodeType: 'http-request',
              fieldName: `auth_${auth.secretKey}`,
              label: 'API Key Secret',
              value: getSecretValue(auth.secretKey),
              onChange: (v) => setSecretValue(auth.secretKey, v),
              nodes,
              edges,
              currentNodeId,
              debugSteps,
              secretType: getSecretType(),
              secrets,
              secretsLoading,
              defaultSecretName: auth.secretKey,
              showAdvanced: true,
              reloadSecrets,
            })}
          </div>
        )}

        {auth.type === 'bearer' && (
          <div>
            {renderField({
              nodeType: 'http-request',
              fieldName: `auth_${auth.secretKey}`,
              label: 'Bearer Token Secret',
              value: getSecretValue(auth.secretKey),
              onChange: (v) => setSecretValue(auth.secretKey, v),
              nodes,
              edges,
              currentNodeId,
              debugSteps,
              secretType: 'Token',
              secrets,
              secretsLoading,
              defaultSecretName: auth.secretKey,
              showAdvanced: true,
              reloadSecrets,
            })}
          </div>
        )}

        {auth.type === 'basic' && (
          <>
            {auth.usernameSecretKey && (
              <div>
                {renderField({
                  nodeType: 'http-request',
                  fieldName: `auth_${auth.usernameSecretKey}`,
                  label: 'Username Secret',
                  value: getSecretValue(auth.usernameSecretKey),
                  onChange: (v) => setSecretValue(auth.usernameSecretKey!, v),
                  nodes,
                  edges,
                  currentNodeId,
                  debugSteps,
                  secretType: 'Password',
                  secrets,
                  secretsLoading,
                  defaultSecretName: auth.usernameSecretKey,
                  showAdvanced: true,
                  reloadSecrets,
                })}
              </div>
            )}
            {auth.emailSecretKey && (
              <div>
                {renderField({
                  nodeType: 'http-request',
                  fieldName: `auth_${auth.emailSecretKey}`,
                  label: 'Email Secret',
                  value: getSecretValue(auth.emailSecretKey),
                  onChange: (v) => setSecretValue(auth.emailSecretKey!, v),
                  nodes,
                  edges,
                  currentNodeId,
                  debugSteps,
                  secretType: 'Password',
                  secrets,
                  secretsLoading,
                  defaultSecretName: auth.emailSecretKey,
                  showAdvanced: true,
                  reloadSecrets,
                })}
              </div>
            )}
            <div>
              {renderField({
                nodeType: 'http-request',
                fieldName: `auth_${auth.secretKey}`,
                label: auth.usernameSecretKey || auth.emailSecretKey ? 'Password Secret' : 'API Secret',
                value: getSecretValue(auth.secretKey),
                onChange: (v) => setSecretValue(auth.secretKey, v),
                nodes,
                edges,
                currentNodeId,
                debugSteps,
                secretType: 'Password',
                secrets,
                secretsLoading,
                defaultSecretName: auth.secretKey,
                showAdvanced: true,
                reloadSecrets,
              })}
            </div>
          </>
        )}

        {auth.type === 'aws' && (
          <>
            {auth.accessKeyIdSecretKey && (
              <div>
                {renderField({
                  nodeType: 'http-request',
                  fieldName: `auth_${auth.accessKeyIdSecretKey}`,
                  label: 'AWS Access Key ID Secret',
                  value: getSecretValue(auth.accessKeyIdSecretKey),
                  onChange: (v) => setSecretValue(auth.accessKeyIdSecretKey!, v),
                  nodes,
                  edges,
                  currentNodeId,
                  debugSteps,
                  secretType: 'ApiKey',
                  secrets,
                  secretsLoading,
                  defaultSecretName: auth.accessKeyIdSecretKey,
                  showAdvanced: true,
                  reloadSecrets,
                })}
              </div>
            )}
            <div>
              {renderField({
                nodeType: 'http-request',
                fieldName: `auth_${auth.secretKey}`,
                label: 'AWS Secret Access Key',
                value: getSecretValue(auth.secretKey),
                onChange: (v) => setSecretValue(auth.secretKey, v),
                nodes,
                edges,
                currentNodeId,
                debugSteps,
                secretType: 'ApiKey',
                secrets,
                secretsLoading,
                defaultSecretName: auth.secretKey,
                showAdvanced: true,
                reloadSecrets,
              })}
            </div>
            {auth.regionSecretKey && (
              <div>
                {renderField({
                  nodeType: 'http-request',
                  fieldName: `auth_${auth.regionSecretKey}`,
                  label: 'AWS Region Secret',
                  value: getSecretValue(auth.regionSecretKey),
                  onChange: (v) => setSecretValue(auth.regionSecretKey!, v),
                  nodes,
                  edges,
                  currentNodeId,
                  debugSteps,
                  secretType: 'Generic',
                  secrets,
                  secretsLoading,
                  defaultSecretName: auth.regionSecretKey,
                  showAdvanced: true,
                  reloadSecrets,
                })}
              </div>
            )}
          </>
        )}

        {auth.type === 'oauth2' && (
          <div className="space-y-3">
            {/* OAuth2 Info */}
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-xs text-blue-800 mb-2">
                <strong>OAuth2 Authentication:</strong> This API requires OAuth2 authentication. 
                You'll need to connect your account to authorize access.
              </p>
              {!auth.authorizationUrl && (
                <p className="text-xs text-amber-700 mt-2">
                  ⚠️ OAuth2 configuration incomplete. Missing authorization URL.
                </p>
              )}
            </div>

            {/* Client ID and Secret (if required) */}
            {auth.clientIdSecretKey && (
              <div>
                {renderField({
                  nodeType: 'http-request',
                  fieldName: `auth_${auth.clientIdSecretKey}`,
                  label: 'OAuth2 Client ID Secret',
                  value: getSecretValue(auth.clientIdSecretKey),
                  onChange: (v) => setSecretValue(auth.clientIdSecretKey!, v),
                  nodes,
                  edges,
                  currentNodeId,
                  debugSteps,
                  secretType: 'ApiKey',
                  secrets,
                  secretsLoading,
                  defaultSecretName: auth.clientIdSecretKey,
                  showAdvanced: true,
                  reloadSecrets,
                })}
              </div>
            )}
            {auth.clientSecretSecretKey && (
              <div>
                {renderField({
                  nodeType: 'http-request',
                  fieldName: `auth_${auth.clientSecretSecretKey}`,
                  label: 'OAuth2 Client Secret',
                  value: getSecretValue(auth.clientSecretSecretKey),
                  onChange: (v) => setSecretValue(auth.clientSecretSecretKey!, v),
                  nodes,
                  edges,
                  currentNodeId,
                  debugSteps,
                  secretType: 'Password',
                  secrets,
                  secretsLoading,
                  defaultSecretName: auth.clientSecretSecretKey,
                  showAdvanced: true,
                  reloadSecrets,
                })}
              </div>
            )}

            {/* Access Token (read-only, set via OAuth flow) */}
            <div>
              {renderField({
                nodeType: 'http-request',
                fieldName: `auth_${auth.secretKey}`,
                label: 'OAuth2 Access Token',
                value: getSecretValue(auth.secretKey),
                onChange: (v) => setSecretValue(auth.secretKey, v),
                nodes,
                edges,
                currentNodeId,
                debugSteps,
                secretType: 'Token',
                secrets,
                secretsLoading,
                defaultSecretName: auth.secretKey,
                showAdvanced: true,
                reloadSecrets,
              })}
            </div>

            {/* OAuth2 Connect Button */}
            {auth.authorizationUrl && (
              <OAuth2ConnectButton
                apiIntegration={apiIntegration}
                clientId={auth.clientIdSecretKey ? getSecretValue(auth.clientIdSecretKey) : ''}
                clientSecret={auth.clientSecretSecretKey ? getSecretValue(auth.clientSecretSecretKey) : undefined}
                workflowId={workflowId}
                nodeId={currentNodeId}
                onTokenReceived={async (accessToken: string) => {
                  // Update config with access token secret
                  setSecretValue(auth.secretKey, accessToken);
                  // Reload secrets to show new token
                  if (reloadSecrets) {
                    await reloadSecrets();
                  }
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Auth Info Display */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
        <div className="font-medium text-gray-700 mb-2 text-xs">Authentication Details:</div>
        <div className="space-y-1 text-xs text-gray-600">
          {(auth as any).location === 'query' ? (
            <div className="flex items-start gap-2">
              <span className="text-gray-400">•</span>
              <div>
                <span>Auth via Query Parameter: </span>
                <code className="bg-white px-1.5 py-0.5 rounded border border-gray-300 font-mono text-[11px]">
                  {(auth as any).parameterName || (auth as any).queryParamName || 'api_token'}
                </code>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <span className="text-gray-400">•</span>
              <div>
                <span>Auth via Header: </span>
                <code className="bg-white px-1.5 py-0.5 rounded border border-gray-300 font-mono text-[11px]">
                  {auth.headerName || 'Authorization'}
                </code>
              </div>
            </div>
          )}
          {auth.headerFormat && (
            <div className="flex items-start gap-2">
              <span className="text-gray-400">•</span>
              <div>
                <span>Format: </span>
                <code className="bg-white px-1.5 py-0.5 rounded border border-gray-300 font-mono text-[11px]">
                  {auth.headerFormat}
                </code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * OAuth2 Connect Button Component
 */
interface OAuth2ConnectButtonProps {
  apiIntegration: ApiIntegration;
  clientId: string;
  clientSecret?: string;
  workflowId?: string;
  nodeId: string;
  onTokenReceived?: (accessToken: string, refreshToken?: string) => Promise<void>;
}

function OAuth2ConnectButton({
  apiIntegration,
  clientId,
  clientSecret,
  workflowId,
  nodeId,
  onTokenReceived: _onTokenReceived,
}: OAuth2ConnectButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!clientId) {
      setError('Client ID is required. Please configure the OAuth2 Client ID secret first.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await startOAuth2Flow({
        apiIntegration,
        clientId,
        clientSecret,
        workflowId,
        nodeId,
      });
      // Redirect will happen, so we won't reach here
    } catch (err: any) {
      setError(err.message || 'Failed to start OAuth2 flow');
      setIsConnecting(false);
    }
  };

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={handleConnect}
        disabled={isConnecting || !clientId}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2"
      >
        {isConnecting ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <span>🔗</span>
            <span>Connect with {apiIntegration.name}</span>
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-2 text-center">{error}</p>
      )}
      {!error && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Click to authorize and get access token
        </p>
      )}
    </div>
  );
}

