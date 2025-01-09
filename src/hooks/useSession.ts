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
  const { data: sessionData } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        console.log('Checking session status...');
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          updateSession(false);
          setLoading(false);
          return null;
        }

        if (currentSession) {
          console.log('Session found, checking subscription...');
          const isActive = await handleSubscriptionCheck(currentSession.user.id);
          console.log('Subscription status:', isActive);
          updateSession(isActive);
          setLoading(false);
          return currentSession;
        } else {
          console.log('No active session found');
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
    refetchOnWindowFocus: true,
    retry: 1,
    enabled: true // Always run the query
  });

  return { 
    session, 
    loading, 
    deleteAccount,
    currentUser: sessionData?.user ?? null 
  };
};