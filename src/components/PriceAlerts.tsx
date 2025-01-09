import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertForm } from "./price-alerts/AlertForm";
import { AlertList } from "./price-alerts/AlertList";
import { useToast } from "@/components/ui/use-toast";

const PriceAlerts = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log('PriceAlerts component mounted');
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('User ID set:', session.user.id);
        setUserId(session.user.id);
      } else {
        console.log('No active session found');
      }
    };
    
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUserId = session?.user?.id || null;
      console.log('Auth state changed, new user ID:', newUserId);
      setUserId(newUserId);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const { data: alerts, refetch, isLoading, error } = useQuery({
    queryKey: ["price-alerts", userId],
    queryFn: async () => {
      console.log('Fetching price alerts for user:', userId);
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from("price_alerts")
        .select("*")
        .eq('user_id', userId)
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
    meta: {
      onError: (error: Error) => {
        console.error('Query error:', error);
        toast({
          title: "Error",
          description: "Failed to fetch price alerts. Please try again later.",
          variant: "destructive",
        });
      },
    },
  });

  if (isLoading) {
    return (
      <div className="glass-card rounded-lg p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-6">Price Alerts</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-secondary/50 rounded w-full" />
          <div className="h-32 bg-secondary/50 rounded w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-lg p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-6">Price Alerts</h2>
        <div className="text-destructive text-center py-4">
          Failed to load price alerts. Please try again later.
        </div>
      </div>
    );
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