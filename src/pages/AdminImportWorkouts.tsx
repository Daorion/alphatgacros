import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, CheckCircle, Loader2 } from "lucide-react";

const AdminImportWorkouts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rawText, setRawText] = useState("");
  const [weekStart, setWeekStart] = useState("");
  const [weekLabel, setWeekLabel] = useState("");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ weekStart: string; imported: number }[]>([]);

  const handleImport = async () => {
    if (!rawText.trim() || !weekStart) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-workouts", {
        body: { rawText, weekStart, weekLabel: weekLabel || null },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResults((prev) => [...prev, { weekStart: data.weekStart, imported: data.imported }]);
      toast({ title: `✅ ${data.imported} treinos importados para ${weekStart}` });
      setRawText("");
      setWeekLabel("");
    } catch (err: any) {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
    }
    setImporting(false);
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/treinos")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-xl font-black text-foreground">Importar Treinos</h1>
      </div>

      <Card className="p-6 bg-card border-border">
        <h2 className="text-lg font-black text-foreground mb-1">Importação via IA</h2>
        <p className="text-xs text-muted-foreground mb-6">
          Cole o texto dos treinos de UMA semana. A IA vai organizar automaticamente em seções (Warm-up, Ativação, Força, WOD, Obs).
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground text-xs">Data da segunda-feira</Label>
              <Input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="bg-background border-border mt-1"
              />
            </div>
            <div>
              <Label className="text-foreground text-xs">Nome da semana</Label>
              <Input
                value={weekLabel}
                onChange={(e) => setWeekLabel(e.target.value)}
                placeholder="Semana 1/5 Base"
                className="bg-background border-border mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-foreground text-xs">Texto dos treinos da semana</Label>
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={"Cole aqui o texto dos treinos...\n\nSEGUNDA\nMobilidade\nAtivação\n2 Rounds\n10 Air Squat\n...\n\nTERÇA\n..."}
              className="bg-background border-border mt-1 min-h-[300px] font-mono text-xs"
              rows={15}
            />
          </div>

          <Button
            onClick={handleImport}
            className="w-full bg-gradient-fire"
            disabled={importing || !rawText.trim() || !weekStart}
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando com IA...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importar Semana
              </>
            )}
          </Button>
        </div>
      </Card>

      {results.length > 0 && (
        <Card className="mt-4 p-4 bg-card border-border">
          <h3 className="text-sm font-bold text-foreground mb-3">Importações realizadas</h3>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-foreground">{r.weekStart}</span>
                <span className="text-muted-foreground">— {r.imported} treinos</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminImportWorkouts;
