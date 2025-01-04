import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Alert {
  id: string;
  cryptocurrency: string;
  condition: string;
  target_price: number;
}

interface AlertListProps {
  alerts: Alert[] | undefined;
  onDelete: () => void;
}

export const AlertList = ({ alerts, onDelete }: AlertListProps) => {
  const { toast } = useToast();

  const handleDeleteAlert = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to delete alerts",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("price_alerts")
        .delete()
        .match({ id, user_id: user.id }); // Ensure we only delete user's own alerts

      if (error) throw error;

      toast({
        title: "Success",
        description: "Alert deleted successfully!",
      });

      onDelete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!alerts?.length) {
    return (
      <p className="text-muted-foreground text-center py-4">
        No alerts set. Create one above!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-center justify-between p-4 border border-border rounded-lg"
        >
          <div>
            <p className="font-medium">{alert.cryptocurrency}</p>
            <p className="text-sm text-muted-foreground">
              {alert.condition} ${alert.target_price}
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeleteAlert(alert.id)}
          >
            Delete
          </Button>
        </div>
      ))}
    </div>
  );
};