import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";

const fetchMarketSentiment = async () => {
  const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&community_data=true&developer_data=false&sparkline=false');
  if (!response.ok) {
    throw new Error('Failed to fetch market sentiment');
  }
  const data = await response.json();
  
  return {
    sentiment_votes_up_percentage: data.sentiment_votes_up_percentage,
    sentiment_votes_down_percentage: data.sentiment_votes_down_percentage,
    market_cap_change_24h: data.market_cap_change_percentage_24h,
    price_change_24h: data.price_change_percentage_24h,
  };
};

const MarketSentiment = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['marketSentiment'],
    queryFn: fetchMarketSentiment,
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Market Sentiment</h2>
        <div className="space-y-4">
          <div className="h-4 bg-secondary/50 rounded w-full animate-pulse" />
          <div className="h-4 bg-secondary/50 rounded w-3/4 animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Market Sentiment</h2>
      
      <div className="space-y-6">
        {/* Sentiment Score */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Bullish</span>
            <span className="text-sm text-muted-foreground">Bearish</span>
          </div>
          <Progress value={data?.sentiment_votes_up_percentage} className="h-2" />
          <div className="flex justify-between mt-1">
            <span className="text-sm font-medium">{data?.sentiment_votes_up_percentage}%</span>
            <span className="text-sm font-medium">{data?.sentiment_votes_down_percentage}%</span>
          </div>
        </div>

        {/* 24h Changes */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-secondary/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price 24h</span>
              {data?.price_change_24h >= 0 ? (
                <ArrowUpIcon className="w-4 h-4 text-success" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 text-warning" />
              )}
            </div>
            <p className={`text-lg font-semibold ${data?.price_change_24h >= 0 ? 'text-success' : 'text-warning'}`}>
              {data?.price_change_24h?.toFixed(2)}%
            </p>
          </div>

          <div className="p-4 rounded-lg bg-secondary/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Market Cap 24h</span>
              {data?.market_cap_change_24h >= 0 ? (
                <TrendingUpIcon className="w-4 h-4 text-success" />
              ) : (
                <TrendingDownIcon className="w-4 h-4 text-warning" />
              )}
            </div>
            <p className={`text-lg font-semibold ${data?.market_cap_change_24h >= 0 ? 'text-success' : 'text-warning'}`}>
              {data?.market_cap_change_24h?.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MarketSentiment;