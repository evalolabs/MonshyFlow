import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { transformData as _transformData } from '../../utils/templateEngine';
import { VariableTreePopover } from './VariableTreePopover';
import type { SecretResponse } from '../../services/secretsService';

interface ExpressionEditorProps {
  label?: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  onChange: (v: string) => void;
  nodes: Node[];
  edges: Edge[];
  currentNodeId: string;
  previewSource?: any; // optional explicit preview data
  debugSteps?: any[]; // debug steps with evaluated outputs
  secrets?: SecretResponse[]; // optional: available secrets for insert helper
}

export const ExpressionEditor: React.FC<ExpressionEditorProps> = ({
  label,
  value,
  placeholder,
  multiline,
  rows = 4,
  onChange,
  nodes,
  edges,
  currentNodeId,
  previewSource,
  debugSteps = [],
  secrets = [],
}) => {
  const inputId = useId();
  const [showVars, setShowVars] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const secretsButtonRef = useRef<HTMLButtonElement | null>(null);

  // Build a lightweight preview context from the immediate upstream node's data
  const previewContext = useMemo(() => {
    if (previewSource) return previewSource;
    const incoming = edges.find(e => e.target === currentNodeId);
    const prev = nodes.find(n => n.id === incoming?.source);
    // Use node.data as preview; in runtime, real outputs will be used
    return prev?.data || {};
  }, [nodes, edges, currentNodeId, previewSource]);

  // If upstream is an API node with a URL, fetch a sample response for richer preview
  const [fetchedPreview, setFetchedPreview] = useState<any>(null);
  useEffect(() => {
    const incoming = edges.find(e => e.target === currentNodeId);
    const prev = nodes.find(n => n.id === incoming?.source);
    const url = (prev?.type === 'api') ? (prev.data as any)?.url : undefined;
    if (!url || typeof url !== 'string') { setFetchedPreview(null); return; }
    let aborted = false;
    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status}`);
        const json = await res.json();
        if (!aborted) setFetchedPreview(json);
      } catch (e) {
        if (!aborted) setFetchedPreview(null);
      }
    })();
    return () => { aborted = true; };
  }, [nodes, edges, currentNodeId]);

  const insertAtCursor = (text: string) => {
    const el = inputRef.current as HTMLInputElement | HTMLTextAreaElement | null;
    if (!el) {
      onChange(value + text);
      return;
    }
    const start = (el as any).selectionStart ?? value.length;
    const end = (el as any).selectionEnd ?? value.length;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    // restore cursor
    requestAnimationFrame(() => {
      (el as any).selectionStart = (el as any).selectionEnd = start + text.length;
      el.focus();
    });
  };

  // Simple preview: resolve {{path}} placeholders inside the value against previewContext
  const preview = useMemo(() => {
    try {
      const src = fetchedPreview ?? previewContext;
      if (value && value.includes('{{')) {
        // Reuse transform engine string resolution by passing string directly
        return _transformData(src, value);
      }
      return value;
    } catch (e: any) {
      return `Error: ${e.message}`;
    }
  }, [value, previewContext, fetchedPreview]);

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div ref={containerRef} className="space-y-2">
        {multiline ? (
          <textarea
            id={inputId}
            ref={el => { inputRef.current = el; }}
            value={value || ''}
            onChange={e => {
              const next = e.target.value;
              onChange(next);
              // Auto-open variables when user types '{{'
              const pos = (e.target as any).selectionStart as number;
              const two = next.slice(Math.max(0, pos - 2), pos);
              if (two === '{{') setShowVars(true);
            }}
            onFocus={() => {
              console.log('[ExpressionEditor] focus textarea', { currentNodeId, field: label || placeholder });
              setShowVars(true);
            }}
            placeholder={placeholder}
            rows={rows}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        ) : (
          <input
            id={inputId}
            ref={el => { inputRef.current = el; }}
            type="text"
            value={value || ''}
            onChange={e => {
              const next = e.target.value;
              onChange(next);
              const pos = (e.target as any).selectionStart as number;
              const two = next.slice(Math.max(0, pos - 2), pos);
              if (two === '{{') setShowVars(true);
            }}
            onFocus={() => {
              console.log('[ExpressionEditor] focus input', { currentNodeId, field: label || placeholder });
              setShowVars(true);
            }}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        )}
        <div className="flex items-center gap-2">
        <button
          type="button"
            className="px-2 py-1.5 text-xs bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          onClick={() => setShowVars(!showVars)}
          title="Insert variables ({{ }})"
        >
          Variables
        </button>
          {secrets.length > 0 && (
            <button
              ref={secretsButtonRef}
              type="button"
              className="px-2 py-1.5 text-xs bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 text-blue-700"
              onClick={() => setShowSecrets(!showSecrets)}
              title="Insert secret reference ({{secrets.NAME}})"
            >
              Secrets
            </button>
          )}
        </div>
      </div>
      {/* Inline list removed; we now use only the floating tree popover next to the field */}
      {showVars && (
        <VariableTreePopover
          anchorEl={(containerRef.current as any) || (inputRef.current as any)}
          nodes={nodes as any}
          edges={edges as any}
          currentNodeId={currentNodeId}
          data={fetchedPreview ?? previewContext}
          debugSteps={debugSteps}
          onPick={(p) => insertAtCursor(`{{${p}}}`)}
          onClose={() => setShowVars(false)}
        />
      )}
      {showSecrets && secrets.length > 0 && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowSecrets(false)}
          />
          <div
            className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
            style={{
              top: secretsButtonRef.current 
                ? secretsButtonRef.current.getBoundingClientRect().bottom + window.scrollY + 4 
                : 0,
              left: secretsButtonRef.current 
                ? secretsButtonRef.current.getBoundingClientRect().left + window.scrollX
                : 0,
              minWidth: '200px',
            }}
          >
            <div className="p-2 border-b border-gray-200 text-xs font-semibold text-gray-700">
              Insert Secret Reference
            </div>
            {secrets
              .filter(s => s.isActive)
              .map(secret => (
                <button
                  key={secret.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                  onClick={() => {
                    insertAtCursor(`{{secrets.${secret.name}}}`);
                    setShowSecrets(false);
                  }}
                  title={`Insert {{secrets.${secret.name}}}`}
                >
                  <div className="font-mono text-blue-700">{`{{secrets.${secret.name}}}`}</div>
                  {secret.provider && (
                    <div className="text-gray-500 text-[10px] mt-0.5">{secret.provider}</div>
                  )}
                </button>
              ))}
          </div>
        </>
      )}
      <div className="text-xs text-gray-600">
        <span className="font-medium">Preview: </span>
        <span className="font-mono">{typeof preview === 'string' ? preview : JSON.stringify(preview)}</span>
      </div>
    </div>
  );
};


