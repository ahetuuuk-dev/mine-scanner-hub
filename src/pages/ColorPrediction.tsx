import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CryptoJS from "crypto-js";

const ColorPrediction = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [clientSeed, setClientSeed] = useState("");
  const [serverSeed, setServerSeed] = useState("");
  const [predictedNumber, setPredictedNumber] = useState<number | null>(null);
  const [predictedColor, setPredictedColor] = useState<string>("");
  const [showPrediction, setShowPrediction] = useState(false);

  useEffect(() => {
    checkAuthAndRole();
  }, []);

  const checkAuthAndRole = async () => {
    const credentialId = localStorage.getItem('color_credential_id');
    if (!credentialId) {
      navigate("/auth");
      return;
    }

    const { data: credential } = await supabase
      .from("game_credentials")
      .select("*")
      .eq("id", credentialId)
      .eq("game_type", "color_prediction")
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
    localStorage.removeItem('color_username');
    localStorage.removeItem('color_credential_id');
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const predictColorAndNumber = (
    clientSeed: string,
    serverSeed: string,
    nonce: number
  ): { number: number; color: string } => {
    const combinedSeed = `${serverSeed}:${clientSeed}:${nonce}`;
    const hash = CryptoJS.SHA256(combinedSeed).toString();
    
    // Get number between 0-9 from first 2 hex characters
    const number = parseInt(hash.substring(0, 2), 16) % 10;
    
    // Determine color based on number
    let color = "";
    if (number === 0) {
      color = "Red/Violet";
    } else if (number === 5) {
      color = "Green/Violet";
    } else if ([1, 3, 7, 9].includes(number)) {
      color = "Green";
    } else {
      color = "Red";
    }
    
    return { number, color };
  };

  useEffect(() => {
    if (clientSeed && serverSeed) {
      const prediction = predictColorAndNumber(clientSeed, serverSeed, nonce);
      setPredictedNumber(prediction.number);
      setPredictedColor(prediction.color);
      setShowPrediction(true);
    } else {
      setShowPrediction(false);
      setPredictedNumber(null);
      setPredictedColor("");
    }
  }, [clientSeed, serverSeed, nonce]);

  const getColorStyle = (color: string) => {
    if (color.includes("Violet")) {
      return "bg-gradient-to-r from-purple-500 to-violet-600";
    } else if (color === "Green") {
      return "bg-gradient-to-r from-green-500 to-emerald-600";
    } else {
      return "bg-gradient-to-r from-red-500 to-rose-600";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Color Prediction Verification
            </h1>
            <p className="text-muted-foreground mt-2">Verify game results with server & client seeds</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="border-destructive/30">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <Card className="p-8 bg-gradient-to-br from-card via-card to-card/80 border-2 border-primary/20 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Controls */}
            <div className="space-y-5">
              <div className="space-y-3">
                <Label className="text-foreground text-lg font-semibold">Client Seed</Label>
                <Input
                  value={clientSeed}
                  onChange={(e) => setClientSeed(e.target.value)}
                  placeholder="Enter your client seed..."
                  className="bg-input/50 border-primary/30 h-12 font-mono"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-foreground text-lg font-semibold">Server Seed</Label>
                <Input
                  value={serverSeed}
                  onChange={(e) => setServerSeed(e.target.value)}
                  placeholder="Enter server seed..."
                  className="bg-input/50 border-accent/30 h-12 font-mono"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-foreground font-semibold">Nonce</Label>
                <div className="flex gap-2">
                  <Input
                    value={nonce}
                    readOnly
                    className="bg-input/50 border-border h-12 font-mono text-center text-lg"
                  />
                  <div className="flex flex-col gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setNonce((n) => n + 1)}
                      className="h-6 w-12 border-primary/30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setNonce((n) => Math.max(0, n - 1))}
                      className="h-6 w-12 border-primary/30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Prediction Display */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-md">
                {!showPrediction && (
                  <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center">
                    <div className="text-6xl mb-4">🎨</div>
                    <p className="text-muted-foreground">
                      Enter <span className="text-primary font-semibold">Client Seed</span> and{" "}
                      <span className="text-accent font-semibold">Server Seed</span>
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-2">to reveal prediction</p>
                  </div>
                )}
                {showPrediction && (
                  <div className="space-y-4">
                    <div className="p-8 bg-background/50 rounded-xl border border-primary/20 text-center">
                      <p className="text-sm text-muted-foreground mb-4">Predicted Number</p>
                      <div className="text-8xl font-bold text-primary mb-6">{predictedNumber}</div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Predicted Color</p>
                        <div
                          className={`${getColorStyle(
                            predictedColor
                          )} text-white font-bold text-2xl py-4 rounded-lg shadow-lg`}
                        >
                          {predictedColor}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ColorPrediction;
