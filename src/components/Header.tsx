import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-intense"
          : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/images/logo-alpha-cross.png" alt="Alpha Cross" className="h-10 md:h-12" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection("hero")} className="text-foreground hover:text-primary transition-colors font-bold">
              Início
            </button>
            <button onClick={() => scrollToSection("legacy")} className="text-foreground hover:text-primary transition-colors font-bold">
              Legado
            </button>
            <button onClick={() => scrollToSection("programs")} className="text-foreground hover:text-primary transition-colors font-bold">
              Programas
            </button>
            <button onClick={() => scrollToSection("contact")} className="text-foreground hover:text-primary transition-colors font-bold">
              Contato
            </button>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-foreground p-2 hover:bg-accent rounded-md transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <button onClick={() => scrollToSection("hero")} className="text-foreground hover:text-primary transition-colors font-bold text-left">Início</button>
              <button onClick={() => scrollToSection("legacy")} className="text-foreground hover:text-primary transition-colors font-bold text-left">Legado</button>
              <button onClick={() => scrollToSection("programs")} className="text-foreground hover:text-primary transition-colors font-bold text-left">Programas</button>
              <button onClick={() => scrollToSection("contact")} className="text-foreground hover:text-primary transition-colors font-bold text-left">Contato</button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
