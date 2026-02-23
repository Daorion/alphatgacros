import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have a recovery session
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    if (type !== "recovery") {
      // Try to get session - if recovery link was valid, user should be logged in
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          toast({ title: "Link inválido", description: "Este link expirou ou é inválido.", variant: "destructive" });
          navigate("/login");
        }
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter no mínimo 6 caracteres.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar a senha.", variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Senha atualizada com sucesso!" });
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/images/logo-alpha-cross.png" alt="Alpha Cross" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-foreground">Nova Senha</h1>
        </div>

        <Card className="p-8 bg-card border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Nova senha</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background border-border"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Confirmar senha</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-background border-border"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-fire" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Atualizar Senha"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
