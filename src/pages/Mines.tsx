import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, LogOut, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateMines } from "@/utils/mineGenerator";
import { GameRules } from "@/components/GameRules";
const Mines = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [minesCount, setMinesCount] = useState(4);
  const [clientSeed, setClientSeed] = useState("");
  const [serverSeed, setServerSeed] = useState("");
  const [grid, setGrid] = useState<boolean[]>(Array(25).fill(false));
  const [showGrid, setShowGrid] = useState(false);
  useEffect(() => {
    checkAuthAndRole();

    // Subscribe to user credential changes for real-time deactivation
    const credentialsChannel = supabase.channel('user-credentials-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'user_credentials'
    }, payload => {
      const credentialId = localStorage.getItem('user_credential_id');
      if (payload.eventType === 'DELETE' && payload.old?.id === credentialId) {
        toast.error("Your account has been deleted by admin.");
        setTimeout(() => {
          handleLogout();
        }, 2000);
      } else if (payload.eventType === 'UPDATE' && payload.new?.id === credentialId && !payload.new?.is_active) {
        toast.error("Your account has been deactivated by admin.");
        setTimeout(() => {
          handleLogout();
        }, 2000);
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(credentialsChannel);
    };
  }, []);
  const checkAuthAndRole = async () => {
    const credentialId = localStorage.getItem('user_credential_id');
    if (!credentialId) {
      navigate("/auth");
      return;
    }

    // Verify credential is still valid
    const {
      data: credential
    } = await supabase.from("user_credentials").select("*").eq("id", credentialId).single();
    if (!credential || !credential.is_active) {
      toast.error("Session invalid. Please login again.");
      navigate("/auth");
      return;
    }

    // Check if admin
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (session) {
      const {
        data: roles
      } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin");
      setIsAdmin(roles && roles.length > 0);
    }
  };
  const handleLogout = async () => {
    localStorage.removeItem('current_username');
    localStorage.removeItem('user_credential_id');
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };
  useEffect(() => {
    // Only generate mines if both seeds are provided
    if (clientSeed && serverSeed) {
      const newGrid = generateMines(clientSeed, serverSeed, nonce, minesCount);
      setGrid(newGrid);
      setShowGrid(true);
    } else {
      setShowGrid(false);
      setGrid(Array(25).fill(false));
    }
  }, [minesCount, clientSeed, serverSeed, nonce]);
  return <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
              Game Verification Hub
            </h1>
            <p className="text-muted-foreground mt-2">Developer : Ash King </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <GameRules />
            {isAdmin}
            <Button variant="outline" onClick={handleLogout} className="border-destructive/30 bg-destructive/5 hover:bg-destructive/20 hover:text-destructive hover:border-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Game Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-2 border-primary shadow-[0_0_30px_rgba(0,255,255,0.3)] transition-all hover:shadow-[0_0_40px_rgba(0,255,255,0.5)]">
            <div className="text-center space-y-2">
              <div className="text-3xl">💣</div>
              <h3 className="text-xl font-bold text-primary">Mines</h3>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </Card>

          <Card 
            className="p-6 bg-gradient-to-br from-card/40 to-card/20 border-2 border-border/30 relative overflow-hidden cursor-pointer hover:border-primary/30 transition-all"
            onClick={() => navigate("/aviator")}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
            <div className="relative text-center space-y-2 opacity-50 hover:opacity-70 transition-opacity">
              <div className="text-3xl">✈️</div>
              <h3 className="text-xl font-bold text-foreground">Aviator</h3>
              <div className="inline-block px-3 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full border border-primary/30">
                Coming Soon
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 bg-gradient-to-br from-card/40 to-card/20 border-2 border-border/30 relative overflow-hidden cursor-pointer hover:border-accent/30 transition-all"
            onClick={() => navigate("/color-prediction")}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent" />
            <div className="relative text-center space-y-2 opacity-50 hover:opacity-70 transition-opacity">
              <div className="text-3xl">🎨</div>
              <h3 className="text-xl font-bold text-foreground">Color Prediction</h3>
              <div className="inline-block px-3 py-1 bg-accent/20 text-accent text-xs font-semibold rounded-full border border-accent/30">
                Coming Soon
              </div>
            </div>
          </Card>
        </div>

        {/* Main Mines Game */}
        <Card className="p-8 bg-gradient-to-br from-card via-card to-card/80 border-2 border-primary/20 shadow-2xl space-y-6 backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Controls */}
            <div className="space-y-5">
              <div className="space-y-3">
                <Label className="text-foreground text-lg font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  Client Seed
                </Label>
                <Input value={clientSeed} onChange={e => setClientSeed(e.target.value)} placeholder="Enter your client seed..." className="bg-input/50 border-primary/30 text-foreground font-mono h-12 text-sm focus:ring-2 focus:ring-primary/50 transition-all" />
              </div>

              <div className="space-y-3">
                <Label className="text-foreground text-lg font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                  Server Seed
                </Label>
                <Input value={serverSeed} onChange={e => setServerSeed(e.target.value)} placeholder="Enter server seed..." className="bg-input/50 border-accent/30 text-foreground font-mono h-12 text-sm focus:ring-2 focus:ring-accent/50 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-foreground font-semibold">Nonce</Label>
                  <div className="flex gap-2">
                    <Input value={nonce} readOnly className="bg-input/50 border-border text-foreground h-12 font-mono text-center text-lg" />
                    <div className="flex flex-col gap-1">
                      <Button size="icon" variant="outline" onClick={() => setNonce(n => n + 1)} className="h-6 w-12 border-primary/30 bg-primary/10 hover:bg-primary/20 hover:border-primary transition-all">
                        <ChevronUp className="h-4 w-4 text-primary" />
                      </Button>
                      <Button size="icon" variant="outline" onClick={() => setNonce(n => Math.max(0, n - 1))} className="h-6 w-12 border-primary/30 bg-primary/10 hover:bg-primary/20 hover:border-primary transition-all">
                        <ChevronDown className="h-4 w-4 text-primary" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-foreground font-semibold">Mines Count</Label>
                  <Select value={minesCount.toString()} onValueChange={v => setMinesCount(Number(v))}>
                    <SelectTrigger className="bg-input/50 border-destructive/30 text-foreground h-12 focus:ring-2 focus:ring-destructive/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 24].map(num => <SelectItem key={num} value={num.toString()}>{num} Mines</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {showGrid && <div className="p-4 bg-primary/5 border border-primary/30 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Grid Status</span>
                    <span className="text-xs text-primary">✓ Verified</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-destructive/10 border border-destructive/30 p-2 rounded">
                      <span className="text-destructive font-bold">{grid.filter(Boolean).length}</span> Mines
                    </div>
                    <div className="bg-accent/10 border border-accent/30 p-2 rounded">
                      <span className="text-accent font-bold">{25 - grid.filter(Boolean).length}</span> Safe
                    </div>
                  </div>
                </div>}
            </div>

            {/* Right: Grid Display */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-md">
                {!showGrid && <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center bg-card/30 backdrop-blur-sm">
                    <div className="space-y-4">
                      <div className="text-6xl opacity-20">💣</div>
                      <p className="text-muted-foreground text-sm">
                        Enter <span className="text-primary font-semibold">Client Seed</span> and <span className="text-accent font-semibold">Server Seed</span>
                      </p>
                      <p className="text-xs text-muted-foreground/60">to reveal mine positions</p>
                    </div>
                  </div>}
                {showGrid && <div className="space-y-3">
                    <div className="grid grid-cols-5 gap-2 p-4 bg-background/50 rounded-xl border border-primary/20 shadow-inner">
                      {grid.map((isMine, index) => <div key={index} className={`aspect-square rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${isMine ? 'bg-gradient-to-br from-destructive/30 to-destructive/10 border-2 border-destructive shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse' : 'bg-gradient-to-br from-accent/20 to-primary/10 border-2 border-accent/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`}>
                          {isMine ? <div className="relative">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-destructive to-red-600 shadow-lg" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-5 h-0.5 bg-background rotate-45" />
                                <div className="w-5 h-0.5 bg-background -rotate-45 absolute" />
                              </div>
                              <div className="absolute inset-0 rounded-full bg-destructive/30 blur-md" />
                            </div> : <div className="relative w-6 h-6">
                              <div className="w-6 h-6 bg-gradient-to-br from-accent via-primary to-accent rounded-sm shadow-lg animate-pulse" style={{
                        clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                      }} />
                              <div className="absolute inset-0 bg-accent/40 blur-sm" style={{
                        clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                      }} />
                            </div>}
                        </div>)}
                    </div>
                  </div>}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>;
};
export default Mines;