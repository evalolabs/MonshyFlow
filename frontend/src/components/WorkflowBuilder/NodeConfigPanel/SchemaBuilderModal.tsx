/**
 * Schema Builder Modal
 * 
 * Modal wrapper for the Schema Builder component
 */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SchemaBuilder } from '../NodeConfigForms/SchemaBuilder';

interface SchemaBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: any;
  onChange: (schema: any) => void;
  schemaType?: 'input' | 'output';
  nodeType?: string;
  title?: string;
}

export function SchemaBuilderModal({ 
  isOpen, 
  onClose, 
  schema, 
  onChange, 
  schemaType = 'input',
  nodeType,
  title 
}: SchemaBuilderModalProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Render modal using portal to body, so it appears above everything
  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {title || (schemaType === 'input' ? 'Input Data Structure' : 'Output Data Structure')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {schemaType === 'input' 
                ? 'Define what data your application should send to this workflow'
                : 'Define what data this node will output'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <SchemaBuilder
            schema={schema}
            onChange={onChange}
            schemaType={schemaType}
            nodeType={nodeType}
          />
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">
              💡 <strong>Tip:</strong> If no structure is defined, any data format will be accepted.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
