import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import WorkoutAIAssistant, { WorkoutSuggestion } from "@/components/WorkoutAIAssistant";
import { useAuth } from "@/contexts/AuthContext";

interface Workout {
  id: string;
  week_start: string;
  day_of_week: number;
  title: string;
  intensity: string | null;
  tags: string[] | null;
  warmup: string | null;
  activation: string | null;
  strength: string | null;
  wod: string | null;
  notes: string | null;
  week_label: string | null;
}

const DAY_NAMES = ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO", "DOMINGO"];

const INTENSITY_COLORS: Record<string, string> = {
  leve: "text-green-400",
  média: "text-yellow-400",
  alta: "text-red-400",
};

const TAG_COLORS: Record<string, string> = {
  força: "bg-red-500/20 text-red-400 border-red-500/30",
  engine: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ginástica: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  potência: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  recuperação: "bg-green-500/20 text-green-400 border-green-500/30",
  skill: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

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

const WorkoutSection = ({ icon, label, content }: { icon: string; label: string; content: string }) => (
  <div className="mt-3">
    <p className="text-xs font-bold text-primary mb-1">{icon} {label}</p>
    <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">{content}</pre>
  </div>
);

const AdminWorkouts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [aiOpen, setAiOpen] = useState(false);

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
      setWorkouts((data as Workout[]) || []);
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
      toast({ title: "Treino excluído" });
      fetchWorkouts();
    }
  };

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekLabel = workouts[0]?.week_label || 
    `${weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} → ${weekEnd.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}`;

  const workoutByDay = new Map<number, Workout>();
  workouts.forEach((w) => workoutByDay.set(w.day_of_week, w));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-foreground">Treinos da Semana</h1>
        <Button onClick={() => setAiOpen(true)} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
          <Sparkles className="h-4 w-4 mr-2" />
          Assistente IA
        </Button>
      </div>

      {/* Week selector */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => changeWeek(-1)}
          className="border-border/50 hover:border-primary/50 hover:bg-primary/5"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center glass rounded-xl px-6 py-3">
          <h2 className="text-base font-black text-foreground">{weekLabel}</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {weekStart.toLocaleDateString("pt-BR")} → {weekEnd.toLocaleDateString("pt-BR")}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => changeWeek(1)}
          className="border-border/50 hover:border-primary/50 hover:bg-primary/5"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAY_NAMES.map((dayName, index) => {
            const workout = workoutByDay.get(index);

            return (
              <div key={index} className="glass rounded-xl p-4 flex flex-col border-gradient transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-black text-foreground tracking-wide">{dayName}</h3>
                  {workout?.intensity && (
                    <span className={`text-[10px] font-bold uppercase ${INTENSITY_COLORS[workout.intensity] || "text-muted-foreground"}`}>
                      {workout.intensity}
                    </span>
                  )}
                </div>

                {workout?.tags && workout.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {workout.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${TAG_COLORS[tag] || "bg-muted text-muted-foreground border-border"}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {workout ? (
                  <div className="flex-1">
                    {workout.warmup && <WorkoutSection icon="🔥" label="WARM-UP" content={workout.warmup} />}
                    {workout.activation && <WorkoutSection icon="⚡" label="ATIVAÇÃO" content={workout.activation} />}
                    {workout.strength && <WorkoutSection icon="🏋️" label="FORÇA/TÉCNICA" content={workout.strength} />}
                    {workout.wod && <WorkoutSection icon="💀" label="WOD" content={workout.wod} />}
                    {workout.notes && <WorkoutSection icon="📝" label="OBS" content={workout.notes} />}

                    <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border/20">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/treinos/${workout.id}`)} className="hover:bg-primary/10 hover:text-primary text-xs">
                        <Pencil className="h-3 w-3 mr-1" /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(workout.id)} className="hover:bg-destructive/10 hover:text-destructive text-xs">
                        <Trash2 className="h-3 w-3 mr-1" /> Excluir
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center py-8">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5"
                      onClick={() => navigate(`/admin/treinos/novo?week=${weekStartStr}&day=${index}`)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Adicionar Treino
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <WorkoutAIAssistant
        open={aiOpen}
        onOpenChange={setAiOpen}
        weekStart={weekStartStr}
        onApply={handleAIApply}
      />
    </div>
  );
};

export default AdminWorkouts;
