import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkSubscriptionStatus } from "@/utils/subscriptionUtils";

export const useSession = () => {
  const [session, setSession] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

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

  return { session, loading };
};