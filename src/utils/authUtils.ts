import { supabase } from "@/integrations/supabase/client";

export const checkAuthSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const signOut = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem('supabase.auth.token');
};

export const deleteUserData = async (userId: string) => {
  // Delete price alerts
  const { error: alertsError } = await supabase
    .from('price_alerts')
    .delete()
    .eq('user_id', userId);

  if (alertsError) {
    console.error("Error deleting price alerts:", alertsError);
  }

  // Delete subscription
  const { error: subscriptionDeleteError } = await supabase
    .from('subscriptions')
    .delete()
    .eq('user_id', userId);

  if (subscriptionDeleteError) {
    console.error("Error deleting subscription:", subscriptionDeleteError);
  }
};

type DeleteUserFunctionResponse = {
  message: string;
};

export const deleteUserAccount = async (userId: string) => {
  const { data, error: userError } = await supabase.functions.invoke<DeleteUserFunctionResponse>('delete-user', {
    body: { user_id: userId }
  });

  if (userError) {
    console.error("Error deleting user:", userError);
    throw new Error("Failed to delete user account");
  }

  return data;
};