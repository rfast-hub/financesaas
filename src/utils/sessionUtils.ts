import { supabase } from "@/integrations/supabase/client";

// Session timeout duration in seconds (4 hours)
export const SESSION_TIMEOUT = 4 * 60 * 60;

export const configureSessionTimeout = () => {
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      // Set session expiry time
      const expiryTime = new Date(session.expires_at! * 1000);
      const now = new Date();
      
      // Calculate time until expiry in milliseconds
      const timeUntilExpiry = expiryTime.getTime() - now.getTime();
      
      // Set timeout to handle session expiration
      setTimeout(() => {
        supabase.auth.signOut();
        window.location.href = '/login?expired=true';
      }, timeUntilExpiry);
    }
  });
};