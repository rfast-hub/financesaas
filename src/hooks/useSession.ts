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

  const { data: sessionData } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          updateSession(false);
          return null;
        }

        if (currentSession) {
          const isActive = await handleSubscriptionCheck(currentSession.user.id);
          updateSession(isActive);
          return currentSession;
        } else {
          updateSession(false);
          return null;
        }
      } catch (error) {
        console.error("Session check error:", error);
        updateSession(false);
        return null;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: true,
    retry: 1
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
        return;
      }

      if (session) {
        const isActive = await handleSubscriptionCheck(session.user.id);
        updateSession(isActive);
      } else {
        updateSession(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [updateSession]);

  return { session, loading, deleteAccount };
};