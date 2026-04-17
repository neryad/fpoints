import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../../core/supabase/client";
import { ensureCurrentUserRow } from "../../features/auth/services/auth.service";

type AppSessionContextValue = {
  isAuthenticated: boolean;
  hasActiveGroup: boolean;
  isBootstrapping: boolean;
  activeGroupId: string | null;
  activeGroupName: string | null;
  login: () => void;
  logout: () => void;
  selectGroup: (groupId: string, groupName: string) => void;
  clearGroup: () => void;
};

const AppSessionContext = createContext<AppSessionContextValue | undefined>(
  undefined,
);

type AppSessionProviderProps = {
  children: React.ReactNode;
};

export function AppSessionProvider({ children }: AppSessionProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasActiveGroup, setHasActiveGroup] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeGroupName, setActiveGroupName] = useState<string | null>(null);

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
        if (data.session) {
          await ensureCurrentUserRow();
        }
      } catch {
        if (!mounted) return;
        setIsAuthenticated(false);
      } finally {
        if (mounted) {
          setIsBootstrapping(false);
        }
      }
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'TOKEN_REFRESH_FAILED') {
          setIsAuthenticated(false);
          setHasActiveGroup(false);
          setActiveGroupId(null);
          setActiveGroupName(null);
          supabase.auth.signOut().catch(() => {});
          return;
        }
        setIsAuthenticated(Boolean(session));
        if (session) {
          ensureCurrentUserRow().catch(() => {
            // No bloquear la UI si falla bootstrap de perfil.
          });
        }
        if (!session) {
          setHasActiveGroup(false);
          setActiveGroupId(null);
          setActiveGroupName(null);
        }
      },
    );

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
      activeGroupId,
      activeGroupName,
      login: () => setIsAuthenticated(true),
      logout: () => {
        setIsAuthenticated(false);
        setHasActiveGroup(false);
        setActiveGroupId(null);
        setActiveGroupName(null);
      },
      selectGroup: (groupId: string, groupName: string) => {
        setActiveGroupId(groupId);
        setActiveGroupName(groupName);
        setHasActiveGroup(true);
      },
      clearGroup: () => {
        setHasActiveGroup(false);
        setActiveGroupId(null);
        setActiveGroupName(null);
      },
    }),
    [
      activeGroupId,
      activeGroupName,
      hasActiveGroup,
      isAuthenticated,
      isBootstrapping,
    ],
  );

  return (
    <AppSessionContext.Provider value={value}>
      {children}
    </AppSessionContext.Provider>
  );
}

export function useAppSession() {
  const context = useContext(AppSessionContext);

  if (!context) {
    throw new Error("useAppSession must be used within AppSessionProvider");
  }

  return context;
}
