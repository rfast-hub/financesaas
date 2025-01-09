import { supabase } from "@/integrations/supabase/client";

// Session timeout duration in seconds (4 hours)
export const SESSION_TIMEOUT = 4 * 60 * 60;

// Maximum session duration (8 hours)
export const MAX_SESSION_DURATION = 8 * 60 * 60;

export const configureSessionTimeout = () => {
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      // Set session expiry time
      const expiryTime = new Date(session.expires_at! * 1000);
      const now = new Date();
      
      // Calculate time until expiry in milliseconds
      const timeUntilExpiry = expiryTime.getTime() - now.getTime();
      
      // Ensure the session doesn't exceed maximum duration
      const actualTimeout = Math.min(timeUntilExpiry, MAX_SESSION_DURATION * 1000);
      
      // Set timeout to handle session expiration
      setTimeout(() => {
        supabase.auth.signOut();
        window.location.href = '/login?expired=true';
      }, actualTimeout);

      // Set up periodic activity check
      let lastActivity = Date.now();
      const activityInterval = setInterval(() => {
        const inactiveTime = Date.now() - lastActivity;
        if (inactiveTime > SESSION_TIMEOUT * 1000) {
          clearInterval(activityInterval);
          supabase.auth.signOut();
          window.location.href = '/login?expired=true&reason=inactivity';
        }
      }, 60000); // Check every minute

      // Update last activity on user interaction
      const updateActivity = () => {
        lastActivity = Date.now();
      };

      window.addEventListener('mousemove', updateActivity);
      window.addEventListener('keydown', updateActivity);
      window.addEventListener('click', updateActivity);
      window.addEventListener('scroll', updateActivity);

      return () => {
        clearInterval(activityInterval);
        window.removeEventListener('mousemove', updateActivity);
        window.removeEventListener('keydown', updateActivity);
        window.removeEventListener('click', updateActivity);
        window.removeEventListener('scroll', updateActivity);
      };
    }
  });
};

export const isSessionValid = (session: any): boolean => {
  if (!session) return false;
  
  const expiryTime = new Date(session.expires_at * 1000);
  const now = new Date();
  
  return expiryTime > now;
};