import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import SubscriptionStatus from "./subscription/SubscriptionStatus";
import CancelSubscriptionButton from "./subscription/CancelSubscriptionButton";

const SubscriptionManagement = () => {
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

  if (error) {
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

  const handleCancel = () => {
    refetch();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
        <CardDescription>Manage your current subscription</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <SubscriptionStatus 
            subscription={subscription} 
            isTrial={isTrial} 
          />
          {subscription?.status === 'active' && (
            <CancelSubscriptionButton 
              subscription={subscription}
              isTrial={isTrial}
              onCancel={handleCancel}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionManagement;