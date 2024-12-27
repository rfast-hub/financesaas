import { Progress } from "@/components/ui/progress";

interface SentimentScoreProps {
  upPercentage: number;
  downPercentage: number;
}

const SentimentScore = ({ upPercentage, downPercentage }: SentimentScoreProps) => {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm text-muted-foreground">Bullish</span>
        <span className="text-sm text-muted-foreground">Bearish</span>
      </div>
      <Progress value={upPercentage} className="h-2" />
      <div className="flex justify-between mt-1">
        <span className="text-sm font-medium">{upPercentage}%</span>
        <span className="text-sm font-medium">{downPercentage}%</span>
      </div>
    </div>
  );
};

export default SentimentScore;