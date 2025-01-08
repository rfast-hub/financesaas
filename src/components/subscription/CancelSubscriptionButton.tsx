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
  onCancel: () => Promise<void>;
}

const CancelSubscriptionButton = ({ subscription, isTrial, onCancel }: CancelSubscriptionButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCancelSubscription = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please log in again to continue.",
        });
        navigate('/login');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Authentication error. Please log in again.",
        });
        navigate('/login');
        return;
      }

      // Call the cancel-subscription edge function
      const { error: cancelError } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscription_id: subscription?.subscription_id }
      });

      if (cancelError) {
        throw cancelError;
      }

      await onCancel();

      toast({
        title: "Subscription cancelled",
        description: subscription?.subscription_id ? 
          "Your subscription has been cancelled. You'll have access until the end of your current period." :
          "Your trial has been cancelled.",
      });

    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel subscription. Please try again later.",
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