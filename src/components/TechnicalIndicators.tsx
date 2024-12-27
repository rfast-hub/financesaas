import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

const fetchTechnicalData = async () => {
  const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=daily');
  if (!response.ok) {
    throw new Error('Failed to fetch technical data');
  }
  const data = await response.json();
  
  // Calculate RSI, MACD, and Moving Averages from price data
  const prices = data.prices.map(([timestamp, price]: [number, number]) => ({
    date: new Date(timestamp).toLocaleDateString(),
    price,
  }));

  // Calculate 14-day RSI
  const rsiPeriod = 14;
  const rsi = calculateRSI(prices.map(p => p.price), rsiPeriod);

  // Calculate MACD (12, 26, 9)
  const macd = calculateMACD(prices.map(p => p.price));

  // Calculate Moving Averages (20-day and 50-day)
  const ma20 = calculateMA(prices.map(p => p.price), 20);
  const ma50 = calculateMA(prices.map(p => p.price), 50);

  return prices.map((point, i) => ({
    ...point,
    rsi: rsi[i],
    macd: macd[i],
    ma20: ma20[i],
    ma50: ma50[i],
  }));
};

// Technical indicator calculations
const calculateRSI = (prices: number[], period: number) => {
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < prices.length; i++) {
    const difference = prices[i] - prices[i - 1];
    gains.push(Math.max(difference, 0));
    losses.push(Math.max(-difference, 0));
  }

  const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  const rsi = [];
  let currentGain = avgGain;
  let currentLoss = avgLoss;

  for (let i = period; i < prices.length; i++) {
    const rs = currentGain / currentLoss;
    rsi.push(100 - (100 / (1 + rs)));
    
    currentGain = ((currentGain * (period - 1)) + gains[i]) / period;
    currentLoss = ((currentLoss * (period - 1)) + losses[i]) / period;
  }

  return [null, ...rsi];
};

const calculateMA = (prices: number[], period: number) => {
  const ma = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      ma.push(null);
      continue;
    }
    const slice = prices.slice(i - period + 1, i + 1);
    const average = slice.reduce((a, b) => a + b, 0) / period;
    ma.push(average);
  }
  return ma;
};

const calculateMACD = (prices: number[]) => {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  return ema12.map((v, i) => v - ema26[i]);
};

const calculateEMA = (prices: number[], period: number) => {
  const k = 2 / (period + 1);
  const ema = [prices[0]];
  
  for (let i = 1; i < prices.length; i++) {
    ema.push(prices[i] * k + ema[i - 1] * (1 - k));
  }
  
  return ema;
};

const TechnicalIndicators = () => {
  const { toast } = useToast();
  const { data, isLoading, error } = useQuery({
    queryKey: ['technicalIndicators'],
    queryFn: fetchTechnicalData,
    refetchInterval: 300000, // Refresh every 5 minutes
    meta: {
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to fetch technical indicators. Please try again later.",
          variant: "destructive",
        });
      },
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Technical Indicators</h2>
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Technical Indicators</h2>
        <p className="text-muted-foreground">Failed to load technical indicators.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Technical Indicators</h2>
      
      {/* RSI Chart */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Relative Strength Index (RSI)</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="rsi" stroke="#8884d8" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MACD Chart */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">MACD</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="macd" stroke="#82ca9d" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Moving Averages */}
      <div>
        <h3 className="text-lg font-medium mb-4">Moving Averages</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="ma20" stroke="#ffc658" name="20-day MA" dot={false} />
              <Line type="monotone" dataKey="ma50" stroke="#ff7300" name="50-day MA" dot={false} />
              <Line type="monotone" dataKey="price" stroke="#8884d8" name="Price" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};

export default TechnicalIndicators;