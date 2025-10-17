import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [username, setUsername] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [gameType, setGameType] = useState<"mines" | "aviator" | "color_prediction">("mines");
  const [loading, setLoading] = useState(false);
  const [adminContact, setAdminContact] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminContact();
    
    // Subscribe to real-time contact updates
    const channel = supabase
      .channel('contact-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_contact'
        },
        (payload) => {
          setAdminContact(payload.new.whatsapp_number);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const fetchAdminContact = async () => {
    const { data } = await supabase
      .from("admin_contact")
      .select("whatsapp_number")
      .single();
    
    if (data) {
      setAdminContact(data.whatsapp_number);
    }
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify username and secret code for specific game
      const { data: credential, error: credError } = await supabase
        .from("game_credentials")
        .select("*")
        .eq("username", username)
        .eq("secret_code", secretCode)
        .eq("game_type", gameType)
        .maybeSingle();

      if (credError) {
        console.error("Database error:", credError);
        throw new Error("Database error occurred");
      }

      if (!credential) {
        throw new Error("Invalid username or secret code for this game");
      }

      // Check if account is active
      if (!credential.is_active) {
        throw new Error("Account is deactivated. Contact admin.");
      }

      // Check if account is expired
      if (credential.expires_at && new Date(credential.expires_at) < new Date()) {
        throw new Error("Account has expired. Contact admin.");
      }

      // Store credential ID based on game type
      const storageKey = `${gameType}_credential_id`;
      const usernameKey = `${gameType}_username`;
      localStorage.setItem(storageKey, credential.id);
      localStorage.setItem(usernameKey, username);
      
      toast.success("Login successful!");
      
      // Navigate to the appropriate game page
      const gameRoutes = {
        mines: "/mines",
        aviator: "/aviator",
        color_prediction: "/color-prediction"
      };
      navigate(gameRoutes[gameType]);
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const getGameEmoji = () => {
    switch(gameType) {
      case "mines": return "💣";
      case "aviator": return "✈️";
      case "color_prediction": return "🎨";
    }
  };

  const getGameName = () => {
    switch(gameType) {
      case "mines": return "Mines";
      case "aviator": return "Aviator";
      case "color_prediction": return "Color Prediction";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card/50 backdrop-blur-sm shadow-[0_0_30px_rgba(34,211,238,0.15)]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {getGameEmoji()} {getGameName()} Verification
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            User Login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUserLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="game-select" className="text-foreground">Select Game</Label>
              <Select value={gameType} onValueChange={(value: any) => setGameType(value)}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Choose a game" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mines">💣 Mines</SelectItem>
                  <SelectItem value="aviator">✈️ Aviator</SelectItem>
                  <SelectItem value="color_prediction">🎨 Color Prediction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret-code" className="text-foreground">Secret Code</Label>
              <Input
                id="secret-code"
                type="password"
                placeholder="••••••••"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                required
                className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          {adminContact && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground text-center mb-2">Need help?</p>
              <Button
                variant="outline"
                className="w-full border-accent/50 text-accent hover:bg-accent/20"
                onClick={() => window.open(`https://wa.me/${adminContact}`, '_blank')}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Admin on WhatsApp
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
