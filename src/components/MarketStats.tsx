import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const fetchGlobalData = async () => {
  const response = await fetch('https://api.coingecko.com/api/v3/global');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

const MarketStats = () => {
  const { data: globalData, isLoading } = useQuery({
    queryKey: ['globalMarketData'],
    queryFn: fetchGlobalData,
    refetchInterval: 60000, // Refetch every minute
  });

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(1)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    return `$${num.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-6 rounded-lg">
            <div className="h-4 bg-secondary/50 rounded w-24 mb-4"></div>
            <div className="h-8 bg-secondary/50 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  const data = globalData?.data || {};
  const marketCap = data.total_market_cap?.usd || 0;
  const volume = data.total_volume?.usd || 0;
  const btcDominance = data.market_cap_percentage?.btc || 0;
  
  const marketCapChange = data.market_cap_change_percentage_24h_usd || 0;
  const volumeChange = ((volume / marketCap) * 100) - 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
      <div className="glass-card p-6 rounded-lg hover:scale-[1.02] transition-transform">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Market Cap</h3>
          <TrendingUpIcon className={`w-4 h-4 ${marketCapChange >= 0 ? 'text-success' : 'text-warning'}`} />
        </div>
        <p className="text-2xl font-semibold mt-2">{formatNumber(marketCap)}</p>
        <span className={`text-sm flex items-center gap-1 ${marketCapChange >= 0 ? 'text-success' : 'text-warning'}`}>
          {marketCapChange >= 0 ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
          {Math.abs(marketCapChange).toFixed(2)}%
        </span>
      </div>
      
      <div className="glass-card p-6 rounded-lg hover:scale-[1.02] transition-transform">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">24h Volume</h3>
          <TrendingUpIcon className={`w-4 h-4 ${volumeChange >= 0 ? 'text-success' : 'text-warning'}`} />
        </div>
        <p className="text-2xl font-semibold mt-2">{formatNumber(volume)}</p>
        <span className={`text-sm flex items-center gap-1 ${volumeChange >= 0 ? 'text-success' : 'text-warning'}`}>
          {volumeChange >= 0 ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
          {Math.abs(volumeChange).toFixed(2)}%
        </span>
      </div>
      
      <div className="glass-card p-6 rounded-lg hover:scale-[1.02] transition-transform">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">BTC Dominance</h3>
          <TrendingUpIcon className="w-4 h-4 text-primary" />
        </div>
        <p className="text-2xl font-semibold mt-2">{btcDominance.toFixed(1)}%</p>
        <span className="text-sm text-muted-foreground">
          of total market cap
        </span>
      </div>
    </div>
  );
};

export default MarketStats;