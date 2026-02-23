import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

const programs = [
  {
    title: "Guerreiro Iniciante",
    subtitle: "Para quem está começando sua jornada",
    features: [
      "Fundamentos do CrossFit",
      "Técnica e mobilidade",
      "Acompanhamento individualizado",
      "3x por semana",
    ],
  },
  {
    title: "Legião Alpha",
    subtitle: "Treinamento de alta intensidade",
    features: [
      "WODs avançados",
      "Treinamento de força",
      "Preparação para competições",
      "Ilimitado",
    ],
    featured: true,
  },
  {
    title: "Elite Espartana",
    subtitle: "Para atletas de alto desempenho",
    features: [
      "Programação personalizada",
      "Coaching individual",
      "Análise de performance",
      "Acesso total + extras",
    ],
  },
];

export const Programs = () => {
  return (
    <section id="programs" className="py-20 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-foreground">
            PROGRAMAS DE <span className="text-transparent bg-clip-text bg-gradient-fire">TREINAMENTO</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Escolha seu caminho para a transformação. Cada programa foi desenvolvido para forjar guerreiros de diferentes níveis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {programs.map((program, index) => (
            <Card
              key={index}
              className={`p-8 ${
                program.featured
                  ? 'bg-gradient-fire border-primary shadow-intense scale-105'
                  : 'bg-card border-2 border-border hover:border-primary'
              } transition-all duration-300`}
            >
              {program.featured && (
                <div className="text-center mb-4">
                  <span className="inline-block px-4 py-1 bg-spartan-black text-foreground text-sm font-bold rounded-full uppercase tracking-wider">
                    Mais Popular
                  </span>
                </div>
              )}

              <h3 className="text-2xl font-black mb-2 text-foreground uppercase tracking-wider">
                {program.title}
              </h3>
              <p className="text-muted-foreground mb-6">
                {program.subtitle}
              </p>

              <ul className="space-y-3 mb-8">
                {program.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      program.featured ? 'text-foreground' : 'text-primary'
                    }`} />
                    <span className={program.featured ? 'text-foreground font-medium' : 'text-card-foreground'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={program.featured ? "outline" : "default"}
                className="w-full"
              >
                Conhecer Programa
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
