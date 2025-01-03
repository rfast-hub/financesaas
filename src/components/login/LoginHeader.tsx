const LoginHeader = ({ isResetMode }: { isResetMode: boolean }) => (
  <div className="text-center">
    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
      {isResetMode ? "Reset Password" : "Crypto Dashboard Login"}
    </h2>
    <p className="mt-2 text-muted-foreground">
      {isResetMode 
        ? "Enter your email to receive a reset link" 
        : "Please sign in to access the platform"}
    </p>
  </div>
);

export default LoginHeader;