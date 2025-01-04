import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertForm } from "./price-alerts/AlertForm";
import { AlertList } from "./price-alerts/AlertList";

const PriceAlerts = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user's ID
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
      }
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch existing alerts with proper user filtering
  const { data: alerts, refetch } = useQuery({
    queryKey: ["price-alerts", userId], // Include userId in the query key for proper caching
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("price_alerts")
        .select("*")
        .eq('user_id', user.id) // Ensure we only get alerts for the current user
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId, // Only run query when userId is available
    staleTime: 1000 * 60, // Cache for 1 minute
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  if (!userId) {
    return null; // Don't render anything until we have the user ID
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