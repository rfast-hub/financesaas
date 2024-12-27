import { ScrollArea } from "@/components/ui/scroll-area";
import { Newspaper } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface NewsItem {
  id: string;
  title: string;
  published_at: string;
}

const fetchCryptoNews = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('crypto-proxy', {
      body: {
        endpoint: '/news'
      }
    });
    
    if (error) throw error;
    return data?.slice(0, 5) || [];
  } catch (error) {
    console.error('Error fetching crypto news:', error);
    throw error;
  }
};

const NewsSection = () => {
  const { data: newsData, isLoading } = useQuery({
    queryKey: ['cryptoNews'],
    queryFn: fetchCryptoNews,
    refetchInterval: 300000,
  });

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Latest Crypto News</h3>
      </div>
      
      <ScrollArea className="h-[200px]">
        {isLoading ? (
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
            {newsData?.map((news: NewsItem) => (
              <div key={news.id} className="border-b border-border pb-3 last:border-0">
                <p className="text-sm font-medium">{news.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(news.published_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NewsSection;