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

const DAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const AdminWorkoutForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEdit = !!id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [weekStart, setWeekStart] = useState(searchParams.get("week") || "");
  const [dayOfWeek, setDayOfWeek] = useState(Number(searchParams.get("day") || 0));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("weekly_workouts")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setTitle(data.title);
        setDescription(data.description || "");
        setWeekStart(data.week_start);
        setDayOfWeek(data.day_of_week);
      }
      setLoading(false);
    };
    fetch();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !weekStart) return;
    setSaving(true);

    if (isEdit) {
      const { error } = await supabase
        .from("weekly_workouts")
        .update({ title, description: description || null })
        .eq("id", id);
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Treino atualizado!" });
        navigate("/admin/treinos");
      }
    } else {
      const { error } = await supabase.from("weekly_workouts").insert({
        title,
        description: description || null,
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

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <Card className="p-6 bg-card border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-foreground">Dia</Label>
              <p className="text-sm text-primary font-semibold mt-1">
                {DAY_NAMES[dayOfWeek]} — Semana de {weekStart ? new Date(weekStart + "T12:00:00").toLocaleDateString("pt-BR") : ""}
              </p>
            </div>

            <div>
              <Label htmlFor="title" className="text-foreground">Título do treino</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: WOD Alpha"
                className="bg-background border-border mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-foreground">Descrição / Exercícios</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={"Ex:\n5 Rounds\n10 Burpees\n15 Air Squats\n20 Sit-ups"}
                className="bg-background border-border mt-1 min-h-[150px]"
                rows={6}
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-fire" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : isEdit ? "Atualizar" : "Criar Treino"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default AdminWorkoutForm;
