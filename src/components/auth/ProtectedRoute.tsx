import { Navigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { Skeleton } from "@/components/ui/skeleton";
import { isSessionValid } from "@/utils/sessionUtils";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        <p className="text-xs text-muted-foreground">If this takes too long, try refreshing the page</p>
      </div>
    );
  }

  if (!session || !isSessionValid(session)) {
    return <Navigate to="/login?expired=true" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;