import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Route = 'home' | 'guardaroba' | 'outfit' | 'preferiti' | 'meteo' | 'colori';

interface RouterValue {
  route: Route;
  params: Record<string, string>;
  navigate: (route: Route, params?: Record<string, string>) => void;
}

const RouterContext = createContext<RouterValue | undefined>(undefined);

function parseHash(): { route: Route; params: Record<string, string> } {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [path, query] = hash.split('?');
  const route = (path || 'home') as Route;
  const params: Record<string, string> = {};
  if (query) {
    new URLSearchParams(query).forEach((v, k) => (params[k] = v));
  }
  const valid: Route[] = ['home', 'guardaroba', 'outfit', 'preferiti', 'meteo', 'colori'];
  return { route: valid.includes(route) ? route : 'home', params };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(parseHash());

  useEffect(() => {
    const onHash = () => setState(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (route: Route, params?: Record<string, string>) => {
    let hash = `#/${route}`;
    if (params && Object.keys(params).length) {
      const sp = new URLSearchParams(params);
      hash += `?${sp.toString()}`;
    }
    window.location.hash = hash;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return <RouterContext.Provider value={{ ...state, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter deve essere usato dentro RouterProvider');
  return ctx;
}
