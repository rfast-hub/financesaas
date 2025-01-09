import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { handleSubscriptionCheck } from "@/utils/subscriptionUtils";
import { getLoginErrorMessage } from "@/utils/loginErrors";
import { validateLoginInputs } from "@/utils/loginValidation";

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (email: string, password: string) => {
    const validationResult = validateLoginInputs(email, password);
    
    if (!validationResult.isValid && validationResult.error) {
      toast({
        variant: "destructive",
        title: validationResult.error.title,
        description: validationResult.error.description,
      });
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

          toast({
            title: "Welcome back!",
            description: "Successfully logged in.",
          });

          // Ensure navigation happens after successful login
          navigate("/dashboard", { replace: true });
          
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