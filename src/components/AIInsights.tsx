import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Brain, TrendingUp, ShieldAlert, LineChart } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AIResponse {
  content: string;
}

const AIInsights = () => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("prediction");

  const { data: insights, isLoading, error } = useQuery({
    queryKey: ['aiInsights', selectedTab],
    queryFn: async () => {
      try {
        console.log('Fetching AI insights for:', selectedTab);
        const { data, error } = await supabase.functions.invoke('ai-insights', {
          body: { analysisType: selectedTab },
        });

        if (error) {
          console.error('Supabase function error:', error);
          throw new Error(error.message || 'Failed to fetch AI insights');
        }

        return data as AIResponse;
      } catch (error: any) {
        console.error('Error in AI insights query:', error);
        
        // Check if it's a network error
        if (error.message === 'Failed to fetch') {
          throw new Error('Network error. Please check your connection and try again.');
        }
        
        // Check if it's a rate limit error
        if (error.status === 429) {
          throw new Error('Too many requests. Please try again in a few minutes.');
        }
        
        throw error;
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry on rate limits
      if (error?.status === 429) return false;
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * (2 ** attemptIndex), 30000),
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch AI insights. Please try again later.",
          variant: "destructive",
        });
      },
    },
  });

  const renderContent = (content: string | undefined) => {
    if (isLoading) {
      return <div className="animate-pulse space-y-4">
        <div className="h-4 bg-secondary/50 rounded w-3/4"></div>
        <div className="h-4 bg-secondary/50 rounded w-1/2"></div>
        <div className="h-4 bg-secondary/50 rounded w-2/3"></div>
      </div>;
    }

    if (error) {
      return <div className="text-destructive flex items-center justify-center p-4">
        <p className="text-center">{error.message || 'Failed to load insights. Please try again later.'}</p>
      </div>;
    }

    return <div className="whitespace-pre-wrap">{content}</div>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Market Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="prediction" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Price Prediction
            </TabsTrigger>
            <TabsTrigger value="strategy" className="flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              Trading Strategy
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Risk Assessment
            </TabsTrigger>
            <TabsTrigger value="trend" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Market Trends
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 p-4 bg-secondary/10 rounded-lg">
            <TabsContent value="prediction">
              {renderContent(insights?.content)}
            </TabsContent>
            <TabsContent value="strategy">
              {renderContent(insights?.content)}
            </TabsContent>
            <TabsContent value="risk">
              {renderContent(insights?.content)}
            </TabsContent>
            <TabsContent value="trend">
              {renderContent(insights?.content)}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AIInsights;