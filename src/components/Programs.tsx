import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const programs = [
  {
    title: "Guerreiro Iniciante",
    subtitle: "Para quem está começando sua jornada",
    level: "Iniciante",
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
    level: "Avançado",
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
    level: "Exclusivo",
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
    <section id="programs" className="py-24 px-4 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 divider-gradient" />

      <div className="container mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary text-xs font-bold uppercase tracking-[0.3em] mb-4">Nossos Programas</p>
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-foreground">
            PROGRAMAS DE <span className="text-gradient-fire">TREINAMENTO</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha seu caminho para a transformação. Cada programa foi desenvolvido para forjar guerreiros de diferentes níveis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {programs.map((program, index) => (
            <div
              key={index}
              className={`group relative rounded-xl p-6 transition-all duration-500 hover:-translate-y-2 ${
                program.featured
                  ? "glass-strong shimmer-border hover:shadow-glow-spartan"
                  : "glass border-gradient"
              }`}
            >
              {program.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-gradient-fire text-primary-foreground text-[10px] font-black uppercase tracking-wider px-4 py-1 rounded-full">
                    Mais Popular
                  </span>
                </div>
              )}

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                    {program.level}
                  </span>
                </div>

                <h3 className="text-xl font-black mb-2 text-foreground uppercase tracking-wider">
                  {program.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  {program.subtitle}
                </p>

                <ul className="space-y-3 mb-8">
                  {program.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full group/btn transition-all duration-300 ${
                    program.featured
                      ? "bg-gradient-fire hover:shadow-glow-spartan text-primary-foreground"
                      : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                  }`}
                  onClick={() => window.open('https://api.whatsapp.com/message/YRAQS37QE3MSJ1?autoload=1&app_absent=0&utm_source=ig', '_blank')}
                >
                  Conhecer Programa
                  <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
