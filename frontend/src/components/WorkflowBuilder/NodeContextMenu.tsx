import { useEffect, useRef } from 'react';

interface NodeContextMenuProps {
  x: number;
  y: number;
  nodeType: string;
  onDelete: () => void;
  onDuplicate: () => void;
  onConfigure: () => void;
  onClose: () => void;
}

export function NodeContextMenu({
  x,
  y,
  nodeType,
  onDelete,
  onDuplicate,
  onConfigure,
  onClose
}: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Add escape listener immediately
    document.addEventListener('keydown', handleEscape);

    // Delay click listener to prevent immediate closing
    const timerId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const canDelete = nodeType !== 'start';

  return (
    <>
      {/* Invisible overlay to catch clicks */}
      <div 
        className="fixed inset-0 z-[99]" 
        onClick={onClose}
      />
      
      {/* Context Menu */}
      <div
        ref={menuRef}
        className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-[100] min-w-[180px]"
        style={{
          left: `${x}px`,
          top: `${y}px`,
        }}
      >
      <button
        onClick={() => {
          onConfigure();
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="font-medium">Configure</span>
      </button>

      <button
        onClick={() => {
          onDuplicate();
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-green-50 flex items-center gap-3 text-gray-700 hover:text-green-600 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span className="font-medium">Duplicate</span>
      </button>

      <div className="border-t border-gray-200 my-1"></div>

      <button
        onClick={() => {
          if (canDelete) {
            onDelete();
            onClose();
          }
        }}
        disabled={!canDelete}
        className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors ${
          canDelete
            ? 'hover:bg-red-50 text-gray-700 hover:text-red-600'
            : 'opacity-50 cursor-not-allowed text-gray-400'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span className="font-medium">Delete</span>
        {!canDelete && <span className="text-xs ml-auto">(Protected)</span>}
      </button>

      <div className="border-t border-gray-200 mt-1 pt-1 px-4 py-2">
        <div className="text-xs text-gray-500">
          <div className="flex items-center gap-1 mb-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Del</kbd>
            <span>Delete node</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Esc</kbd>
            <span>Close menu</span>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

