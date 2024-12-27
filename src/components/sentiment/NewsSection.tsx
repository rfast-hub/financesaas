import { ScrollArea } from "@/components/ui/scroll-area";
import { Newspaper } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface NewsItem {
  title: string;
  url: string;
  time_published: string;
  authors: string[];
  summary: string;
}

const fetchCryptoNews = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('crypto-proxy', {
      body: {
        endpoint: '/news'
      }
    });
    
    if (error) {
      console.error('Error fetching news:', error);
      throw error;
    }

    if (!data || !Array.isArray(data)) {
      console.error('Invalid news data format:', data);
      throw new Error('Invalid news data format');
    }

    return data;
  } catch (error) {
    console.error('Error fetching crypto news:', error);
    throw error;
  }
};

const NewsSection = () => {
  const { data: newsData, isLoading, error } = useQuery({
    queryKey: ['cryptoNews'],
    queryFn: fetchCryptoNews,
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (error) {
    console.error('News fetch error:', error);
  }

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
        ) : newsData && newsData.length > 0 ? (
          <div className="space-y-4">
            {newsData.map((news: NewsItem, index: number) => (
              <div key={index} className="border-b border-border pb-3 last:border-0">
                <a 
                  href={news.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  <p className="text-sm font-medium">{news.title}</p>
                </a>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(news.time_published).toLocaleDateString()} by {news.authors?.[0] || 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {news.summary}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            No news available at the moment
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NewsSection;