import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

const PriceAlerts = () => {
  const { toast } = useToast();
  const [cryptocurrency, setCryptocurrency] = useState("BTC");
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState("above");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user's ID
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
      }
    });
  }, []);

  // Fetch existing alerts
  const { data: alerts, refetch } = useQuery({
    queryKey: ["price-alerts", userId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("price_alerts")
        .select("*")
        .eq('user_id', user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId, // Only run query when userId is available
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create price alerts",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("price_alerts").insert({
        cryptocurrency,
        target_price: parseFloat(targetPrice),
        condition,
        user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Price alert created successfully!",
      });

      // Reset form and refetch alerts
      setTargetPrice("");
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from("price_alerts")
        .delete()
        .match({ id });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Alert deleted successfully!",
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="glass-card rounded-lg p-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-6">Price Alerts</h2>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cryptocurrency">Cryptocurrency</Label>
            <Select
              value={cryptocurrency}
              onValueChange={setCryptocurrency}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cryptocurrency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                <SelectItem value="USDT">Tether (USDT)</SelectItem>
                <SelectItem value="BNB">Binance Coin (BNB)</SelectItem>
                <SelectItem value="SOL">Solana (SOL)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select
              value={condition}
              onValueChange={setCondition}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above">Price goes above</SelectItem>
                <SelectItem value="below">Price goes below</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetPrice">Target Price (USD)</Label>
            <Input
              id="targetPrice"
              type="number"
              step="0.01"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="Enter target price"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full">
          Create Alert
        </Button>
      </form>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Your Alerts</h3>
        {alerts?.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No alerts set. Create one above!
          </p>
        ) : (
          <div className="space-y-2">
            {alerts?.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div>
                  <p className="font-medium">{alert.cryptocurrency}</p>
                  <p className="text-sm text-muted-foreground">
                    {alert.condition} ${alert.target_price}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteAlert(alert.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceAlerts;