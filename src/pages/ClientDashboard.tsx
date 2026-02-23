import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { User, Shield, Calendar, ArrowLeft, Award, FileCheck, AlertCircle, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ClientDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [murphRegistrations, setMurphRegistrations] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMurphRegistrations();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (!error) setProfile(data);
  };

  const fetchMurphRegistrations = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("murph_registrations")
      .select("*")
      .eq("user_id", user.id);
    if (!error) setMurphRegistrations(data || []);
  };

  const getPaymentStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendente", variant: "outline" },
      approved: { label: "Confirmado", variant: "default" },
      rejected: { label: "Rejeitado", variant: "destructive" },
    };
    return statusMap[status || "pending"] || { label: "Pendente", variant: "outline" };
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <header className="bg-card/50 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-primary tracking-wider">ALPHA CROSS</span>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate("/")} size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Site
              </Button>
              <Button variant="destructive" onClick={signOut} size="sm">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Bem-vindo, <span className="text-primary">{profile?.full_name || "Guerreiro"}</span>
          </h1>
          <p className="text-muted-foreground">
            Esta é sua área pessoal. Aqui você gerencia seu treino e evolução.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Meu Perfil
              </CardTitle>
              <CardDescription>Informações da sua conta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-bold">{profile?.full_name || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-bold">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-bold">{profile?.phone || "Não informado"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Status
              </CardTitle>
              <CardDescription>Seu status de treino</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Plano</p>
                  <p className="font-bold">Guerreiro Ativo</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Membro desde</p>
                  <p className="font-bold">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("pt-BR") : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Minhas Inscrições
              </CardTitle>
              <CardDescription>Eventos e competições</CardDescription>
            </CardHeader>
            <CardContent>
              {murphRegistrations.length > 0 ? (
                <div className="space-y-4">
                  {murphRegistrations.map((registration) => {
                    const statusBadge = getPaymentStatusBadge(registration.payment_status);
                    return (
                      <div key={registration.id} className="p-4 rounded-lg bg-background/50 border border-border/30 space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-foreground">Murph Challenge</h4>
                          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground">
                            Camiseta: <span className="font-medium text-foreground">{registration.shirt_size?.toUpperCase()}</span>
                          </p>
                          <p className="text-muted-foreground">
                            Inscrito em: <span className="font-medium text-foreground">
                              {new Date(registration.created_at).toLocaleDateString("pt-BR")}
                            </span>
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {registration.receipt_url ? (
                              <>
                                <FileCheck className="h-4 w-4 text-green-500" />
                                <span className="text-green-500 font-medium text-xs">Comprovante enviado</span>
                              </>
                            ) : (
                              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-2 flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <span className="text-yellow-500 font-medium text-xs">
                                  Ação necessária: Envie seu comprovante de pagamento
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Você ainda não possui inscrições</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Meus Treinos
              </CardTitle>
              <CardDescription>Histórico e próximas sessões</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Em breve: Sistema de agendamento</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <blockquote className="text-2xl font-bold text-foreground italic">
            "A vitória espera aqueles que têm <span className="text-primary">disciplina</span>."
          </blockquote>
          <p className="text-muted-foreground mt-2">- Legado Espartano</p>
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;
