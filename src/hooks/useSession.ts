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
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        updateSession(false);
        setLoading(false);
        return null;
      }

      const isActive = await handleSubscriptionCheck(currentSession.user.id);
      updateSession(isActive);
      setLoading(false);
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