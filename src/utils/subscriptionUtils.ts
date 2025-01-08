import { supabase } from "@/integrations/supabase/client";
import { signOut } from "./authUtils";

export const handleSubscriptionCheck = async (userId: string): Promise<boolean> => {
  try {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("is_active, status")
      .eq("user_id", userId)
      .single();

    const isActive = subscription?.is_active && subscription?.status === "active";
    
    if (!isActive) {
      await signOut();
    }

    return isActive;
  } catch (error) {
    console.error("Subscription check error:", error);
    return false;
  }
};