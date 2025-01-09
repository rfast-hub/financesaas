import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertForm } from "./price-alerts/AlertForm";
import { AlertList } from "./price-alerts/AlertList";

const PriceAlerts = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    console.log('PriceAlerts component mounted');
    // Get current user's ID
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        console.log('User ID set:', user.id);
        setUserId(user.id);
      }
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUserId = session?.user?.id || null;
      console.log('Auth state changed, new user ID:', newUserId);
      setUserId(newUserId);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch existing alerts with proper user filtering
  const { data: alerts, refetch } = useQuery({
    queryKey: ["price-alerts", userId],
    queryFn: async () => {
      console.log('Fetching price alerts for user:', userId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("price_alerts")
        .select("*")
        .eq('user_id', user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Error fetching alerts:', error);
        throw error;
      }

      console.log('Alerts fetched successfully:', data);
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true,
  });

  console.log('PriceAlerts render state:', { userId, alertsCount: alerts?.length });

  if (!userId) {
    console.log('No user ID available, not rendering PriceAlerts');
    return null;
  }

  return (
    <div className="glass-card rounded-lg p-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-6">Price Alerts</h2>
      <AlertForm onSuccess={refetch} />
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Your Alerts</h3>
        <AlertList alerts={alerts} onDelete={refetch} />
      </div>
    </div>
  );
};

export default PriceAlerts;