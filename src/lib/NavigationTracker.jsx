import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pagesConfig } from '@/pages.config';

/**
 * Mantido para compatibilidade com App.jsx; sem chamadas externas.
 */
export default function NavigationTracker() {
  const location = useLocation();
  const { Pages, mainPage } = pagesConfig;
  const mainPageKey = mainPage ?? Object.keys(Pages)[0];

  useEffect(() => {
    // Navegação local apenas (sem telemetria externa)
    void location.pathname;
    void mainPageKey;
  }, [location, mainPageKey]);

  return null;
}
