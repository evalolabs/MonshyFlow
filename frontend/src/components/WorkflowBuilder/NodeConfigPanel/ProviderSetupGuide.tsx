import React from 'react';

interface ProviderSetupGuideProps {
  name: string;
  requiredSecrets?: string[];
  docsUrl?: string;
  apiKeyUrl?: string;
  setupInstructions?: string;
}

export const ProviderSetupGuide: React.FC<ProviderSetupGuideProps> = ({
  name,
  requiredSecrets = [],
  docsUrl,
  apiKeyUrl,
  setupInstructions,
}) => {
  if (requiredSecrets.length === 0 && !docsUrl && !apiKeyUrl && !setupInstructions) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-3">
      <div className="text-xs font-semibold text-blue-800 mb-2">
        🔑 Setup-Anleitung für {name}
      </div>
      
      {requiredSecrets.length > 0 && (
        <div className="mb-2">
          <div className="text-[11px] font-medium text-blue-700 mb-1">
            Benötigte Secrets:
          </div>
          <ul className="text-[11px] text-blue-600 space-y-0.5 list-disc list-inside ml-1">
            {requiredSecrets.map((secretName) => (
              <li key={secretName}>
                <span className="font-mono">{secretName}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {apiKeyUrl && (
        <div className="mb-2">
          <div className="text-[11px] font-medium text-blue-700 mb-1">
            API Key erhalten:
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
            Anleitung:
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
            📚 Vollständige Dokumentation öffnen
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {requiredSecrets.length > 0 && (
        <div className="mt-2 pt-2 border-t border-blue-200">
          <p className="text-[11px] text-blue-600">
            💡 <strong>Tipp:</strong> Lege die Secrets im Bereich „Secrets" an, damit {name} funktioniert.
          </p>
        </div>
      )}
    </div>
  );
};

