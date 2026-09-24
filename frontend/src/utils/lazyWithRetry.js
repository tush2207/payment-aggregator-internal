import { lazy } from 'react';

/**
 * Enhanced lazy import with automatic retry on dynamic module fetch failures.
 * Prevents "Failed to fetch dynamically imported module" when Vite/Webpack reloads or rebuilds chunks.
 */
export const lazyWithRetry = (componentImport, pageName = 'Component') => {
  return lazy(async () => {
    const pageAlreadyRefreshed = JSON.parse(
      window.sessionStorage.getItem(`page_refreshed_${pageName}`) || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem(`page_refreshed_${pageName}`, 'false');
      return component;
    } catch (error) {
      console.warn(`Dynamic import failed for ${pageName}. Attempting recovery...`, error);

      if (!pageAlreadyRefreshed) {
        window.sessionStorage.setItem(`page_refreshed_${pageName}`, 'true');
        window.location.reload();
        return new Promise(() => {}); // Halt execution while page reloads
      }

      // If already refreshed once and still failing, throw to Error Boundary
      throw error;
    }
  });
};

export default lazyWithRetry;
