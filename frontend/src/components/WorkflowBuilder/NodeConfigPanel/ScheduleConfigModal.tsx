/**
 * Schedule Config Modal
 * 
 * Modal wrapper for the Schedule Config Form component
 */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ScheduleConfigForm } from '../ScheduleConfigForm';
import { X } from 'lucide-react';

interface ScheduleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  initialConfig?: {
    cronExpression: string;
    timezone: string;
    enabled: boolean;
  };
  onConfigChange: (config: {
    cronExpression: string;
    timezone: string;
    enabled: boolean;
  }) => void;
}

export function ScheduleConfigModal({ 
  isOpen, 
  onClose, 
  workflowId, 
  initialConfig, 
  onConfigChange 
}: ScheduleConfigModalProps) {
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
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">⏰ Schedule Configuration</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure when this workflow should run automatically
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <ScheduleConfigForm
            workflowId={workflowId}
            initialConfig={initialConfig}
            onConfigChange={onConfigChange}
          />
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">
              💡 <strong>Tip:</strong> The schedule will only run if the workflow is active.
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

