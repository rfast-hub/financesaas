import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { deleteUserData, deleteUserAccount, signOut } from "@/utils/authUtils";
import { handleSubscriptionCheck } from "@/utils/subscriptionUtils";
import { useSessionState } from "./useSessionState";

export const useSession = () => {
  const { session, loading, updateSession, setLoading } = useSessionState();
  const { toast } = useToast();
  const navigate = useNavigate();

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
    const checkSession = async () => {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          updateSession(false);
          return;
        }

        if (currentSession) {
          const isActive = await handleSubscriptionCheck(currentSession.user.id);
          updateSession(isActive);
        } else {
          updateSession(false);
        }
      } catch (error) {
        console.error("Session check error:", error);
        updateSession(false);
      }
    };

    checkSession();

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