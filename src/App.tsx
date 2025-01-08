import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Login from "./pages/Login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize session from localStorage if available
    const storedSession = localStorage.getItem('supabase.auth.token');
    if (storedSession) {
      setSession(true);
    }

    // Check current session and subscription status
    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          // Check subscription status
          const { data: subscription, error: subscriptionError } = await supabase
            .from('subscriptions')
            .select('is_active, status')
            .eq('user_id', currentSession.user.id)
            .single();

          if (subscriptionError) {
            console.error("Subscription check error:", subscriptionError);
            setSession(false);
            localStorage.removeItem('supabase.auth.token');
            return;
          }

          if (!subscription?.is_active) {
            // Sign out if account is inactive
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

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        // Check subscription status on auth state change
        const { data: subscription, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('is_active, status')
          .eq('user_id', session.user.id)
          .single();

        if (subscriptionError || !subscription?.is_active) {
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

  // Show loading state
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  // Redirect to login if no session
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;