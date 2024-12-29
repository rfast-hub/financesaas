import MarketStats from "@/components/MarketStats";
import CryptoChart from "@/components/CryptoChart";
import CryptoList from "@/components/CryptoList";
import CryptoChatbot from "@/components/CryptoChatbot";
import PriceAlerts from "@/components/PriceAlerts";
import MarketSentiment from "@/components/MarketSentiment";
import AIInsights from "@/components/AIInsights";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="mb-8 animate-fade-in flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Crypto Dashboard
            </h1>
            <p className="text-muted-foreground">
              Real-time cryptocurrency market overview
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </header>
        
        <MarketStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CryptoChart />
          </div>
          <div>
            <CryptoList />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <MarketSentiment />
          <AIInsights />
        </div>

        <PriceAlerts />

        <div className="mt-8">
          <CryptoChatbot />
        </div>
      </div>
    </div>
  );
};

export default Index;