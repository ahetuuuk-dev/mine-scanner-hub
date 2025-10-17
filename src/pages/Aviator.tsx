import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Aviator = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuthAndRole();
  }, []);

  const checkAuthAndRole = async () => {
    const credentialId = localStorage.getItem('aviator_credential_id');
    if (!credentialId) {
      navigate("/auth");
      return;
    }

    const { data: credential } = await supabase
      .from("game_credentials")
      .select("*")
      .eq("id", credentialId)
      .eq("game_type", "aviator")
      .single();

    if (!credential || !credential.is_active) {
      toast.error("Session invalid. Please login again.");
      navigate("/auth");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin");
      setIsAdmin(roles && roles.length > 0);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('aviator_username');
    localStorage.removeItem('aviator_credential_id');
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Aviator Game Verification
            </h1>
            <p className="text-muted-foreground mt-2">Coming Soon</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="border-destructive/30">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <Card className="p-16 text-center bg-gradient-to-br from-card via-card to-card/80 border-2 border-primary/20">
          <div className="text-8xl mb-8">✈️</div>
          <h2 className="text-3xl font-bold text-foreground mb-4">Aviator Verification</h2>
          <p className="text-muted-foreground text-lg">This game verification tool is coming soon!</p>
        </Card>
      </div>
    </div>
  );
};

export default Aviator;
