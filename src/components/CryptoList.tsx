import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const fetchCryptoData = async () => {
  try {
    console.log('Fetching crypto data...');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No active session found');
      return null;
    }

    const { data, error } = await supabase.functions.invoke('crypto-proxy', {
      body: {
        endpoint: '/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1&sparkline=false'
      }
    });
    
    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    console.log('Crypto data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    throw error;
  }
};

const CryptoList = () => {
  const { toast } = useToast();

  const { data: cryptos, isLoading, error } = useQuery({
    queryKey: ['cryptos'],
    queryFn: fetchCryptoData,
    refetchInterval: 30000,
    meta: {
      onError: (error: Error) => {
        console.error('Query error:', error);
        toast({
          title: "Error",
          description: "Failed to fetch cryptocurrency data. Please try again later.",
          variant: "destructive",
        });
      },
    },
    enabled: true // Always enabled as we check session inside fetchCryptoData
  });

  console.log('CryptoList render state:', { isLoading, error, dataLength: cryptos?.length });

  if (isLoading) {
    return (
      <div className="glass-card rounded-lg p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-6">Top Cryptocurrencies</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-4 border-t border-secondary animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-secondary/50 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-secondary/50 rounded"></div>
                  <div className="h-3 w-16 bg-secondary/50 rounded"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-secondary/50 rounded"></div>
                <div className="h-3 w-16 bg-secondary/50 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Rendering error state:', error);
    return (
      <div className="glass-card rounded-lg p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-6">Top Cryptocurrencies</h2>
        <div className="text-center py-8 text-muted-foreground">
          Unable to load cryptocurrency data.
          <br />
          Please try again later.
        </div>
      </div>
    );
  }

  if (!cryptos || cryptos.length === 0) {
    console.log('No crypto data available');
    return (
      <div className="glass-card rounded-lg p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-6">Top Cryptocurrencies</h2>
        <div className="text-center py-8 text-muted-foreground">
          No cryptocurrency data available.
          <br />
          Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-lg p-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-6">Top Cryptocurrencies</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-muted-foreground">
              <th className="pb-4">Name</th>
              <th className="pb-4">Price</th>
              <th className="pb-4">24h Change</th>
              <th className="pb-4">Volume</th>
            </tr>
          </thead>
          <tbody>
            {cryptos.map((crypto) => (
              <tr key={crypto.symbol} className="border-t border-secondary hover:bg-secondary/20 transition-colors">
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <img src={crypto.image} alt={crypto.name} className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="font-medium">{crypto.name}</p>
                      <p className="text-sm text-muted-foreground">{crypto.symbol.toUpperCase()}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4">${crypto.current_price.toLocaleString()}</td>
                <td className="py-4">
                  <span
                    className={`flex items-center gap-1 ${
                      crypto.price_change_percentage_24h >= 0 ? "text-success" : "text-warning"
                    }`}
                  >
                    {crypto.price_change_percentage_24h >= 0 ? (
                      <ArrowUpIcon className="w-3 h-3" />
                    ) : (
                      <ArrowDownIcon className="w-3 h-3" />
                    )}
                    {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                  </span>
                </td>
                <td className="py-4">${(crypto.total_volume / 1e9).toFixed(1)}B</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CryptoList;