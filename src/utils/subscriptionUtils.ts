import { supabase } from "@/integrations/supabase/client";

export const checkSubscriptionStatus = async (userId: string) => {
  const { data: subscription, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select('is_active, status')
    .eq('user_id', userId)
    .single();

  if (subscriptionError) {
    console.error("Subscription check error:", subscriptionError);
    return false;
  }

  return subscription?.is_active ?? false;
};