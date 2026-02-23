import { Shield, Flame, Trophy, Users } from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "Disciplina",
    description: "Como os espartanos, vivemos por um código de honra e disciplina inabaláveis.",
    num: "01",
  },
  {
    icon: Flame,
    title: "Superação",
    description: "Cada treino é uma batalha contra seus próprios limites. A vitória é sua evolução.",
    num: "02",
  },
  {
    icon: Trophy,
    title: "Excelência",
    description: "Buscamos a performance máxima em cada movimento, em cada repetição.",
    num: "03",
  },
  {
    icon: Users,
    title: "Comunidade",
    description: "Unidos como uma legião, nos fortalecemos juntos na arena de batalha.",
    num: "04",
  },
];

export const Legacy = () => {
  return (
    <section id="legacy" className="py-24 px-4 bg-spartan-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 divider-gradient" />

      <div className="container mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary text-xs font-bold uppercase tracking-[0.3em] mb-4">Nossos Valores</p>
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-foreground">
            O LEGADO <span className="text-gradient-fire">ESPARTANO</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A Alpha Cross não é apenas uma academia. É um campo de treinamento onde a força mental e física se unem para superar limites.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <div
              key={index}
              className="group relative glass rounded-xl p-6 transition-all duration-500 hover:bg-card/60 border-gradient hover:-translate-y-1"
            >
              {/* Decorative number */}
              <span className="absolute top-4 right-4 text-5xl font-black text-foreground/5 group-hover:text-primary/10 transition-colors">
                {value.num}
              </span>

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>

                <div className="divider-gradient w-12 mb-4 opacity-50" />

                <h3 className="text-lg font-black mb-3 text-foreground uppercase tracking-wider">
                  {value.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
