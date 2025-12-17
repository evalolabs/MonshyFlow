/**
 * JSON Syntax Highlighter Component
 * 
 * Simple JSON syntax highlighting without external dependencies
 */

import React from 'react';

interface JsonHighlighterProps {
  children: string | undefined | null;
}

export function JsonHighlighter({ children }: JsonHighlighterProps) {
  const highlightJson = (json: string | undefined | null) => {
    if (json === undefined || json === null) {
      return '<span class="text-gray-500">undefined</span>';
    }
    
    const jsonString = typeof json === 'string' ? json : String(json);
    
    return jsonString
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'text-gray-300';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-blue-400'; // key
          } else {
            cls = 'text-green-400'; // string value
          }
        } else if (/^(true|false)$/.test(match)) {
          cls = 'text-purple-400'; // boolean
        } else if (/^(null)$/.test(match)) {
          cls = 'text-gray-500'; // null
        } else if (/^-?\d+/.test(match)) {
          cls = 'text-yellow-400'; // number
        }
        return `<span class="${cls}">${match}</span>`;
      })
      .replace(/([{}[\]])/g, '<span class="text-white font-bold">$1</span>')
      .replace(/(,)/g, '<span class="text-gray-400">$1</span>');
  };

  return (
    <pre className="text-sm leading-relaxed whitespace-pre-wrap break-words">
      <code 
        className="block"
        style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
        dangerouslySetInnerHTML={{ 
          __html: highlightJson(children) 
        }} 
      />
    </pre>
  );
}

