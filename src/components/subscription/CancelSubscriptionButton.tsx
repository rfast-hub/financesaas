import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Subscription } from "@/types/subscription";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CancelSubscriptionButtonProps {
  subscription: Subscription | null;
  isTrial: boolean;
  onCancel: () => void;
}

const CancelSubscriptionButton = ({ subscription, isTrial, onCancel }: CancelSubscriptionButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // First, remove all session data from localStorage
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('supabase.auth.')) {
          localStorage.removeItem(key);
        }
      }
      
      // Then attempt to sign out from Supabase
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Supabase signOut error:", error);
        }
      } catch (signOutError) {
        console.error("Error during signOut:", signOutError);
      }

      // Force clear the session
      await supabase.auth.setSession(null);
      
      // Always navigate to login
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, clear session and redirect
      navigate("/login");
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsLoading(true);
      console.log('Starting subscription cancellation process...');

      // Verify password first
      const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: password
      });

      if (authError) {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: "Incorrect password. Please try again.",
        });
        return;
      }

      if (!session) {
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
      setIsDialogOpen(false);

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
    <>
      <Button
        variant="destructive"
        onClick={() => setIsDialogOpen(true)}
        disabled={isLoading}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Cancel {isTrial ? 'Trial' : 'Subscription'}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
            <DialogDescription>
              Please enter your password to confirm subscription cancellation.
              {!isTrial && " Your subscription will be cancelled at the end of the current billing period."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={isLoading || !password}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CancelSubscriptionButton;