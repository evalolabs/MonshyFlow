import { useEffect, useRef } from 'react';

interface EdgeContextMenuProps {
  x: number;
  y: number;
  canPaste: boolean;
  onPaste: () => void;
  onClose: () => void;
}

export function EdgeContextMenu({ x, y, canPaste, onPaste, onClose }: EdgeContextMenuProps) {
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

    document.addEventListener('keydown', handleEscape);
    const timerId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <>
      {/* Invisible overlay to catch clicks */}
      <div className="fixed inset-0 z-[99]" onClick={onClose} />

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
            if (canPaste) {
              onPaste();
              onClose();
            }
          }}
          disabled={!canPaste}
          className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors ${
            canPaste ? 'hover:bg-blue-50 text-gray-700 hover:text-blue-600' : 'opacity-50 cursor-not-allowed text-gray-400'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3h6a2 2 0 012 2v2h-2V5H9v2H7V5a2 2 0 012-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z" />
          </svg>
          <span className="font-medium">Paste</span>
          <span className="ml-auto flex items-center gap-1 text-xs text-gray-500">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">V</kbd>
          </span>
        </button>

        <div className="border-t border-gray-200 mt-1 pt-1 px-4 py-2">
          <div className="text-xs text-gray-500">
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


