/**
 * OAuth2 Callback Page
 * 
 * Handles OAuth2 callback from OAuth providers
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { handleOAuth2Callback, saveOAuth2Tokens } from '../services/oauth2Service';
import { getApiIntegration } from '../config/apiIntegrations';

export function OAuth2CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get parameters from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const apiId = searchParams.get('api_id') || searchParams.get('apiId');
        const workflowId = searchParams.get('workflow_id') || searchParams.get('workflowId');
        const nodeId = searchParams.get('node_id') || searchParams.get('nodeId');

        // Check for errors from OAuth provider
        if (error) {
          setStatus('error');
          setMessage(errorDescription || error || 'OAuth2 authorization failed');
          return;
        }

        if (!code || !state) {
          setStatus('error');
          setMessage('Missing authorization code or state parameter');
          return;
        }

        if (!apiId) {
          setStatus('error');
          setMessage('Missing API ID parameter');
          return;
        }

        // Get API integration to find secret key
        const apiIntegration = getApiIntegration(apiId);
        if (!apiIntegration || !apiIntegration.authentication) {
          setStatus('error');
          setMessage(`API integration ${apiId} not found or does not support OAuth2`);
          return;
        }

        const auth = apiIntegration.authentication;
        if (auth.type !== 'oauth2') {
          setStatus('error');
          setMessage(`API ${apiId} does not support OAuth2 authentication`);
          return;
        }

        // Handle callback and exchange code for token
        const result = await handleOAuth2Callback({
          code,
          state,
          apiId,
          secretKey: auth.secretKey,
          error: error || undefined,
          error_description: errorDescription ?? undefined
        });

        // Save tokens to secrets
        await saveOAuth2Tokens(
          auth.secretKey,
          result.accessToken,
          result.refreshToken
        );

        setStatus('success');
        setMessage('OAuth2 authentication successful! Redirecting...');

        // Redirect back to workflow editor
        if (workflowId && nodeId) {
          // Redirect to workflow editor with node selected
          setTimeout(() => {
            navigate(`/workflow/${workflowId}?nodeId=${nodeId}`);
          }, 2000);
        } else if (workflowId) {
          // Redirect to workflow editor
          setTimeout(() => {
            navigate(`/workflow/${workflowId}`);
          }, 2000);
        } else {
          // Redirect to home
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Failed to complete OAuth2 authentication');
        console.error('OAuth2 callback error:', err);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="mb-4">
                <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Completing Authentication...</h2>
              <p className="text-gray-600">Please wait while we complete your OAuth2 authentication.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-4">
                <svg className="h-12 w-12 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Successful!</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-4">
                <svg className="h-12 w-12 text-red-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Failed</h2>
              <p className="text-red-600 mb-4">{message}</p>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Go to Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

