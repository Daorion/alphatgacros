import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";
import alphaEscudo from "@/assets/alpha-cross-escudo.png";

export const Hero = () => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 z-0">
        <img src="/images/hero-gym.webp" alt="Alpha Cross Training" className="w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-gradient-to-b from-spartan-black/95 via-spartan-dark/90 to-spartan-black/98" />
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-px h-40 bg-gradient-to-b from-transparent via-primary/20 to-transparent float" />
        <div className="absolute top-1/3 right-16 w-px h-60 bg-gradient-to-b from-transparent via-primary/15 to-transparent float-delay" />
        <div className="absolute bottom-1/4 left-1/4 w-32 h-32 border border-primary/5 rounded-full float-delay" />
        <div className="absolute top-1/4 right-1/4 w-20 h-20 border border-primary/10 rounded-full float" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        <div className="animate-fade-in flex flex-col items-center">
          {/* Logo */}
          <div className="relative mb-8">
            <div className="absolute inset-0 blur-3xl opacity-50 bg-primary/30 rounded-full scale-125 animate-glow-pulse" />
            <img
              src={alphaEscudo}
              alt="Alpha Cross - Escudo Espartano"
              className="relative w-64 h-64 md:w-80 md:h-80 lg:w-[28rem] lg:h-[28rem] drop-shadow-[0_0_60px_hsla(16,100%,50%,0.5)] animate-scale-in hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" />
            CrossFit de Elite
          </div>

          {/* Título */}
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 text-foreground tracking-tight text-center">
            ONDE O SEU LIMITE
            <br />
            <span className="text-gradient-fire">
              ENCONTRA A SUA LENDA
            </span>
          </h2>

          <p className="text-lg md:text-xl mb-12 text-muted-foreground max-w-2xl font-medium leading-relaxed text-center">
            Legado espartano de superação. Transforme sua vontade em poder através do treinamento de alta intensidade.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="group bg-gradient-fire hover:shadow-glow-spartan text-primary-foreground px-8 py-6 text-base transition-all duration-300 hover:scale-105"
              onClick={() => window.open('https://api.whatsapp.com/message/YRAQS37QE3MSJ1?autoload=1&app_absent=0&utm_source=ig', '_blank')}
            >
              Comece Sua Transformação
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-border/50 hover:border-primary/50 hover:bg-primary/5 px-8 py-6 text-base transition-all duration-300"
              onClick={() => window.open('https://www.instagram.com/alphacrosstga/', '_blank')}
            >
              Conheça a Alpha Cross
            </Button>
          </div>
        </div>

        <button
          onClick={() => document.getElementById("legacy")?.scrollIntoView({ behavior: "smooth" })}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Explorar</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </button>
      </div>
    </section>
  );
};
