import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CancelSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  isLoading: boolean;
  isTrial: boolean;
}

const CancelSubscriptionDialog = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  isTrial,
}: CancelSubscriptionDialogProps) => {
  const [password, setPassword] = useState("");

  const handleConfirm = async () => {
    await onConfirm(password);
    setPassword(""); // Reset password after confirmation
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Cancellation</DialogTitle>
          <DialogDescription className="space-y-2">
            {isTrial ? (
              <>
                <p>Are you sure you want to cancel your trial? Your access will end immediately.</p>
                <p className="font-medium">You won't be charged anything as this is a free trial.</p>
              </>
            ) : (
              <>
                <p>Are you sure you want to cancel your subscription?</p>
                <p className="font-medium">Your subscription will remain active until the end of your current billing period. You won't be charged after that.</p>
              </>
            )}
            <p>Please enter your password to confirm cancellation.</p>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isLoading || !password}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CancelSubscriptionDialog;