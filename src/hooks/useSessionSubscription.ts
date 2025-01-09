import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { handleSubscriptionCheck } from "@/utils/subscriptionUtils";

export const useSessionSubscription = (
  updateSession: (isAuthenticated: boolean) => void,
  setLoading: (loading: boolean) => void
) => {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        updateSession(false);
        setLoading(false);
        return;
      }

      if (session) {
        const isActive = await handleSubscriptionCheck(session.user.id);
        updateSession(isActive);
      } else {
        updateSession(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [updateSession, setLoading]);
};