import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Users, Shield, Activity, ArrowLeft, FileCheck, Eye, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ClientData {
  id: string;
  full_name: string;
  phone: string;
  created_at: string;
}

interface MurphRegistration {
  id: string;
  user_id: string;
  cpf: string;
  phone: string;
  shirt_size: string;
  created_at: string;
  full_name?: string;
  receipt_url?: string;
  payment_status?: string;
}

const ManagerDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [murphRegistrations, setMurphRegistrations] = useState<MurphRegistration[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, murphTotal: 0 });

  useEffect(() => {
    fetchClients();
    fetchMurphRegistrations();
  }, []);

  const fetchClients = async () => {
    const { data: profilesData, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return;

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "client");

    const clientIds = rolesData?.map((r: any) => r.user_id) || [];
    const clientProfiles = profilesData?.filter((p: any) => clientIds.includes(p.id)) || [];

    setClients(clientProfiles as ClientData[]);
    setStats(prev => ({ ...prev, total: clientProfiles.length, active: clientProfiles.length }));
  };

  const fetchMurphRegistrations = async () => {
    const { data: registrationsData, error } = await supabase
      .from("murph_registrations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return;

    const registrationsWithProfiles = await Promise.all(
      (registrationsData || []).map(async (reg: any) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", reg.user_id)
          .single();
        return { ...reg, full_name: profile?.full_name || "Sem nome" };
      })
    );

    setMurphRegistrations(registrationsWithProfiles);
    setStats(prev => ({ ...prev, murphTotal: registrationsWithProfiles.length }));
  };

  const handleApprovePayment = async (registrationId: string) => {
    const { error } = await supabase
      .from("murph_registrations")
      .update({ payment_status: "paid" })
      .eq("id", registrationId);

    if (error) {
      toast({ title: "Erro ao aprovar pagamento", variant: "destructive" });
      return;
    }

    toast({ title: "Pagamento aprovado!", description: "Inscrição confirmada." });
    fetchMurphRegistrations();
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
            Dashboard <span className="text-primary">Gestor</span>
          </h1>
          <p className="text-muted-foreground">Gerencie os guerreiros da Alpha Cross</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Total de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{stats.active}</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Inscritos MURPH
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{stats.murphTotal}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm border-border/50 mb-8">
          <CardHeader>
            <CardTitle>Inscrições MURPH Challenge</CardTitle>
            <CardDescription>Todos os inscritos para o evento</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Comprovante</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {murphRegistrations.length > 0 ? (
                  murphRegistrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">{registration.full_name}</TableCell>
                      <TableCell>{registration.cpf}</TableCell>
                      <TableCell>{registration.phone}</TableCell>
                      <TableCell className="uppercase">{registration.shirt_size}</TableCell>
                      <TableCell>
                        {registration.receipt_url ? (
                          <div className="flex items-center gap-2">
                            <FileCheck className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-500">Enviado</span>
                          </div>
                        ) : (
                          <span className="text-sm text-yellow-500">Pendente</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {registration.payment_status === "paid" ? (
                          <Badge variant="default" className="bg-green-500">Confirmado</Badge>
                        ) : (
                          <Badge variant="secondary">Aguardando</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {registration.payment_status !== "paid" && (
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => handleApprovePayment(registration.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirmar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhuma inscrição para o MURPH ainda
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>Todos os guerreiros cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length > 0 ? (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.full_name || "Sem nome"}</TableCell>
                      <TableCell>{client.phone || "Não informado"}</TableCell>
                      <TableCell>{new Date(client.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Nenhum cliente cadastrado ainda
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
          <blockquote className="text-2xl font-bold text-foreground italic">
            "Um líder lidera pelo <span className="text-primary">exemplo</span>, não pela força."
          </blockquote>
          <p className="text-muted-foreground mt-2">- Legado Espartano</p>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
