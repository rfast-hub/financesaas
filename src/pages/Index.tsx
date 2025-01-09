import MarketStats from "@/components/MarketStats";
import CryptoChart from "@/components/CryptoChart";
import CryptoList from "@/components/CryptoList";
import CryptoChatbot from "@/components/CryptoChatbot";
import PriceAlerts from "@/components/PriceAlerts";
import MarketSentiment from "@/components/MarketSentiment";
import AIInsights from "@/components/AIInsights";
import SubscriptionManagement from "@/components/SubscriptionManagement";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
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
        
        <Suspense fallback={<Skeleton className="h-32" />}>
          <MarketStats />
        </Suspense>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Suspense fallback={<Skeleton className="h-96" />}>
              <CryptoChart />
            </Suspense>
          </div>
          <div>
            <Suspense fallback={<Skeleton className="h-96" />}>
              <CryptoList />
            </Suspense>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Suspense fallback={<Skeleton className="h-96" />}>
            <MarketSentiment />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-96" />}>
            <AIInsights />
          </Suspense>
        </div>

        <Suspense fallback={<Skeleton className="h-64" />}>
          <PriceAlerts />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-64" />}>
          <SubscriptionManagement />
        </Suspense>

        <div className="mt-8">
          <Suspense fallback={<Skeleton className="h-96" />}>
            <CryptoChatbot />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default Index;