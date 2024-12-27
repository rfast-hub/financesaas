import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Newspaper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

const fetchCryptoNews = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('crypto-proxy', {
      body: {
        endpoint: '/status_updates'
      }
    });
    
    if (error) throw error;
    return data.status_updates.slice(0, 5); // Get latest 5 news items
  } catch (error) {
    console.error('Error fetching crypto news:', error);
    throw error;
  }
};

const MarketSentiment = () => {
  const { data: sentimentData, isLoading: isSentimentLoading } = useQuery({
    queryKey: ['marketSentiment'],
    queryFn: fetchMarketSentiment,
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const { data: newsData, isLoading: isNewsLoading } = useQuery({
    queryKey: ['cryptoNews'],
    queryFn: fetchCryptoNews,
    refetchInterval: 300000,
  });

  if (isSentimentLoading) {
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
          <Progress value={sentimentData?.sentiment_votes_up_percentage} className="h-2" />
          <div className="flex justify-between mt-1">
            <span className="text-sm font-medium">{sentimentData?.sentiment_votes_up_percentage}%</span>
            <span className="text-sm font-medium">{sentimentData?.sentiment_votes_down_percentage}%</span>
          </div>
        </div>

        {/* News Section */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Latest Crypto News</h3>
          </div>
          
          <ScrollArea className="h-[200px]">
            {isNewsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-secondary/50 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-secondary/50 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {newsData?.map((news: any) => (
                  <div key={news.id} className="border-b border-border pb-3 last:border-0">
                    <p className="text-sm font-medium">{news.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(news.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </Card>
  );
};

export default MarketSentiment;
