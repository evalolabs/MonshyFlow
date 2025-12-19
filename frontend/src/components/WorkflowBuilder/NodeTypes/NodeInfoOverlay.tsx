/**
 * NodeInfoOverlay Component
 * 
 * Displays node information and user comments above nodes with transparent background
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import type { Node } from '@xyflow/react';
import { getNodeMetadata } from '../nodeRegistry/nodeMetadata';
import { validateNode } from '../utils/nodeValidation';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiIntegration } from '../../../config/apiIntegrations';

type SecretTypeQuery = 'ApiKey' | 'Password' | 'Token' | 'Generic' | 'Smtp';

/**
 * Guess secret type from node context (API integration, node type, secret name)
 * This provides better defaults than just guessing from the name
 */
function guessSecretTypeFromContext(
  node: Node,
  secretKey: string
): SecretTypeQuery {
  const data = node.data || {};
  
  // 1. Try to get from API Integration metadata
  if (data.apiId && typeof data.apiId === 'string') {
    const apiIntegration = getApiIntegration(data.apiId);
    if (apiIntegration?.authentication) {
      // Most API integrations use ApiKey, but we can be smarter
      const auth = apiIntegration.authentication;
      // If it's a username secret, it's likely a Password
      if (auth.usernameSecretKey === secretKey) {
        return 'Password';
      }
      // Default for API integrations is ApiKey
      return 'ApiKey';
    }
  }
  
  // 2. Guess from secret name (fallback)
  const s = (secretKey || '').toUpperCase();
  if (s.includes('SMTP')) return 'Smtp';
  if (s.includes('PASSWORD') || s.endsWith('_PASS') || s.endsWith('_PWD')) return 'Password';
  if (s.includes('TOKEN')) return 'Token';
  if (s.includes('KEY')) return 'ApiKey';
  
  // 3. Default
  return 'ApiKey';
}

interface NodeInfoOverlayProps {
  node: Node;
  onUpdateComment?: (nodeId: string, comment: string) => void;
  showOnHover?: boolean;
  secrets?: Array<{ key: string; isActive: boolean }>;
  parentHovered?: boolean;
}

