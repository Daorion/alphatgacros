import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    const { error } = await signIn(email.trim(), password);
    setIsLoading(false);

    if (error) {
      toast({ title: "Erro no login", description: error, variant: "destructive" });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível enviar o email. Tente novamente.", variant: "destructive" });
    } else {
      setResetSent(true);
      toast({ title: "Email enviado", description: "Verifique sua caixa de entrada para redefinir sua senha." });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src="/images/hero-gym.webp" alt="" className="w-full h-full object-cover" aria-hidden />
        <div className="absolute inset-0 bg-spartan-black/90 backdrop-blur-sm" />
      </div>

      {/* Decorative */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-10 w-px h-40 bg-gradient-to-b from-transparent via-primary/15 to-transparent float" />
        <div className="absolute bottom-1/3 right-16 w-px h-60 bg-gradient-to-b from-transparent via-primary/10 to-transparent float-delay" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4 animate-scale-in">
        <div className="text-center mb-8">
          <img src="/images/logo-alpha-cross.png" alt="Alpha Cross" className="h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-foreground">ALPHA CROSS</h1>
          <p className="text-muted-foreground mt-2 text-sm">Área restrita</p>
        </div>

        <div className="glass-strong rounded-xl p-8">
          {!showReset ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground text-xs uppercase tracking-wider font-bold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-primary transition-colors"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground text-xs uppercase tracking-wider font-bold">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/50 border-border/50 pr-10 focus:border-primary transition-colors"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-gradient-fire hover:shadow-glow-spartan transition-all duration-300" disabled={isLoading}>
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-foreground" />
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Entrar
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setShowReset(true)}
                className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Esqueci minha senha
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">Redefinir Senha</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {resetSent
                    ? "Email enviado! Verifique sua caixa de entrada."
                    : "Digite seu email para receber o link de redefinição."}
                </p>
              </div>

              {!resetSent && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="bg-background/50 border-border/50 focus:border-primary transition-colors"
                    required
                  />
                  <Button type="submit" className="w-full bg-gradient-fire hover:shadow-glow-spartan transition-all duration-300" disabled={isLoading}>
                    {isLoading ? "Enviando..." : "Enviar Link"}
                  </Button>
                </form>
              )}

              <button
                type="button"
                onClick={() => { setShowReset(false); setResetSent(false); }}
                className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Voltar ao login
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          O cadastro é feito exclusivamente pelo administrador.
        </p>
      </div>
    </div>
  );
};

export default Login;
