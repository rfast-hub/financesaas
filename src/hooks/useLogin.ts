import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateEmail, validatePassword } from "@/utils/validation";
import { checkSubscriptionStatus } from "@/utils/subscriptionUtils";

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        let errorMessage = "Invalid credentials. Please try again.";
        
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please check your credentials.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please verify your email address before signing in.";
        }
        
        toast({
          variant: "destructive",
          title: "Login failed",
          description: errorMessage,
        });
        console.error("Login error details:", error);
        return;
      }

      if (data.session) {
        const isActive = await checkSubscriptionStatus(data.session.user.id);

        if (!isActive) {
          await supabase.auth.signOut();
          toast({
            variant: "destructive",
            title: "Account inactive",
            description: "Your account is currently inactive. Please subscribe to reactivate your account.",
          });
          return;
        }

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
        description: error.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, loading };
};