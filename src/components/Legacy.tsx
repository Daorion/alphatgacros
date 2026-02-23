import { Shield, Flame, Trophy, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

const values = [
  {
    icon: Shield,
    title: "Disciplina",
    description: "Como os espartanos, vivemos por um código de honra e disciplina inabaláveis.",
  },
  {
    icon: Flame,
    title: "Superação",
    description: "Cada treino é uma batalha contra seus próprios limites. A vitória é sua evolução.",
  },
  {
    icon: Trophy,
    title: "Excelência",
    description: "Buscamos a performance máxima em cada movimento, em cada repetição.",
  },
  {
    icon: Users,
    title: "Comunidade",
    description: "Unidos como uma legião, nos fortalecemos juntos na arena de batalha.",
  },
];

export const Legacy = () => {
  return (
    <section id="legacy" className="py-20 px-4 bg-spartan-dark">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-foreground">
            O LEGADO <span className="text-transparent bg-clip-text bg-gradient-fire">ESPARTANO</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A Alpha Cross não é apenas uma academia. É um campo de treinamento onde a força mental e física se unem para superar limites.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <Card
              key={index}
              className="bg-card border-2 border-border hover:border-primary transition-all duration-300 p-6 group hover:shadow-glow-spartan"
            >
              <div className="mb-4">
                <div className="w-16 h-16 rounded-lg bg-gradient-fire flex items-center justify-center group-hover:scale-110 transition-transform">
                  <value.icon className="w-8 h-8 text-foreground" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground uppercase tracking-wider">
                {value.title}
              </h3>
              <p className="text-muted-foreground">
                {value.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
