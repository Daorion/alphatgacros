import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Dumbbell,
  Activity,
  Flame,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface BlocoTreino {
  tipo: string;
  texto: string;
}

interface DiaTreino {
  dia: string;
  blocos: BlocoTreino[];
  tags: string[];
  intensidade: "leve" | "média" | "alta" | "recuperação";
}

interface SemanaTreino {
  semana: number;
  titulo: string;
  dataInicio: string;
  dataFim: string;
  dias: DiaTreino[];
}

const TAG_COLORS: Record<string, string> = {
  força: "bg-red-900/60 text-red-200 border-red-700",
  ginástica: "bg-blue-900/60 text-blue-200 border-blue-700",
  engine: "bg-green-900/60 text-green-200 border-green-700",
  potência: "bg-orange-900/60 text-orange-200 border-orange-700",
  skill: "bg-purple-900/60 text-purple-200 border-purple-700",
  recuperação: "bg-emerald-900/60 text-emerald-200 border-emerald-700",
};

const INTENSIDADE_COLORS: Record<string, string> = {
  leve: "text-green-400",
  média: "text-yellow-400",
  alta: "text-red-400",
  recuperação: "text-emerald-400",
};

// Sample training data
const sampleData: SemanaTreino[] = [
  {
    semana: 1,
    titulo: "Semana 1 – Base",
    dataInicio: "06/01/2026",
    dataFim: "11/01/2026",
    dias: [
      {
        dia: "SEGUNDA",
        blocos: [
          { tipo: "Mobilidade", texto: "Mobilidade" },
          { tipo: "Ativação", texto: "2 Rounds:\n10 Air Squat\n10 Jump Squat\n10\" Isometria (Squat)" },
          { tipo: "Força/Técnica", texto: "A) Back Squat\n4x10\n\nB) Z Press\n4x10\n\nC) Core\n3x:\n30\" Prancha\n30 Abdominal" },
          { tipo: "WOD", texto: "7 Rounds For Time:\n100m Run\n10 Wall Ball\n5 Devil Press" },
        ],
        tags: ["força", "engine"],
        intensidade: "média",
      },
      {
        dia: "TERÇA",
        blocos: [
          { tipo: "Mobilidade", texto: "Mobilidade" },
          { tipo: "WOD", texto: "AMRAP 20:\n5 Pull-ups\n10 Push-ups\n15 Air Squats" },
        ],
        tags: ["ginástica", "engine"],
        intensidade: "alta",
      },
    ],
  },
];

const PlanilhaDeTreino = () => {
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const currentWeek = sampleData[currentWeekIndex];

  const filteredDias = useMemo(() => {
    if (!searchTerm) return currentWeek?.dias || [];
    return (currentWeek?.dias || []).filter(
      (dia) =>
        dia.dia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dia.blocos.some((b) => b.texto.toLowerCase().includes(searchTerm.toLowerCase())) ||
        dia.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [currentWeek, searchTerm]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Planilha de Treino - Alpha Cross</title>
      </Helmet>
      <Header />

      <main className="container mx-auto px-4 py-8 pt-28">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-foreground mb-2">
            PLANILHA DE <span className="text-transparent bg-clip-text bg-gradient-fire">TREINO</span>
          </h1>
          <p className="text-muted-foreground">Programação semanal de treinamento</p>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeekIndex(Math.max(0, currentWeekIndex - 1))}
            disabled={currentWeekIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <h2 className="text-xl font-bold text-foreground">{currentWeek?.titulo}</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeekIndex(Math.min(sampleData.length - 1, currentWeekIndex + 1))}
            disabled={currentWeekIndex === sampleData.length - 1}
          >
            Próxima
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar exercício, tag..."
            className="pl-10 bg-card border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Training Days */}
        <div className="space-y-4">
          {filteredDias.map((dia, index) => (
            <Card key={index} className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    {dia.dia}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${INTENSIDADE_COLORS[dia.intensidade]}`}>
                      {dia.intensidade.toUpperCase()}
                    </span>
                    {dia.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className={TAG_COLORS[tag] || "border-border"}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" defaultValue={dia.blocos.map((_, i) => `bloco-${i}`)}>
                  {dia.blocos.map((bloco, i) => (
                    <AccordionItem key={i} value={`bloco-${i}`}>
                      <AccordionTrigger className="text-primary font-bold">
                        {bloco.tipo}
                      </AccordionTrigger>
                      <AccordionContent>
                        <pre className="whitespace-pre-wrap text-foreground font-mono text-sm">
                          {bloco.texto}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PlanilhaDeTreino;
