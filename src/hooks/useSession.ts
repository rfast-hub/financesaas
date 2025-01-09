import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSubscriptionCheck } from "@/utils/subscriptionUtils";
import { useSessionState } from "./useSessionState";
import { useSessionSubscription } from "./useSessionSubscription";
import { useAccountDeletion } from "./useAccountDeletion";

export const useSession = () => {
  const { session, loading, updateSession, setLoading } = useSessionState();
  const { deleteAccount } = useAccountDeletion(updateSession);

  // Set up subscription listener
  useSessionSubscription(updateSession, setLoading);

  // Optimize session check with React Query
  useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          updateSession(false);
          setLoading(false);
          return null;
        }

        if (currentSession) {
          const isActive = await handleSubscriptionCheck(currentSession.user.id);
          updateSession(isActive);
          setLoading(false);
          return currentSession;
        } else {
          updateSession(false);
          setLoading(false);
          return null;
        }
      } catch (error) {
        console.error("Session check error:", error);
        updateSession(false);
        setLoading(false);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    initialData: () => {
      const persistedSession = localStorage.getItem('supabase.auth.token');
      return persistedSession ? JSON.parse(persistedSession) : null;
    }
  });

  return { session, loading, deleteAccount };
};