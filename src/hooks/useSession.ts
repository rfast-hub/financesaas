import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkSubscriptionStatus } from "@/utils/subscriptionUtils";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const useSession = () => {
  const [session, setSession] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const deleteAccount = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.user.id) {
        throw new Error("No user session found");
      }

      // First, delete all price alerts
      const { error: alertsError } = await supabase
        .from('price_alerts')
        .delete()
        .eq('user_id', currentSession.user.id);

      if (alertsError) {
        console.error("Error deleting price alerts:", alertsError);
        throw new Error("Failed to delete price alerts");
      }

      // Then, delete subscription
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', currentSession.user.id);

      if (subscriptionError) {
        console.error("Error deleting subscription:", subscriptionError);
        throw new Error("Failed to delete subscription");
      }

      // Finally, delete the user
      const { error: userError } = await supabase.auth.admin.deleteUser(
        currentSession.user.id
      );

      if (userError) {
        console.error("Error deleting user:", userError);
        throw new Error("Failed to delete user account");
      }

      // Sign out and clear local storage
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
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
        description: error.message || "Failed to delete account. Please try again.",
      });
    }
  };

  useEffect(() => {
    const storedSession = localStorage.getItem('supabase.auth.token');
    if (storedSession) {
      setSession(true);
    }

    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          const isActive = await checkSubscriptionStatus(currentSession.user.id);
          
          if (!isActive) {
            await supabase.auth.signOut();
            setSession(false);
            localStorage.removeItem('supabase.auth.token');
            return;
          }

          setSession(true);
          localStorage.setItem('supabase.auth.token', 'true');
        } else {
          setSession(false);
          localStorage.removeItem('supabase.auth.token');
        }
      } catch (error) {
        console.error("Session check error:", error);
        setSession(false);
        localStorage.removeItem('supabase.auth.token');
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const isActive = await checkSubscriptionStatus(session.user.id);
        
        if (!isActive) {
          await supabase.auth.signOut();
          setSession(false);
          localStorage.removeItem('supabase.auth.token');
        } else {
          setSession(true);
          localStorage.setItem('supabase.auth.token', 'true');
        }
      } else {
        setSession(false);
        localStorage.removeItem('supabase.auth.token');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading, deleteAccount };
};