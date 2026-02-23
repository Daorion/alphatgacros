import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Hero = () => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 z-0 bg-spartan-black">
        <div className="absolute inset-0 bg-gradient-to-b from-spartan-black/95 via-spartan-dark/90 to-spartan-black/95" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="animate-fade-in">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 text-primary tracking-wider">
            ALPHA CROSS
          </h1>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 text-foreground tracking-tight">
            ONDE O SEU LIMITE
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-fire">
              ENCONTRA A SUA LENDA
            </span>
          </h2>

          <p className="text-xl md:text-2xl mb-12 text-muted-foreground max-w-3xl mx-auto font-medium">
            Legado espartano de superação. Transforme sua vontade em poder através do treinamento de alta intensidade.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="group bg-gradient-fire hover:opacity-90 text-primary-foreground"
              onClick={() => window.open('https://api.whatsapp.com/message/YRAQS37QE3MSJ1?autoload=1&app_absent=0&utm_source=ig', '_blank')}
            >
              Comece Sua Transformação
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.open('https://www.instagram.com/alphacrosstga/', '_blank')}
            >
              Conheça a Alpha Cross
            </Button>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce z-0">
          <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
            <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
};
