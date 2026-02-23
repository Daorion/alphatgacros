import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { BarChart3, Target, Flame, Calendar } from "lucide-react";

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

const TAG_COLORS: Record<string, string> = {
  força: "bg-red-500/20 text-red-400",
  engine: "bg-orange-500/20 text-orange-400",
  ginástica: "bg-purple-500/20 text-purple-400",
  potência: "bg-yellow-500/20 text-yellow-400",
  recuperação: "bg-green-500/20 text-green-400",
  skill: "bg-blue-500/20 text-blue-400",
};

const INTENSITY_COLORS: Record<string, string> = {
  leve: "bg-green-500",
  média: "bg-yellow-500",
  alta: "bg-red-500",
};

const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function extractExercises(text: string | null): string[] {
  if (!text) return [];
  const exercises: string[] = [];
  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/(?:\d+\s*(?:x|X)\s*\d+\s+)?(.+)/);
    if (match) {
      const name = match[1]
        .replace(/\d+\s*(?:x|X)\s*\d+/g, "")
        .replace(/@?\d+%/g, "")
        .replace(/\d+\/\d+\s*(?:kg|lbs)/gi, "")
        .replace(/\d+\s*(?:kg|lbs)/gi, "")
        .replace(/TC:\s*\d+\s*min/gi, "")
        .replace(/^\d+\s+/, "")
        .replace(/\s+\d+$/, "")
        .trim();
      if (name && name.length > 2 && !/^\d+$/.test(name) && !/^[\d\s"']+$/.test(name)) {
        exercises.push(name.toLowerCase());
      }
    }
  }
  return exercises;
}

