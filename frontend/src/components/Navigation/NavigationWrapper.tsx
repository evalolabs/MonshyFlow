import { useLocation } from 'react-router-dom';
import { Navigation } from './Navigation';
import { useEffect } from 'react';

export function NavigationWrapper() {
  const location = useLocation();

  // Don't show navigation in workflow editor
  const isWorkflowPage = location.pathname.startsWith('/workflow/') || location.pathname.startsWith('/webhook-test/');

  useEffect(() => {
    const contentElement = document.querySelector('.navigation-content') as HTMLElement;
    if (contentElement) {
      // Remove all margin classes first
      contentElement.classList.remove('ml-64', 'lg:ml-64');
      
      // Only add margin on desktop (lg breakpoint) when not on workflow page
      if (!isWorkflowPage) {
        contentElement.classList.add('lg:ml-64');
      }
    }
  }, [isWorkflowPage]);

  if (isWorkflowPage) {
    return null;
  }

  return <Navigation />;
}

