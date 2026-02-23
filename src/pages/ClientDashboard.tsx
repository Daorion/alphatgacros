import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, User, CalendarDays, CreditCard, MessageSquare, AlertTriangle } from "lucide-react";

interface ProfileData {
  full_name: string | null;
  plan_name: string | null;
  plan_status: string | null;
  next_renewal: string | null;
  notes: string | null;
  status: string;
}

const ClientDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, plan_name, plan_status, next_renewal, notes, status")
        .eq("id", user.id)
        .single();
      setProfile(data as ProfileData);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  const statusColor = profile?.plan_status === "active" ? "text-green-500" : "text-red-500";
  const statusLabel = profile?.plan_status === "active" ? "Ativo" : "Inadimplente";

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logo-alpha-cross.png" alt="Alpha Cross" className="h-8" />
            <span className="font-bold text-foreground">Área do Aluno</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-foreground">
            Olá, <span className="text-primary">{profile?.full_name || "Aluno"}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Bem-vindo à sua área exclusiva.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Meus Dados</h2>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Nome:</span> <span className="text-foreground">{profile?.full_name || "—"}</span></p>
              <p><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{user?.email}</span></p>
              <p><span className="text-muted-foreground">Status:</span> <span className={`font-bold ${profile?.status === "active" ? "text-green-500" : "text-red-500"}`}>{profile?.status === "active" ? "Ativo" : "Inativo"}</span></p>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Meu Plano</h2>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Plano:</span> <span className="text-foreground font-semibold">{profile?.plan_name || "Não definido"}</span></p>
              <p><span className="text-muted-foreground">Situação:</span> <span className={`font-bold ${statusColor}`}>{statusLabel}</span></p>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Renovação</h2>
            </div>
            <p className="text-sm">
              <span className="text-muted-foreground">Próxima renovação:</span>{" "}
              <span className="text-foreground font-semibold">
                {profile?.next_renewal
                  ? new Date(profile.next_renewal).toLocaleDateString("pt-BR")
                  : "Não definida"}
              </span>
            </p>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Avisos</h2>
            </div>
            <p className="text-sm text-foreground">
              {profile?.notes || "Nenhum aviso no momento."}
            </p>
          </Card>
        </div>

        {profile?.plan_status !== "active" && (
          <Card className="mt-6 p-4 bg-destructive/10 border-destructive/30">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive font-medium">
                Seu plano está inadimplente. Entre em contato com a administração.
              </p>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ClientDashboard;
