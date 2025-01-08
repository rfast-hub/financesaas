import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkSubscriptionStatus } from "@/utils/subscriptionUtils";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { checkAuthSession, signOut, deleteUserData, deleteUserAccount } from "@/utils/authUtils";

export const useSession = () => {
  const [session, setSession] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const deleteAccount = async () => {
    try {
      const currentSession = await checkAuthSession();
      if (!currentSession?.user.id) {
        throw new Error("No user session found");
      }

      await deleteUserData(currentSession.user.id);
      await deleteUserAccount(currentSession.user.id);
      await signOut();
      
      setSession(false);
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
          setSession(false);
          return;
        }

        if (currentSession) {
          try {
            const isActive = await checkSubscriptionStatus(currentSession.user.id);
            
            if (!isActive) {
              await signOut();
              setSession(false);
              return;
            }

            setSession(true);
          } catch (error) {
            console.error("Subscription check error:", error);
            setSession(false);
          }
        } else {
          setSession(false);
        }
      } catch (error) {
        console.error("Session check error:", error);
        setSession(false);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(false);
        setLoading(false);
        return;
      }

      if (session) {
        try {
          const isActive = await checkSubscriptionStatus(session.user.id);
          
          if (!isActive) {
            await signOut();
            setSession(false);
          } else {
            setSession(true);
          }
        } catch (error) {
          console.error("Subscription check error:", error);
          setSession(false);
        }
      } else {
        setSession(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading, deleteAccount };
};