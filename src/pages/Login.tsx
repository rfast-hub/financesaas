import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LoginForm } from "@/components/login/LoginForm";
import { ResetPasswordForm } from "@/components/login/ResetPasswordForm";
import { useToast } from "@/hooks/use-toast";
import { configureSessionTimeout } from "@/utils/sessionUtils";

const Login = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [resetMode, setResetMode] = useState(false);

  useEffect(() => {
    // Configure session timeout
    configureSessionTimeout();

    // Check if user was redirected due to session expiration
    const expired = searchParams.get('expired');
    if (expired === 'true') {
      toast({
        title: "Session expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive"
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {resetMode ? "Reset Password" : "Crypto Dashboard Login"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {resetMode 
              ? "Enter your email to receive a reset link" 
              : "Please sign in to access the platform"}
          </p>
        </div>

        {resetMode ? (
          <ResetPasswordForm onBack={() => setResetMode(false)} />
        ) : (
          <>
            <LoginForm />
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setResetMode(true)}
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;