const AdminInsights = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase
        .from("weekly_workouts")
        .select("*")
        .order("week_start", { ascending: false });
      setWorkouts((data as Workout[]) || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  // --- Analytics ---
  const tagCounts: Record<string, number> = {};
  workouts.forEach((w) => {
    w.tags?.forEach((tag) => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; });
  });
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const maxTagCount = sortedTags[0]?.[1] || 1;

  const intensityCounts: Record<string, number> = { leve: 0, média: 0, alta: 0 };
  workouts.forEach((w) => {
    if (w.intensity && intensityCounts[w.intensity] !== undefined) {
      intensityCounts[w.intensity]++;
    }
  });
  const totalIntensity = Object.values(intensityCounts).reduce((a, b) => a + b, 0) || 1;

  const dayCounts = Array(7).fill(0);
  workouts.forEach((w) => { dayCounts[w.day_of_week]++; });
  const maxDayCount = Math.max(...dayCounts) || 1;

  const exerciseFreq: Record<string, number> = {};
  workouts.forEach((w) => {
    const allText = [w.warmup, w.activation, w.strength, w.wod].join("\n");
    const exercises = extractExercises(allText);
    exercises.forEach((ex) => {
      const normalized = ex
        .replace(/\s+/g, " ")
        .replace(/back squat/i, "Back Squat")
        .replace(/front squat/i, "Front Squat")
        .replace(/deadlift/i, "Deadlift")
        .replace(/pull[\s-]?up/i, "Pull-Up")
        .replace(/push[\s-]?up/i, "Push-Up")
        .replace(/wall ball/i, "Wall Ball")
        .replace(/burpee/i, "Burpee")
        .replace(/box jump/i, "Box Jump")
        .replace(/kb swing|kettlebell swing/i, "KB Swing")
        .replace(/thruster/i, "Thruster")
        .replace(/clean.*jerk/i, "Clean & Jerk")
        .replace(/power clean/i, "Power Clean")
        .replace(/power snatch/i, "Power Snatch")
        .replace(/snatch/i, "Snatch")
        .replace(/air squat/i, "Air Squat")
        .replace(/walking lunge/i, "Walking Lunges")
        .replace(/toes.*bar|t2b/i, "Toes to Bar")
        .replace(/muscle[\s-]?up/i, "Muscle-Up")
        .replace(/hspu|hand stand push/i, "HSPU")
        .replace(/devil press/i, "Devil Press")
        .replace(/shoulder press|strict press/i, "Shoulder Press")
        .replace(/bench press/i, "Bench Press")
        .replace(/remada curvada/i, "Remada Curvada");

      if (normalized.length > 3) {
        exerciseFreq[normalized] = (exerciseFreq[normalized] || 0) + 1;
      }
    });
  });
  const sortedExercises = Object.entries(exerciseFreq).sort((a, b) => b[1] - a[1]).slice(0, 20);
  const maxExerciseCount = sortedExercises[0]?.[1] || 1;

  const uniqueWeeks = new Set(workouts.map((w) => w.week_start));

  const allTags = ["força", "engine", "ginástica", "potência", "recuperação", "skill"];
  const missingTags = allTags.filter((tag) => !tagCounts[tag] || tagCounts[tag] < 3);

  return (
    <div>
      <h1 className="text-2xl font-black text-foreground mb-6">Insights</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 bg-card border-border text-center">
          <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-black text-foreground">{uniqueWeeks.size}</p>
          <p className="text-xs text-muted-foreground">Semanas</p>
        </Card>
        <Card className="p-4 bg-card border-border text-center">
          <BarChart3 className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-black text-foreground">{workouts.length}</p>
          <p className="text-xs text-muted-foreground">Treinos</p>
        </Card>
        <Card className="p-4 bg-card border-border text-center">
          <Target className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-black text-foreground">{sortedExercises.length}</p>
          <p className="text-xs text-muted-foreground">Exercícios únicos</p>
        </Card>
        <Card className="p-4 bg-card border-border text-center">
          <Flame className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-black text-foreground">{intensityCounts.alta}</p>
          <p className="text-xs text-muted-foreground">Dias de alta intensidade</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tag distribution */}
        <Card className="p-6 bg-card border-border">
          <h3 className="text-base font-black text-foreground mb-4">📊 Distribuição por Categoria</h3>
          {sortedTags.length > 0 ? (
            <div className="space-y-3">
              {sortedTags.map(([tag, count]) => (
                <div key={tag}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${TAG_COLORS[tag] || "bg-muted text-muted-foreground"}`}>{tag}</span>
                    <span className="text-xs text-muted-foreground">{count}x</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(count / maxTagCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Sem dados de categorias.</p>
          )}
        </Card>

        {/* Intensity distribution */}
        <Card className="p-6 bg-card border-border">
          <h3 className="text-base font-black text-foreground mb-4">🔥 Distribuição de Intensidade</h3>
          <div className="space-y-3">
            {(["leve", "média", "alta"] as const).map((intensity) => {
              const count = intensityCounts[intensity];
              const pct = Math.round((count / totalIntensity) * 100);
              return (
                <div key={intensity}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-foreground capitalize">{intensity}</span>
                    <span className="text-xs text-muted-foreground">{count}x ({pct}%)</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className={`${INTENSITY_COLORS[intensity]} h-3 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Day coverage */}
        <Card className="p-6 bg-card border-border">
          <h3 className="text-base font-black text-foreground mb-4">📅 Cobertura por Dia da Semana</h3>
          <div className="grid grid-cols-7 gap-2">
            {DAY_NAMES.map((day, i) => {
              const count = dayCounts[i];
              const height = Math.max(20, (count / maxDayCount) * 100);
              return (
                <div key={day} className="flex flex-col items-center">
                  <div className="w-full bg-muted rounded-t" style={{ height: '80px' }}>
                    <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                      <div className="w-full bg-primary rounded-t transition-all" style={{ height: `${height}%` }} />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1">{day}</p>
                  <p className="text-[10px] text-foreground font-bold">{count}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Missing areas */}
        <Card className="p-6 bg-card border-border">
          <h3 className="text-base font-black text-foreground mb-4">⚠️ Áreas com Baixa Frequência</h3>
          {missingTags.length > 0 ? (
            <div className="space-y-3">
              {missingTags.map((tag) => (
                <div key={tag} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${TAG_COLORS[tag] || "bg-muted text-muted-foreground"}`}>{tag}</span>
                  <span className="text-xs text-destructive font-bold">{tagCounts[tag] || 0} aparições — precisa de mais atenção</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-green-400">✅ Todas as categorias estão com boa cobertura!</p>
          )}
        </Card>

        {/* Top exercises */}
        <Card className="p-6 bg-card border-border lg:col-span-2">
          <h3 className="text-base font-black text-foreground mb-4">🏆 Top 20 Exercícios Mais Utilizados</h3>
          {sortedExercises.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              {sortedExercises.map(([name, count], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-5 text-right font-bold">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-foreground font-medium truncate">{name}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">{count}x</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(count / maxExerciseCount) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Sem dados de exercícios.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminInsights;
