import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

const SubscriptionManagement = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { data: subscription, isLoading: isLoadingSubscription, error, refetch } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      console.log('Fetching subscription data...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found, redirecting to login...');
        navigate('/login');
        return null;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found, redirecting to login...');
        navigate('/login');
        return null;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Subscription fetch error:', error);
        if (error.code === 'PGRST301' || error.message.includes('JWT')) {
          navigate('/login');
          return null;
        }
        throw error;
      }
      
      console.log('Subscription data:', data);
      return data;
    },
    retry: 1,
  });

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

      await refetch();

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

  if (error) {
    console.error('Subscription query error:', error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Subscription</CardTitle>
          <CardDescription>Failed to load subscription details. Please try again later.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoadingSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Loading subscription details...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isTrial = subscription?.status === 'active' && !subscription?.subscription_id;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
        <CardDescription>Manage your current subscription</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">
              Status: <span className="capitalize">{isTrial ? 'Trial' : subscription?.status || 'No subscription'}</span>
            </p>
            {subscription?.current_period_end && (
              <p className="text-sm text-muted-foreground">
                {isTrial ? 'Trial ends' : subscription.status === 'active' ? 'Subscription ends' : 'Ended'}: {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            )}
            {isTrial && (
              <p className="text-sm text-muted-foreground mt-2">
                You're currently on a trial period. You can cancel anytime.
              </p>
            )}
          </div>
          {subscription?.status === 'active' && (
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel {isTrial ? 'Trial' : 'Subscription'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionManagement;