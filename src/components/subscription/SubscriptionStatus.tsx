import { Subscription } from "@/types/subscription";

interface SubscriptionStatusProps {
  subscription: Subscription | null;
  isTrial: boolean;
}

const SubscriptionStatus = ({ subscription, isTrial }: SubscriptionStatusProps) => {
  return (
    <div>
      <p className="text-sm font-medium">
        Status: <span className="capitalize">{isTrial ? 'Trial' : subscription?.status || 'No subscription'}</span>
      </p>
      {subscription?.current_period_end && (
        <p className="text-sm text-muted-foreground">
          {isTrial ? 'Trial ends' : subscription.status === 'active' ? 'Subscription ends' : 'Ended'}: {new Date(subscription.current_period_end).toLocaleDateString()}
        </p>
      )}
      {isTrial && (
        <p className="text-sm text-muted-foreground mt-2">
          You're currently on a trial period. You can cancel anytime.
        </p>
      )}
    </div>
  );
};

export default SubscriptionStatus;