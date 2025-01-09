import { useState, useCallback } from "react";

export const useSessionState = () => {
  const hasPersistedSession = Boolean(localStorage.getItem('supabase.auth.token'));
  const [session, setSession] = useState<boolean>(hasPersistedSession);
  const [loading, setLoading] = useState<boolean>(false);

  const updateSession = useCallback((isAuthenticated: boolean) => {
    console.log('Updating session state:', isAuthenticated);
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