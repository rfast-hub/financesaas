import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const fetchMarketSentiment = async () => {
  const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&community_data=true&developer_data=false&sparkline=false');
  if (!response.ok) {
    throw new Error('Failed to fetch market sentiment');
  }
  const data = await response.json();
  
  return {
    sentiment_votes_up_percentage: data.sentiment_votes_up_percentage,
    sentiment_votes_down_percentage: data.sentiment_votes_down_percentage,
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
      </div>
    </Card>
  );
};

export default MarketSentiment;