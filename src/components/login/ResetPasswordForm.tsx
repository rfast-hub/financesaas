import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { extractWaitTime, isRateLimitError } from "@/utils/errorHandling";
import { useCooldown } from "@/hooks/useCooldown";

interface ResetPasswordFormProps {
  onBack: () => void;
}

export const ResetPasswordForm = ({ onBack }: ResetPasswordFormProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { cooldownSeconds, startCooldown, isInCooldown } = useCooldown();
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    if (isInCooldown) {
      toast({
        variant: "destructive",
        title: "Please wait",
        description: `You can request another reset in ${cooldownSeconds} seconds.`,
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        if (isRateLimitError(error)) {
          const waitTime = extractWaitTime(error.message);
          startCooldown(waitTime);
          
          toast({
            variant: "destructive",
            title: "Too many requests",
            description: `Please wait ${waitTime} seconds before requesting another reset.`,
          });
          return;
        }

        toast({
          variant: "destructive",
          title: "Password reset failed",
          description: error.message,
        });
        return;
      }

      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || isInCooldown}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || isInCooldown}
      >
        {loading ? "Sending..." : isInCooldown ? `Wait ${cooldownSeconds}s` : "Send Reset Link"}
      </Button>

      <div className="text-center mt-4">
        <Button variant="link" onClick={onBack} type="button">
          Back to Login
        </Button>
      </div>
    </form>
  );
};