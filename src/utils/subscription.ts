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
  const response = await fetch('/api/cancel-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      subscription_id: subscriptionId,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to cancel subscription. Please try again later.");
  }

  // Update subscription status and deactivate account
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      is_active: false
    })
    .eq('user_id', session.user.id);

  if (updateError) {
    console.error('Error updating subscription:', updateError);
    throw new Error("Failed to update subscription status.");
  }

  // Sign out the user immediately after cancellation
  await supabase.auth.signOut();

  console.log('Subscription cancelled and account deactivated successfully');
};