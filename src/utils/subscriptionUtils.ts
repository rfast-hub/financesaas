import { supabase } from "@/integrations/supabase/client";

export const handleSubscriptionCheck = async (userId: string): Promise<boolean> => {
  try {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("is_active, status, current_period_end")
      .eq("user_id", userId)
      .single();

    // If subscription is canceled but still within the paid period
    if (subscription?.status === 'canceled' && subscription?.current_period_end) {
      const periodEnd = new Date(subscription.current_period_end);
      const now = new Date();
      return now < periodEnd;
    }

    // For active subscriptions or trials
    return subscription?.is_active && subscription?.status === "active";
  } catch (error) {
    console.error("Subscription check error:", error);
    return false;
  }
};