export function NodeInfoOverlay({ 
  node, 
  onUpdateComment,
  showOnHover = true,
  secrets = [],
  parentHovered = false,
}: NodeInfoOverlayProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState((node.data?.comment as string) || '');
  const [tempComment, setTempComment] = useState(comment);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Get node metadata
  const metadata = getNodeMetadata(node.type || '');
  // Use user-defined label from node.data.label (from Configure Panel), fallback to metadata name
  const nodeLabel = (node.data?.label as string) || metadata?.name || node.type || 'Node';

  // Validate node
  const validation = useMemo(() => {
    return validateNode(node, secrets);
  }, [node, secrets]);

  // Group validation issues by type
  const errors = validation.issues.filter(i => i.type === 'error');
  const warnings = validation.issues.filter(i => i.type === 'warning');
  const infos = validation.issues.filter(i => i.type === 'info');

  const returnTo = useMemo(() => `${location.pathname}${location.search || ''}`, [location.pathname, location.search]);

  const parseMissingSecretKey = (message: string): string | null => {
    if (!message) return null;
    // Match both old format: "Secret \"X\"" and new format: "Provider API Key \"X\""
    const match = message.match(/(?:Secret|API Key) "([^"]+)"/);
    return match?.[1] || null;
  };

  const createMissingSecret = (secretKey: string) => {
    if (!secretKey) return;
    
    // Get better context for provider and type
    const data = node.data || {};
    let provider = metadata?.name || node.type || 'Provider';
    if (data.apiId && typeof data.apiId === 'string') {
      const apiIntegration = getApiIntegration(data.apiId);
      if (apiIntegration?.name) {
        provider = apiIntegration.name;
      }
    }
    
    const secretType = guessSecretTypeFromContext(node, secretKey);
    
    const params = new URLSearchParams({
      create: '1',
      name: secretKey,
      type: secretType,
      provider,
      returnTo,
    });
    const url = `/admin/secrets?${params.toString()}`;
    // Open in a new tab so the workflow remains open and the user can easily return.
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const goToSecrets = () => {
    navigate('/admin/secrets');
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [tempComment, isEditing]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleSaveComment = () => {
    setComment(tempComment);
    if (onUpdateComment) {
      onUpdateComment(node.id, tempComment);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setTempComment(comment);
    setIsEditing(false);
  };

  // Show overlay if: parent is hovered OR overlay itself is hovered OR always visible (if not showOnHover) OR has content
  const shouldShow = showOnHover ? (parentHovered || isHovered) : true;
  const hasContent = comment || validation.issues.length > 0;

  return (
    <div
      ref={overlayRef}
      // Use pb-2 (padding) instead of mb-2 (margin) to bridge the gap between node and overlay
      // This ensures the mouse doesn't "leave" the hover area when moving to the overlay
      className={`absolute bottom-full left-1/2 transform -translate-x-1/2 z-50 pb-2 transition-all duration-200 ${shouldShow || hasContent ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling to node (which would open config panel)
    >
      <div
        className={`
          bg-transparent rounded-lg
          min-w-[200px] max-w-[300px]
          transition-all duration-200
        `}
        style={{
          padding: '8px 12px',
        }}
      >
        {/* Node Label */}
        <div className="text-xs text-gray-800 mb-2 border-b border-gray-300 pb-2">
          <div className="font-semibold text-gray-900">{nodeLabel}</div>
        </div>

        {/* Validation Issues */}
        {validation.issues.length > 0 && (
          <div className="mb-2 space-y-1">
            {errors.map((issue, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[10px]">
                <span className="text-red-600 mt-0.5">●</span>
                <span className="text-red-700">
                  {issue.message}
                  {parseMissingSecretKey(issue.message) && (
                    <>
                      {' '}
                      <button
                        type="button"
                        className="text-red-700 underline underline-offset-2 hover:text-red-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          const key = parseMissingSecretKey(issue.message);
                          if (key) createMissingSecret(key);
                        }}
                        title="Secret anlegen"
                      >
                        Secret anlegen
                      </button>
                      {' '}
                      <span className="text-red-400">·</span>{' '}
                    {/*   <button
                        type="button"
                        className="text-red-700 underline underline-offset-2 hover:text-red-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToSecrets();
                        }}
                        title="Secrets öffnen"
                      >
                        Secrets
                      </button> */}
                    </>
                  )}
                </span>
              </div>
            ))}
            {warnings.map((issue, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[10px]">
                <span className="text-amber-600 mt-0.5">●</span>
                <span className="text-amber-700">
                  {issue.message}
                  {parseMissingSecretKey(issue.message) && (
                    <>
                      {' '}
                      <button
                        type="button"
                        className="text-amber-700 underline underline-offset-2 hover:text-amber-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          const key = parseMissingSecretKey(issue.message);
                          if (key) createMissingSecret(key);
                        }}
                        title="Secret anlegen"
                      >
                        Secret anlegen
                      </button>
                      {' '}
                      <span className="text-amber-400">·</span>{' '}
                      <button
                        type="button"
                        className="text-amber-700 underline underline-offset-2 hover:text-amber-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToSecrets();
                        }}
                        title="Secrets öffnen"
                      >
                        Secrets
                      </button>
                    </>
                  )}
                </span>
              </div>
            ))}
            {infos.map((issue, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[10px]">
                <span className="text-green-600 mt-0.5">●</span>
                <span className="text-green-700">{issue.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Comment Section */}
        <div className="mt-2">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                value={tempComment}
                onChange={(e) => setTempComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full bg-white/80 border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-900 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                rows={2}
                style={{ minHeight: '40px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleSaveComment();
                  } else if (e.key === 'Escape') {
                    handleCancelEdit();
                  }
                }}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent event from bubbling to node
                    handleCancelEdit();
                  }}
                  className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent event from bubbling to node
                    handleSaveComment();
                  }}
                  className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                >
                  Save
                </button>
              </div>
              <div className="text-[10px] text-gray-600 mt-1">
                Ctrl+Enter to save, Esc to cancel
              </div>
            </div>
          ) : (
            <div
              className="cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation(); // Prevent event from bubbling to node (which would open config panel)
                setIsEditing(true);
              }}
            >
              {comment ? (
                <div className="text-xs text-gray-900 whitespace-pre-wrap break-words">
                  {comment}
                </div>
              ) : (
                <div className="text-xs text-gray-600 italic group-hover:text-gray-800 transition-colors">
                  Click to add a comment...
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

