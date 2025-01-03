import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ResetPasswordFormProps {
  onBack: () => void;
}

export const ResetPasswordForm = ({ onBack }: ResetPasswordFormProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    if (cooldownSeconds > 0) {
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
        if (error.message.includes('rate_limit')) {
          // Extract the wait time from error message
          const waitTime = error.message.match(/\d+/)?.[0] || '60';
          setCooldownSeconds(parseInt(waitTime));
          
          // Start countdown
          const interval = setInterval(() => {
            setCooldownSeconds((prev) => {
              if (prev <= 1) {
                clearInterval(interval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

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
      onBack();
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
      <div>
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full"
          autoComplete="email"
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || cooldownSeconds > 0}
      >
        {loading ? "Sending..." : cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : "Send Reset Link"}
      </Button>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-primary hover:underline"
        >
          Back to login
        </button>
      </div>
    </form>
  );
};