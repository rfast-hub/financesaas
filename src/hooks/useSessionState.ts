import { useState, useCallback } from "react";

export const useSessionState = () => {
  // Initialize with checking localStorage for a session
  const hasPersistedSession = Boolean(localStorage.getItem('supabase.auth.token'));
  const [session, setSession] = useState<boolean | null>(hasPersistedSession ? true : null);
  const [loading, setLoading] = useState(!hasPersistedSession);

  const updateSession = useCallback((isAuthenticated: boolean) => {
    setSession(isAuthenticated);
    setLoading(false);
  }, []);

  return {
    session,
    loading,
    updateSession,
    setLoading,
  };
};