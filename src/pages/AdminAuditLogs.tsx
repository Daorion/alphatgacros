import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollText, ChevronDown, ChevronRight } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  actor_id: string;
  target_user_id: string | null;
  details: any;
  created_at: string;
  actor_name?: string;
  target_name?: string;
}

const ACTION_LABELS: Record<string, string> = {
  create_user: "Criar Usuário",
  update_user: "Atualizar Usuário",
  reset_password: "Resetar Senha",
};

const AdminAuditLogs = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchLogs = async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=audit-logs`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      if (response.ok) {
        setLogs(await response.json());
      } else {
        toast({ title: "Erro", description: "Não foi possível carregar os logs.", variant: "destructive" });
      }
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-foreground mb-6 flex items-center gap-2">
        <ScrollText className="h-6 w-6 text-primary" />
        Logs de Auditoria
      </h1>

      {logs.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum log encontrado.</p>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Ação</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Executado por</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Alvo</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      className="border-t border-border/20 hover:bg-card/30 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(log.id)}
                    >
                      <td className="px-4 py-3">
                        {expanded.has(log.id) ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground text-xs">
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary">
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {log.actor_name || log.actor_id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {log.target_name || log.target_user_id?.slice(0, 8) || "—"}
                      </td>
                    </tr>
                    {expanded.has(log.id) && (
                      <tr key={`${log.id}-details`} className="border-t border-border/10">
                        <td colSpan={5} className="px-8 py-4 bg-card/20">
                          <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;
