import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, User, CalendarDays, CreditCard, MessageSquare, AlertTriangle, Dumbbell } from "lucide-react";

interface ProfileData {
  full_name: string | null;
  plan_name: string | null;
  plan_status: string | null;
  next_renewal: string | null;
  notes: string | null;
  status: string;
}

interface WorkoutItem {
  day_of_week: number;
  title: string;
  intensity: string | null;
  tags: string[] | null;
  warmup: string | null;
  activation: string | null;
  strength: string | null;
  wod: string | null;
  notes: string | null;
}

const DAY_NAMES = ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO", "DOMINGO"];

const TAG_COLORS: Record<string, string> = {
  força: "bg-red-500/20 text-red-400",
  engine: "bg-orange-500/20 text-orange-400",
  ginástica: "bg-purple-500/20 text-purple-400",
  potência: "bg-yellow-500/20 text-yellow-400",
  recuperação: "bg-green-500/20 text-green-400",
  skill: "bg-blue-500/20 text-blue-400",
};

const INTENSITY_COLORS: Record<string, string> = {
  leve: "text-green-400",
  média: "text-yellow-400",
  alta: "text-red-400",
};

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

const ClientDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const [profileRes, workoutsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, plan_name, plan_status, next_renewal, notes, status")
          .eq("id", user.id)
          .single(),
        supabase
          .from("weekly_workouts")
          .select("day_of_week, title, intensity, tags, warmup, activation, strength, wod, notes")
          .eq("week_start", getMonday(new Date()))
          .order("day_of_week"),
      ]);
      setProfile(profileRes.data as ProfileData);
      setWorkouts((workoutsRes.data as WorkoutItem[]) || []);
      setLoading(false);
    };
    fetchData();
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

        {/* Treinos da Semana */}
        <Card className="mt-6 p-6 bg-card border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Treinos da Semana</h2>
          </div>
          {workouts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workouts.map((w, i) => (
                <Card key={i} className="p-4 bg-background border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-black text-foreground">{DAY_NAMES[w.day_of_week]}</h3>
                    {w.intensity && (
                      <span className={`text-[10px] font-bold uppercase ${INTENSITY_COLORS[w.intensity] || "text-muted-foreground"}`}>
                        {w.intensity}
                      </span>
                    )}
                  </div>
                  {w.tags && w.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {w.tags.map((tag) => (
                        <span key={tag} className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${TAG_COLORS[tag] || "bg-muted text-muted-foreground"}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {w.warmup && (
                    <div className="mt-2">
                      <p className="text-[10px] font-bold text-primary">🔥 WARM-UP</p>
                      <pre className="text-[11px] text-foreground/80 whitespace-pre-wrap font-sans">{w.warmup}</pre>
                    </div>
                  )}
                  {w.activation && (
                    <div className="mt-2">
                      <p className="text-[10px] font-bold text-primary">⚡ ATIVAÇÃO</p>
                      <pre className="text-[11px] text-foreground/80 whitespace-pre-wrap font-sans">{w.activation}</pre>
                    </div>
                  )}
                  {w.strength && (
                    <div className="mt-2">
                      <p className="text-[10px] font-bold text-primary">🏋️ FORÇA/TÉCNICA</p>
                      <pre className="text-[11px] text-foreground/80 whitespace-pre-wrap font-sans">{w.strength}</pre>
                    </div>
                  )}
                  {w.wod && (
                    <div className="mt-2">
                      <p className="text-[10px] font-bold text-primary">💀 WOD</p>
                      <pre className="text-[11px] text-foreground/80 whitespace-pre-wrap font-sans">{w.wod}</pre>
                    </div>
                  )}
                  {w.notes && (
                    <div className="mt-2">
                      <p className="text-[10px] font-bold text-primary">📝 OBS</p>
                      <pre className="text-[11px] text-foreground/80 whitespace-pre-wrap font-sans">{w.notes}</pre>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhum treino cadastrado para esta semana.</p>
          )}
        </Card>

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
