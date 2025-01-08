export interface Subscription {
  id: string;
  user_id: string;
  status: string;
  subscription_id?: string;
  current_period_end?: string;
  created_at?: string;
  canceled_at?: string;
}