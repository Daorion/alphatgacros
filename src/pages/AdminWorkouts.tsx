import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Dumbbell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Workout {
  id: string;
  week_start: string;
  day_of_week: number;
  title: string;
  description: string | null;
}

const DAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

const AdminWorkouts = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const weekStartStr = formatDateISO(weekStart);

  const fetchWorkouts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("weekly_workouts")
      .select("*")
      .eq("week_start", weekStartStr)
      .order("day_of_week");

    if (error) {
      toast({ title: "Erro", description: "Não foi possível carregar os treinos.", variant: "destructive" });
    } else {
      setWorkouts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkouts();
  }, [weekStartStr]);

  const changeWeek = (offset: number) => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + offset * 7);
      return d;
    });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("weekly_workouts").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
    } else {
      toast({ title: "Excluído" });
      fetchWorkouts();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekLabel = `${weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} — ${weekEnd.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;

  const workoutByDay = new Map<number, Workout>();
  workouts.forEach((w) => workoutByDay.set(w.day_of_week, w));

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logo-alpha-cross.png" alt="Alpha Cross" className="h-8" />
            <span className="font-bold text-foreground">Treinos da Semana</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              ← Painel
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Week selector */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" size="icon" onClick={() => changeWeek(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-black text-foreground text-center">{weekLabel}</h1>
          <Button variant="outline" size="icon" onClick={() => changeWeek(1)}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {DAY_NAMES.map((dayName, index) => {
              const workout = workoutByDay.get(index);
              const dayDate = new Date(weekStart);
              dayDate.setDate(dayDate.getDate() + index);

              return (
                <Card key={index} className="p-4 bg-card border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <Dumbbell className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground">
                          {dayName}{" "}
                          <span className="text-muted-foreground font-normal">
                            ({dayDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })})
                          </span>
                        </p>
                        {workout ? (
                          <>
                            <p className="text-sm text-primary font-semibold mt-1">{workout.title}</p>
                            {workout.description && (
                              <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{workout.description}</p>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1 italic">Sem treino</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {workout ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/treinos/${workout.id}`)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(workout.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/treinos/novo?week=${weekStartStr}&day=${index}`)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminWorkouts;
