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
      console.log('Fetching session data...');
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        console.log('No session found, updating state...');
        updateSession(false);
        return null;
      }

      console.log('Session found, checking subscription...');
      const isActive = await handleSubscriptionCheck(currentSession.user.id);
      console.log('Subscription check result:', isActive);
      updateSession(isActive);
      return currentSession;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: true,
    retry: 1
  });

  return { 
    session, 
    loading, 
    deleteAccount,
    currentUser: sessionData?.user ?? null 
  };
};