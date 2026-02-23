import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminUserForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);

  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "client",
    status: "active",
    plan_name: "",
    plan_status: "active",
    next_renewal: "",
    notes: "",
  });

  useEffect(() => {
    if (isEditing) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=list`,
      {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      }
    );

    if (response.ok) {
      const users = await response.json();
      const user = users.find((u: any) => u.id === id);
      if (user) {
        setForm({
          email: user.email || "",
          password: "",
          full_name: user.full_name || "",
          role: user.role || "client",
          status: user.status || "active",
          plan_name: user.plan_name || "",
          plan_status: user.plan_status || "active",
          next_renewal: user.next_renewal || "",
          notes: user.notes || "",
        });
      }
    }
    setFetching(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const action = isEditing ? "update" : "create";
    const body = isEditing
      ? { user_id: id, ...form }
      : { ...form };

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=${action}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    setLoading(false);

    if (response.ok) {
      toast({ title: "Sucesso", description: isEditing ? "Usuário atualizado!" : "Usuário criado!" });
      navigate("/admin");
    } else {
      const err = await response.json();
      toast({ title: "Erro", description: err.error || "Erro ao salvar.", variant: "destructive" });
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <span className="font-bold text-foreground">
            {isEditing ? "Editar Usuário" : "Novo Usuário"}
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6 bg-card border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Nome completo *</Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="bg-background border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-background border-border"
                  required
                  disabled={isEditing}
                />
              </div>

              {!isEditing && (
                <div className="space-y-2">
                  <Label className="text-foreground">Senha inicial *</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="bg-background border-border"
                    required
                    minLength={6}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-foreground">Perfil</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Cliente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Plano</Label>
                <Input
                  value={form.plan_name}
                  onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
                  placeholder="Ex: Mensal, Trimestral, Anual"
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Situação do plano</Label>
                <Select value={form.plan_status} onValueChange={(v) => setForm({ ...form, plan_status: v })}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="overdue">Inadimplente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Próxima renovação</Label>
                <Input
                  type="date"
                  value={form.next_renewal}
                  onChange={(e) => setForm({ ...form, next_renewal: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Avisos / Recados</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Mensagem visível para o aluno..."
                className="bg-background border-border"
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-fire" disabled={loading}>
              {loading ? "Salvando..." : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? "Salvar Alterações" : "Criar Usuário"}
                </>
              )}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default AdminUserForm;
