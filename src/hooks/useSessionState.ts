import { useState, useCallback } from "react";

export const useSessionState = () => {
  const [session, setSession] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

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