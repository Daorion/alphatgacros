import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut, userRole } = useAuth();
  const navigate = useNavigate();

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

  const handleDashboardClick = () => {
    if (userRole === "manager" || userRole === "admin") {
      navigate("/dashboard/gestor");
    } else {
      navigate("/dashboard/cliente");
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
            <span className="text-2xl font-black text-primary tracking-wider">ALPHA CROSS</span>
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

          <div className="flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">Minha Conta</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleDashboardClick} className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate("/auth")} variant="default" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden md:inline">Login</span>
              </Button>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-foreground p-2 hover:bg-accent rounded-md transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
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
