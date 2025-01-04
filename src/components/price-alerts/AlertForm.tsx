import { useState } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AlertFormProps {
  onSuccess: () => void;
}

export const AlertForm = ({ onSuccess }: AlertFormProps) => {
  const { toast } = useToast();
  const [cryptocurrency, setCryptocurrency] = useState("BTC");
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState("above");

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

      setTargetPrice("");
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
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
  );
};