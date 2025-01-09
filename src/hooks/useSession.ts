import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { deleteUserData, deleteUserAccount, signOut } from "@/utils/authUtils";
import { handleSubscriptionCheck } from "@/utils/subscriptionUtils";
import { useSessionState } from "./useSessionState";
import { useQuery } from "@tanstack/react-query";

export const useSession = () => {
  const { session, loading, updateSession, setLoading } = useSessionState();
  const { toast } = useToast();
  const navigate = useNavigate();

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
          // Only check subscription if we have a session
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
      // Check if we have a session in localStorage to prevent initial loading
      const persistedSession = localStorage.getItem('supabase.auth.token');
      return persistedSession ? JSON.parse(persistedSession) : null;
    }
  });

  const deleteAccount = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.user.id) {
        throw new Error("No user session found");
      }

      await deleteUserData(currentSession.user.id);
      await deleteUserAccount(currentSession.user.id);
      await signOut();
      
      updateSession(false);
      navigate('/login');
      
      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted.",
      });
    } catch (error: any) {
      console.error("Delete account error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete user account. Please try again.",
      });
    }
  };

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
  }, [updateSession]);

  return { session, loading, deleteAccount };
};