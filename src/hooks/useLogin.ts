import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateEmail, validatePassword } from "@/utils/validation";

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (email: string, password: string) => {
    if (!validateEmail(email)) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    if (!validatePassword(password)) {
      toast({
        variant: "destructive",
        title: "Invalid password",
        description: "Password must be at least 8 characters long.",
      });
      return;
    }

    setLoading(true);
    
    try {
      // First, ensure any existing session is cleared
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
      
      // Attempt to sign in
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: error.message || "Invalid credentials. Please try again.",
        });
        return;
      }

      if (session) {
        // Store session data
        localStorage.setItem('supabase.auth.token', session.access_token);
        
        // Set session with the tokens from the successful login
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });

        // Navigate to home page
        navigate("/");
        
        toast({
          title: "Welcome back!",
          description: "Successfully logged in.",
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, loading };
};