import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";

const DAY_NAMES = ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO", "DOMINGO"];
const AVAILABLE_TAGS = ["força", "engine", "ginástica", "potência", "recuperação", "skill"];
const INTENSITIES = ["leve", "média", "alta"];

const TAG_COLORS: Record<string, string> = {
  força: "bg-red-500/20 text-red-400 border-red-500/30",
  engine: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ginástica: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  potência: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  recuperação: "bg-green-500/20 text-green-400 border-green-500/30",
  skill: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const INTENSITY_COLORS: Record<string, string> = {
  leve: "border-green-500 text-green-400",
  média: "border-yellow-500 text-yellow-400",
  alta: "border-red-500 text-red-400",
};

const AdminWorkoutForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEdit = !!id;

  const [title, setTitle] = useState("");
  const [weekStart, setWeekStart] = useState(searchParams.get("week") || "");
  const [dayOfWeek, setDayOfWeek] = useState(Number(searchParams.get("day") || 0));
  const [intensity, setIntensity] = useState("média");
  const [tags, setTags] = useState<string[]>([]);
  const [warmup, setWarmup] = useState("");
  const [activation, setActivation] = useState("");
  const [strength, setStrength] = useState("");
  const [wod, setWod] = useState("");
  const [notes, setNotes] = useState("");
  const [weekLabel, setWeekLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    const fetchWorkout = async () => {
      const { data } = await supabase
        .from("weekly_workouts")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setTitle(data.title);
        setWeekStart(data.week_start);
        setDayOfWeek(data.day_of_week);
        setIntensity(data.intensity || "média");
        setTags((data.tags as string[]) || []);
        setWarmup(data.warmup || "");
        setActivation(data.activation || "");
        setStrength(data.strength || "");
        setWod(data.wod || "");
        setNotes(data.notes || "");
        setWeekLabel(data.week_label || "");
      }
      setLoading(false);
    };
    fetchWorkout();
  }, [id, isEdit]);

  const toggleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !weekStart) return;
    setSaving(true);

    const payload = {
      title,
      intensity,
      tags,
      warmup: warmup || null,
      activation: activation || null,
      strength: strength || null,
      wod: wod || null,
      notes: notes || null,
      week_label: weekLabel || null,
    };

    if (isEdit) {
      const { error } = await supabase
        .from("weekly_workouts")
        .update(payload)
        .eq("id", id);
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Treino atualizado!" });
        navigate("/admin/treinos");
      }
    } else {
      const { error } = await supabase.from("weekly_workouts").insert({
        ...payload,
        week_start: weekStart,
        day_of_week: dayOfWeek,
        created_by: user?.id,
      });
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Treino criado!" });
        navigate("/admin/treinos");
      }
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="container mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/treinos")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <span className="font-bold text-foreground">{isEdit ? "Editar Treino" : "Novo Treino"}</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6 bg-card border-border">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Day info */}
            <div className="bg-background rounded-lg p-3 border border-border">
              <p className="text-lg font-black text-foreground">
                {DAY_NAMES[dayOfWeek]}
              </p>
              <p className="text-xs text-muted-foreground">
                Semana de {weekStart ? new Date(weekStart + "T12:00:00").toLocaleDateString("pt-BR") : ""}
              </p>
            </div>

            {/* Week label */}
            <div>
              <Label className="text-foreground text-xs">Nome da Semana (ex: "Semana 01 – Base")</Label>
              <Input
                value={weekLabel}
                onChange={(e) => setWeekLabel(e.target.value)}
                placeholder="Semana 01 – Base"
                className="bg-background border-border mt-1"
              />
            </div>

            {/* Title */}
            <div>
              <Label className="text-foreground text-xs">Título do dia</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Força + Engine"
                className="bg-background border-border mt-1"
                required
              />
            </div>

            {/* Intensity */}
            <div>
              <Label className="text-foreground text-xs mb-2 block">Intensidade</Label>
              <div className="flex gap-2">
                {INTENSITIES.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIntensity(i)}
                    className={`px-3 py-1.5 rounded border text-xs font-bold uppercase transition-all ${
                      intensity === i
                        ? INTENSITY_COLORS[i] + " border-current"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label className="text-foreground text-xs mb-2 block">Tags</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded border text-xs font-bold uppercase transition-all ${
                      tags.includes(tag)
                        ? TAG_COLORS[tag]
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Sections */}
            <div>
              <Label className="text-foreground text-xs">🔥 Warm-up</Label>
              <Textarea
                value={warmup}
                onChange={(e) => setWarmup(e.target.value)}
                placeholder={"200m Run\n5min Mobilidade"}
                className="bg-background border-border mt-1 min-h-[80px] font-mono text-xs"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-foreground text-xs">⚡ Ativação</Label>
              <Textarea
                value={activation}
                onChange={(e) => setActivation(e.target.value)}
                placeholder={"3 Rounds:\n10 Air Squat\n10 Push-up"}
                className="bg-background border-border mt-1 min-h-[80px] font-mono text-xs"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-foreground text-xs">🏋️ Força/Técnica</Label>
              <Textarea
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder={"Back Squat:\n2x5 @55%\n2x5 @60%\n2x4 @65%"}
                className="bg-background border-border mt-1 min-h-[100px] font-mono text-xs"
                rows={4}
              />
            </div>

            <div>
              <Label className="text-foreground text-xs">💀 WOD</Label>
              <Textarea
                value={wod}
                onChange={(e) => setWod(e.target.value)}
                placeholder={"4 RFT:\n10 Thruster 40/25kg\n10 Burpee Over Bar\n200m Run\n\nTC: 14min"}
                className="bg-background border-border mt-1 min-h-[120px] font-mono text-xs"
                rows={5}
              />
            </div>

            <div>
              <Label className="text-foreground text-xs">📝 Observações</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Início do ciclo – cargas moderadas..."
                className="bg-background border-border mt-1 min-h-[60px] font-mono text-xs"
                rows={2}
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-fire" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : isEdit ? "Atualizar Treino" : "Criar Treino"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default AdminWorkoutForm;
