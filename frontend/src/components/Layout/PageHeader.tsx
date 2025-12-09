import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <>
      <style>{`
        .page-header-main {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px; /* Same height as navigation logo section (h-16 = 64px) */
          background: white;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          z-index: 30;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        @media (max-width: 1023px) {
          .page-header-main {
            left: 64px; /* Space for hamburger button (w-16 = 64px) */
          }
        }
        @media (min-width: 1024px) {
          .page-header-main {
            left: 256px; /* w-64 = 256px sidebar width */
          }
        }
      `}</style>
      <header className="page-header-main">
        <div className="w-full h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3 ml-6 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </header>
    </>
  );
}

