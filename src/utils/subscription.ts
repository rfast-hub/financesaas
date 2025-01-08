import { supabase } from "@/integrations/supabase/client";

export const cancelSubscription = async (
  subscriptionId: string | null,
  password: string,
  isTrial: boolean
) => {
  console.log('Starting subscription cancellation process...');

  // Verify password first
  const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
    email: (await supabase.auth.getUser()).data.user?.email || '',
    password: password
  });

  if (authError) {
    throw new Error("Incorrect password. Please try again.");
  }

  if (!session) {
    throw new Error("No valid session found. Please log in again.");
  }

  if (!isTrial && !subscriptionId) {
    throw new Error("No subscription found to cancel.");
  }

  // Call the edge function to cancel the subscription
  const { data, error } = await supabase.functions.invoke('cancel-subscription', {
    body: {
      subscription_id: subscriptionId,
    },
  });

  if (error) {
    console.error('Error cancelling subscription:', error);
    throw new Error("Failed to cancel subscription. Please try again later.");
  }

  // Sign out the user immediately after cancellation
  await supabase.auth.signOut();

  console.log('Subscription cancelled and account deactivated successfully');
};