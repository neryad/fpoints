import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../core/supabase/client";
import { ensureCurrentUserRow } from "../../features/auth/services/auth.service";

const STORAGE_KEY_GROUP_ID = "active_group_id";
const STORAGE_KEY_GROUP_NAME = "active_group_name";

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
        const [{ data }, savedGroupId, savedGroupName] = await Promise.all([
          supabase.auth.getSession(),
          AsyncStorage.getItem(STORAGE_KEY_GROUP_ID),
          AsyncStorage.getItem(STORAGE_KEY_GROUP_NAME),
        ]);
        if (!mounted) return;
        setIsAuthenticated(Boolean(data.session));
        if (data.session) {
          await ensureCurrentUserRow();
          if (savedGroupId && savedGroupName) {
            setActiveGroupId(savedGroupId);
            setActiveGroupName(savedGroupName);
            setHasActiveGroup(true);
          }
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
          AsyncStorage.multiRemove([STORAGE_KEY_GROUP_ID, STORAGE_KEY_GROUP_NAME]).catch(() => {});
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
        AsyncStorage.multiRemove([STORAGE_KEY_GROUP_ID, STORAGE_KEY_GROUP_NAME]).catch(() => {});
      },
      selectGroup: (groupId: string, groupName: string) => {
        setActiveGroupId(groupId);
        setActiveGroupName(groupName);
        setHasActiveGroup(true);
        AsyncStorage.multiSet([
          [STORAGE_KEY_GROUP_ID, groupId],
          [STORAGE_KEY_GROUP_NAME, groupName],
        ]).catch(() => {});
      },
      clearGroup: () => {
        setHasActiveGroup(false);
        setActiveGroupId(null);
        setActiveGroupName(null);
        AsyncStorage.multiRemove([STORAGE_KEY_GROUP_ID, STORAGE_KEY_GROUP_NAME]).catch(() => {});
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
