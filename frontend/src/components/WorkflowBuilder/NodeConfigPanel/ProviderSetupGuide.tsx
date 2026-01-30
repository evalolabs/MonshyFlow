import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface ProviderSetupGuideProps {
  name: string;
  requiredSecrets?: string[];
  docsUrl?: string;
  apiKeyUrl?: string;
  setupInstructions?: string;
}

type SecretTypeQuery = 'ApiKey' | 'Password' | 'Token' | 'Generic' | 'Smtp';

function guessSecretTypeFromName(secretName: string): SecretTypeQuery {
  const s = (secretName || '').toUpperCase();
  if (s.includes('SMTP')) return 'Smtp';
  if (s.includes('PASSWORD') || s.endsWith('_PASS') || s.endsWith('_PWD')) return 'Password';
  if (s.includes('TOKEN')) return 'Token';
  if (s.includes('KEY')) return 'ApiKey';
  return 'ApiKey';
}

export const ProviderSetupGuide: React.FC<ProviderSetupGuideProps> = ({
  name,
  requiredSecrets = [],
  docsUrl,
  apiKeyUrl,
  setupInstructions,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const returnTo = useMemo(() => {
    // Keep user on the current page after creating the secret (workflow editor / config panel)
    return `${location.pathname}${location.search || ''}`;
  }, [location.pathname, location.search]);

  if (requiredSecrets.length === 0 && !docsUrl && !apiKeyUrl && !setupInstructions) {
    return null;
  }

  const goToSecrets = () => {
    navigate('/admin/secrets');
  };

  const createSecret = (secretName: string) => {
    const type = guessSecretTypeFromName(secretName);
    const params = new URLSearchParams({
      create: '1',
      name: secretName,
      type,
      provider: name,
      returnTo,
    });
    navigate(`/admin/secrets?${params.toString()}`);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-3">
      <div className="text-xs font-semibold text-blue-800 mb-2">
        🔑 Setup Guide for {name}
      </div>
      
      {requiredSecrets.length > 0 && (
        <div className="mb-2">
          <div className="text-[11px] font-medium text-blue-700 mb-1">
            Required Secrets:
          </div>
          <ul className="text-[11px] text-blue-600 space-y-1 list-disc list-inside ml-1">
            {requiredSecrets.map((secretName) => (
              <li key={secretName} className="flex items-center gap-2">
                <span className="font-mono">{secretName}</span>
                <span className="text-blue-300">·</span>
                <button
                  type="button"
                  onClick={() => createSecret(secretName)}
                  className="text-blue-700 hover:text-blue-900 underline underline-offset-2 text-[10px]"
                  title={`Create Secret "${secretName}"`}
                >
                  create
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {apiKeyUrl && (
        <div className="mb-2">
          <div className="text-[11px] font-medium text-blue-700 mb-1">
            Get API Key:
          </div>
          <a
            href={apiKeyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
          >
            {apiKeyUrl}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {setupInstructions && (
        <div className="mb-2">
          <div className="text-[11px] font-medium text-blue-700 mb-1">
            Instructions:
          </div>
          <p className="text-[11px] text-blue-600 whitespace-pre-wrap">
            {setupInstructions}
          </p>
        </div>
      )}

      {docsUrl && (
        <div>
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
          >
            📚 Open full documentation
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {requiredSecrets.length > 0 && (
        <div className="mt-2 pt-2 border-t border-blue-200">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-blue-600">
              💡 <strong>Tip:</strong> Create the secrets in the "Secrets" section for {name} to work.
            </p>
            <button
              type="button"
              onClick={goToSecrets}
              className="text-blue-700 hover:text-blue-900 underline underline-offset-2 text-[10px] whitespace-nowrap"
              title="Go to Secrets page"
            >
              Open Secrets
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

