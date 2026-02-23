import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LogOut, Users, Plus, Search, Shield, UserCheck, UserX, RotateCcw, Pencil, Dumbbell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserListItem {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  status: string;
  plan_name: string | null;
  plan_status: string | null;
  last_login: string | null;
  created_at: string;
}

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
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
      const data = await response.json();
      setUsers(data || []);
    } else {
      toast({ title: "Erro", description: "Não foi possível carregar os usuários.", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleResetPassword = async (userId: string, userName: string) => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=reset-password`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      toast({ title: "Link gerado", description: data.message });
    } else {
      toast({ title: "Erro", description: "Não foi possível gerar o link de reset.", variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status !== "active").length,
    admins: users.filter((u) => u.role === "admin").length,
  };

  const statCards = [
    { icon: Users, label: "Total", value: stats.total, color: "text-primary" },
    { icon: UserCheck, label: "Ativos", value: stats.active, color: "text-green-500" },
    { icon: UserX, label: "Inativos", value: stats.inactive, color: "text-red-500" },
    { icon: Shield, label: "Admins", value: stats.admins, color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background/60 backdrop-blur-xl border-b border-border/30 px-4 py-4 sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logo-alpha-cross.png" alt="Alpha Cross" className="h-8" />
            <span className="font-bold text-foreground text-sm uppercase tracking-wider">Painel Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:bg-primary/10 hover:text-primary">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <div key={i} className="glass rounded-xl p-5 text-center border-gradient transition-all duration-300 hover:-translate-y-0.5">
              <stat.icon className={`h-6 w-6 ${stat.color} mx-auto mb-2`} />
              <p className="text-3xl font-black text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick nav */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/treinos")}
            className="gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/5"
          >
            <Dumbbell className="h-4 w-4" />
            Treinos da Semana
          </Button>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background/50 border-border/50 focus:border-primary transition-colors"
            />
          </div>
          <Button onClick={() => navigate("/admin/usuarios/novo")} className="bg-gradient-fire hover:shadow-glow-spartan transition-all duration-300">
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Perfil</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Plano</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-t border-border/20 hover:bg-card/30 transition-colors">
                      <td className="px-4 py-3 text-foreground font-medium">{u.full_name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === "admin" ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground"
                        }`}>
                          {u.role === "admin" ? "Admin" : "Cliente"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                          u.status === "active" ? "text-green-500" : "text-red-500"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-green-500" : "bg-red-500"}`} />
                          {u.status === "active" ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{u.plan_name || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/usuarios/${u.id}`)} className="hover:bg-primary/10 hover:text-primary">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleResetPassword(u.id, u.full_name || "")} className="hover:bg-primary/10 hover:text-primary">
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
