import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { deleteUserData, deleteUserAccount, signOut } from "@/utils/authUtils";

export const useAccountDeletion = (updateSession: (isAuthenticated: boolean) => void) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const deleteAccount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user.id) {
        throw new Error("No user session found");
      }

      await deleteUserData(session.user.id);
      await deleteUserAccount(session.user.id);
      await signOut();
      
      updateSession(false);
      navigate('/login');
      
      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted.",
      });
    } catch (error: any) {
      console.error("Delete account error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete user account. Please try again.",
      });
    }
  };

  return { deleteAccount };
};