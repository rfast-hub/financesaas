import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { LoginForm } from "@/components/login/LoginForm";
import { ResetPasswordForm } from "@/components/login/ResetPasswordForm";
import { useToast } from "@/hooks/use-toast";
import { configureSessionTimeout } from "@/utils/sessionUtils";
import LoginHeader from "@/components/login/LoginHeader";
import ForgotPasswordLink from "@/components/login/ForgotPasswordLink";

const Login = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [resetMode, setResetMode] = useState(false);

  useEffect(() => {
    configureSessionTimeout();

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
      <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-lg shadow-lg animate-fade-in">
        <LoginHeader isResetMode={resetMode} />

        {resetMode ? (
          <ResetPasswordForm onBack={() => setResetMode(false)} />
        ) : (
          <>
            <LoginForm />
            <ForgotPasswordLink onClick={() => setResetMode(true)} />
          </>
        )}
      </div>
    </div>
  );
};

export default Login;