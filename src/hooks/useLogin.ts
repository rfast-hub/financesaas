import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateEmail, validatePassword } from "@/utils/validation";
import { handleSubscriptionCheck } from "@/utils/subscriptionUtils";
import { getLoginErrorMessage } from "@/utils/loginErrors";
import { AuthError } from "@supabase/supabase-js";

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateInputs = (email: string, password: string): boolean => {
    if (!validateEmail(email)) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address.",
      });
      return false;
    }

    if (!validatePassword(password)) {
      toast({
        variant: "destructive",
        title: "Invalid password",
        description: "Password must be at least 8 characters long.",
      });
      return false;
    }

    return true;
  };

  const handleLogin = async (email: string, password: string) => {
    if (!validateInputs(email, password)) {
      return;
    }

    setLoading(true);
    
    try {
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        const errorDetails = getLoginErrorMessage(error.message);
        toast({
          variant: "destructive",
          title: errorDetails.title,
          description: errorDetails.message,
        });
        console.error("Login error:", error.message);
        return;
      }

      if (session) {
        try {
          const isActive = await handleSubscriptionCheck(session.user.id);

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
        } catch (subscriptionError) {
          console.error("Subscription check error:", subscriptionError);
          toast({
            variant: "destructive",
            title: "Login error",
            description: "There was an error checking your subscription status. Please try again.",
          });
          await supabase.auth.signOut();
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, loading };
};