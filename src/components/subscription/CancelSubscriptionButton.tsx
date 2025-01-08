import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Subscription } from "@/types/subscription";
import { cancelSubscription } from "@/utils/subscription";
import CancelSubscriptionDialog from "./CancelSubscriptionDialog";

interface CancelSubscriptionButtonProps {
  subscription: Subscription | null;
  isTrial: boolean;
  onCancel: () => void;
}

const CancelSubscriptionButton = ({ subscription, isTrial, onCancel }: CancelSubscriptionButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCancelSubscription = async (password: string) => {
    try {
      setIsLoading(true);
      await cancelSubscription(subscription?.subscription_id || null, password, isTrial);
      
      onCancel();
      setIsDialogOpen(false);

      toast({
        title: "Subscription cancelled",
        description: isTrial 
          ? "Your trial has been cancelled." 
          : `Your subscription will remain active until ${new Date(subscription?.current_period_end || '').toLocaleDateString()}`,
      });
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      
      if (error.message.includes("No valid session")) {
        navigate("/login");
      }
      
      toast({
        variant: "destructive",
        title: "Cancellation failed",
        description: error.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setIsDialogOpen(true)}
        disabled={isLoading}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Cancel {isTrial ? 'Trial' : 'Subscription'}
      </Button>

      <CancelSubscriptionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleCancelSubscription}
        isLoading={isLoading}
        isTrial={isTrial}
      />
    </>
  );
};

export default CancelSubscriptionButton;