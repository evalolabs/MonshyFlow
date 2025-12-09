import React, { useState, useRef, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface AutoCompleteTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  nodes?: Node[];
  edges?: Edge[];
  currentNodeId?: string;
  className?: string;
}

interface Suggestion {
  text: string;
  display: string;
  description: string;
  category: string;
}

export const AutoCompleteTextarea: React.FC<AutoCompleteTextareaProps> = ({
  value,
  onChange,
  placeholder,
  rows = 4,
  nodes = [],
  edges = [],
  currentNodeId = '',
  className = '',
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get previous nodes
  const previousNodeIds = edges
    .filter(edge => edge.target === currentNodeId)
    .map(edge => edge.source);
  const previousNodes = nodes.filter(node => previousNodeIds.includes(node.id));

  // All available suggestions
  const allSuggestions: Suggestion[] = [
    // Input variables
    { text: 'input.body', display: 'input.body', description: 'Request body object', category: '📥 Input' },
    { text: 'input.body.question', display: 'input.body.question', description: 'Question field', category: '📥 Input' },
    { text: 'input.body.message', display: 'input.body.message', description: 'Message field', category: '📥 Input' },
    { text: 'input.body.data', display: 'input.body.data', description: 'Data field', category: '📥 Input' },
    { text: 'input.headers', display: 'input.headers', description: 'Request headers', category: '📥 Input' },
    { text: 'input.query', display: 'input.query', description: 'Query parameters', category: '📥 Input' },
    { text: 'input.method', display: 'input.method', description: 'HTTP method', category: '📥 Input' },
    
    // Common patterns
    { text: 'llm_response', display: 'llm_response', description: 'Last LLM response', category: '⚡ Common' },
    { text: 'llm_response_tokens', display: 'llm_response_tokens', description: 'Token count', category: '⚡ Common' },
    
    // Previous nodes
    ...previousNodes.map(node => ({
      text: `node_${node.id}_output`,
      display: `node_${node.id}_output`,
      description: `Output from ${node.data?.label || node.type}`,
      category: '🔗 Previous',
    })),
  ];

  // Check if we should show autocomplete
  useEffect(() => {
    if (!textareaRef.current) return;

    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    
    // Check if we're inside {{ }}
    const lastOpenBrace = textBeforeCursor.lastIndexOf('{{');
    const lastCloseBrace = textBeforeCursor.lastIndexOf('}}');
    
    if (lastOpenBrace > lastCloseBrace && lastOpenBrace !== -1) {
      // We're inside {{ }}
      const searchText = textBeforeCursor.substring(lastOpenBrace + 2).trim();
      
      // Filter suggestions
      const filtered = allSuggestions.filter(s =>
        s.text.toLowerCase().includes(searchText.toLowerCase())
      );
      
      if (filtered.length > 0) {
        setSuggestions(filtered);
        setShowSuggestions(true);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [value, cursorPosition]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
      case 'Tab':
        if (suggestions.length > 0) {
          e.preventDefault();
          insertSuggestion(suggestions[selectedIndex].text);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const insertSuggestion = (suggestionText: string) => {
    if (!textareaRef.current) return;

    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const textAfterCursor = value.substring(cursorPos);
    
    // Find the {{ position
    const lastOpenBrace = textBeforeCursor.lastIndexOf('{{');
    
    // Replace from {{ to cursor with the suggestion
    const newValue =
      value.substring(0, lastOpenBrace + 2) +
      suggestionText +
      '}}' +
      textAfterCursor;
    
    onChange(newValue);
    setShowSuggestions(false);
    
    // Set cursor after the inserted variable
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = lastOpenBrace + 2 + suggestionText.length + 2;
        textareaRef.current.setSelectionRange(newPos, newPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleClick = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  // Group suggestions by category
  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.category]) {
      acc[suggestion.category] = [];
    }
    acc[suggestion.category].push(suggestion);
    return acc;
  }, {} as Record<string, Suggestion[]>);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onKeyUp={handleClick}
        placeholder={placeholder}
        rows={rows}
        className={className}
        spellCheck={false}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full max-w-md bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          <div className="p-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">
              💡 Suggestions ({suggestions.length})
            </span>
            <span className="text-xs text-gray-400">
              ↑↓ Navigate • Enter/Tab Insert • Esc Close
            </span>
          </div>
          
          {Object.entries(groupedSuggestions).map(([category, items]) => (
            <div key={category}>
              <div className="px-3 py-1 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-500">{category}</span>
              </div>
              {items.map((suggestion, index) => {
                const globalIndex = suggestions.indexOf(suggestion);
                const isSelected = globalIndex === selectedIndex;
                
                return (
                  <button
                    key={index}
                    type="button"
                    className={`w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors ${
                      isSelected ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => insertSuggestion(suggestion.text)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-mono text-blue-600">
                          {`{{${suggestion.display}}}`}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {suggestion.description}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="text-xs text-blue-600 font-medium">
                          ⏎
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

