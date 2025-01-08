import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Subscription } from "@/types/subscription";

interface CancelSubscriptionButtonProps {
  subscription: Subscription | null;
  isTrial: boolean;
  onCancel: () => void;
}

const CancelSubscriptionButton = ({ subscription, isTrial, onCancel }: CancelSubscriptionButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // First clear local storage
      localStorage.removeItem('supabase.auth.token');
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
      }
      
      // Always navigate to login, even if there was an error
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, redirect to login
      navigate("/login");
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsLoading(true);
      console.log('Starting subscription cancellation process...');

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.log('No valid session found, redirecting to login...');
        toast({
          variant: "destructive",
          title: "Session expired",
          description: "Please log in again to continue.",
        });
        await handleLogout();
        return;
      }

      console.log('Calling cancel-subscription function...');
      const { data, error: cancelError } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscription_id: subscription?.subscription_id }
      });

      if (cancelError) {
        console.error('Cancellation error:', cancelError);
        throw new Error(cancelError.message || 'Failed to cancel subscription');
      }

      if (!data?.success) {
        console.error('Cancellation failed:', data?.message);
        throw new Error(data?.message || 'Failed to cancel subscription');
      }

      console.log('Subscription cancelled successfully');
      onCancel();

      toast({
        title: "Subscription cancelled",
        description: isTrial ? 
          "Your trial has been cancelled. You'll be logged out now." :
          "Your subscription has been cancelled. You'll have access until the end of your current period.",
      });

      // If it's a trial, log the user out
      if (isTrial) {
        await handleLogout();
      }

    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel subscription. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleCancelSubscription}
      disabled={isLoading}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Cancel {isTrial ? 'Trial' : 'Subscription'}
    </Button>
  );
};

export default CancelSubscriptionButton;