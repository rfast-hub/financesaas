import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const SubscriptionManagement = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { data: subscription, isLoading: isLoadingSubscription, error } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      console.log('Fetching subscription data...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Subscription fetch error:', error);
        throw error;
      }
      
      console.log('Subscription data:', data);
      return data;
    },
  });

  const handleCancelSubscription = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been successfully cancelled.",
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

  if (!subscription) {
    console.log('No subscription found');
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>You currently don't have an active subscription.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
        <CardDescription>Manage your current subscription</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Status: <span className="capitalize">{subscription.status}</span></p>
            {subscription.current_period_end && (
              <p className="text-sm text-muted-foreground">
                Current period ends: {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            )}
          </div>
          {subscription.status === 'active' && (
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Subscription
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionManagement;