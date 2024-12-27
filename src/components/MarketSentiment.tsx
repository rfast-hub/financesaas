import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import SentimentScore from "./sentiment/SentimentScore";
import NewsSection from "./sentiment/NewsSection";

const fetchMarketSentiment = async () => {
  const { data, error } = await supabase.functions.invoke('crypto-proxy', {
    body: {
      endpoint: '/coins/bitcoin?localization=false&tickers=false&community_data=true&developer_data=false&sparkline=false'
    }
  });
  
  if (error) throw error;
  return {
    sentiment_votes_up_percentage: data.sentiment_votes_up_percentage,
    sentiment_votes_down_percentage: data.sentiment_votes_down_percentage,
  };
};

const MarketSentiment = () => {
  const { data: sentimentData, isLoading } = useQuery({
    queryKey: ['marketSentiment'],
    queryFn: fetchMarketSentiment,
    refetchInterval: 300000,
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
        <SentimentScore 
          upPercentage={sentimentData?.sentiment_votes_up_percentage}
          downPercentage={sentimentData?.sentiment_votes_down_percentage}
        />
        <NewsSection />
      </div>
    </Card>
  );
};

export default MarketSentiment;