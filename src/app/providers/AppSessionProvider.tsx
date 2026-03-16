import React, { createContext, useContext, useMemo, useState } from 'react';

type AppSessionContextValue = {
  isAuthenticated: boolean;
  hasActiveGroup: boolean;
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

  const value = useMemo<AppSessionContextValue>(() => ({
    isAuthenticated,
    hasActiveGroup,
    login: () => setIsAuthenticated(true),
    logout: () => {
      setIsAuthenticated(false);
      setHasActiveGroup(false);
    },
    selectGroup: () => setHasActiveGroup(true),
    clearGroup: () => setHasActiveGroup(false),
  }), [hasActiveGroup, isAuthenticated]);

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
}

export function useAppSession() {
  const context = useContext(AppSessionContext);

  if (!context) {
    throw new Error('useAppSession must be used within AppSessionProvider');
  }

  return context;
}
