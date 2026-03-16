import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../core/supabase/client';

type AppSessionContextValue = {
  isAuthenticated: boolean;
  hasActiveGroup: boolean;
  isBootstrapping: boolean;
  login: () => void;
  logout: () => void;
  selectGroup: () => void;
  clearGroup: () => void;
};

const AppSessionContext = createContext<AppSessionContextValue | undefined>(undefined);

type AppSessionProviderProps = {
  children: React.ReactNode;
};

export function AppSessionProvider({ children }: AppSessionProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasActiveGroup, setHasActiveGroup] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setIsAuthenticated(false);
      setIsBootstrapping(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setIsAuthenticated(Boolean(data.session));
      } catch {
        if (!mounted) return;
        setIsAuthenticated(false);
      } finally {
        if (!mounted) return;
        setIsBootstrapping(false);
      }
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
      if (!session) {
        setHasActiveGroup(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AppSessionContextValue>(
    () => ({
      isAuthenticated,
      hasActiveGroup,
      isBootstrapping,
      login: () => setIsAuthenticated(true),
      logout: () => {
        setIsAuthenticated(false);
        setHasActiveGroup(false);
      },
      selectGroup: () => setHasActiveGroup(true),
      clearGroup: () => setHasActiveGroup(false),
    }),
    [hasActiveGroup, isAuthenticated, isBootstrapping]
  );

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
}

export function useAppSession() {
  const context = useContext(AppSessionContext);

  if (!context) {
    throw new Error('useAppSession must be used within AppSessionProvider');
  }

  return context;
}