import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserCheck, UserX, Shield, Dumbbell, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserListItem {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  status: string;
  last_login: string | null;
}

const AdminOverview = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch users
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
        setUsers(await response.json());
      }

      // Fetch workout count
      const { count } = await supabase
        .from("weekly_workouts")
        .select("*", { count: "exact", head: true });
      setWorkoutCount(count || 0);

      setLoading(false);
    };
    fetchData();
  }, []);

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status !== "active").length,
    admins: users.filter((u) => u.role === "admin").length,
  };

  const recentLogins = users
    .filter((u) => u.last_login)
    .sort((a, b) => new Date(b.last_login!).getTime() - new Date(a.last_login!).getTime())
    .slice(0, 5);

  const statCards = [
    { icon: Users, label: "Total Usuários", value: stats.total, color: "text-primary" },
    { icon: UserCheck, label: "Ativos", value: stats.active, color: "text-green-500" },
    { icon: UserX, label: "Inativos", value: stats.inactive, color: "text-red-500" },
    { icon: Shield, label: "Admins", value: stats.admins, color: "text-primary" },
    { icon: Dumbbell, label: "Treinos Criados", value: workoutCount, color: "text-primary" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-foreground mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className="glass rounded-xl p-5 text-center border-gradient transition-all duration-300 hover:-translate-y-0.5">
            <stat.icon className={`h-6 w-6 ${stat.color} mx-auto mb-2`} />
            <p className="text-3xl font-black text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent logins */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-sm font-black text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Últimos Acessos
        </h2>
        {recentLogins.length > 0 ? (
          <div className="space-y-3">
            {recentLogins.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{u.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(u.last_login!).toLocaleString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum acesso registrado.</p>
        )}
      </div>
    </div>
  );
};

export default AdminOverview;
