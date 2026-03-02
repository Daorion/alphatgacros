import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, Plus, CalendarIcon,
  Pencil, Trash2, Pause, Play, Download, Building2, Tags, RotateCcw,
  PieChart as PieChartIcon, Eye,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────
type BankAccount = {
  id: string; name: string; bank_name: string | null; account_type: string;
  balance: number; color: string | null; is_active: boolean; created_at: string;
};
type FinCategory = {
  id: string; name: string; type: string; color: string | null;
  is_active: boolean; created_at: string;
};
type FinTransaction = {
  id: string; description: string; amount: number; type: string;
  category_id: string | null; bank_account_id: string | null; date: string;
  is_recurring: boolean; recurring_id: string | null; payment_method: string | null;
  notes: string | null; created_by: string; created_at: string;
};
type RecurringTx = {
  id: string; description: string; amount: number; type: string;
  category_id: string | null; bank_account_id: string | null; frequency: string;
  day_of_month: number | null; start_date: string; end_date: string | null;
  is_active: boolean; created_by: string; created_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────
const curr = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const COLORS = [
  "#22c55e","#ef4444","#3b82f6","#f59e0b","#8b5cf6","#ec4899",
  "#06b6d4","#f97316","#64748b","#a855f7","#e11d48","#0ea5e9",
];

// ─── Main Component ──────────────────────────────────────────────
const AdminFinanceiro = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  // ─── Queries ────────────────────────────────────────────────────
  const { data: accounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["bank_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as BankAccount[];
    },
  });

  const { data: categories = [] } = useQuery<FinCategory[]>({
    queryKey: ["financial_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_categories").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as FinCategory[];
    },
  });

  const { data: transactions = [] } = useQuery<FinTransaction[]>({
    queryKey: ["financial_transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions").select("*").order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FinTransaction[];
    },
  });

  const { data: recurring = [] } = useQuery<RecurringTx[]>({
    queryKey: ["recurring_transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_transactions").select("*").order("description");
      if (error) throw error;
      return (data ?? []) as RecurringTx[];
    },
  });

  // ─── Derived data ──────────────────────────────────────────────
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  const txThisMonth = useMemo(
    () => transactions.filter((t) => {
      const d = parseISO(t.date);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    }),
    [transactions, monthStart, monthEnd]
  );

  const txPrevMonth = useMemo(
    () => transactions.filter((t) => {
      const d = parseISO(t.date);
      return isWithinInterval(d, { start: prevMonthStart, end: prevMonthEnd });
    }),
    [transactions, prevMonthStart, prevMonthEnd]
  );

  const receitaMes = txThisMonth.filter((t) => t.type === "receita").reduce((s, t) => s + Number(t.amount), 0);
  const despesaMes = txThisMonth.filter((t) => t.type === "despesa").reduce((s, t) => s + Number(t.amount), 0);
  const saldoMes = receitaMes - despesaMes;
  const receitaPrev = txPrevMonth.filter((t) => t.type === "receita").reduce((s, t) => s + Number(t.amount), 0);
  const despesaPrev = txPrevMonth.filter((t) => t.type === "despesa").reduce((s, t) => s + Number(t.amount), 0);

  const varReceita = receitaPrev > 0 ? ((receitaMes - receitaPrev) / receitaPrev) * 100 : 0;
  const varDespesa = despesaPrev > 0 ? ((despesaMes - despesaPrev) / despesaPrev) * 100 : 0;

  // Last 6 months chart data
  const last6 = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const m = subMonths(now, 5 - i);
      const ms = startOfMonth(m);
      const me = endOfMonth(m);
      const txs = transactions.filter((t) => {
        const d = parseISO(t.date);
        return isWithinInterval(d, { start: ms, end: me });
      });
      return {
        mes: format(m, "MMM/yy", { locale: ptBR }),
        receita: txs.filter((t) => t.type === "receita").reduce((s, t) => s + Number(t.amount), 0),
        despesa: txs.filter((t) => t.type === "despesa").reduce((s, t) => s + Number(t.amount), 0),
      };
    });
  }, [transactions]);

  // Category breakdown for pie
  const catBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    txThisMonth.filter((t) => t.type === "despesa").forEach((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      const name = cat?.name || "Sem categoria";
      map.set(name, (map.get(name) || 0) + Number(t.amount));
    });
    return Array.from(map.entries()).map(([name, value], i) => ({
      name, value, color: categories.find((c) => c.name === name)?.color || COLORS[i % COLORS.length],
    }));
  }, [txThisMonth, categories]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground text-sm">Gestão financeira completa da academia</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview"><Eye className="h-4 w-4 mr-1" />Visão Geral</TabsTrigger>
          <TabsTrigger value="transactions"><DollarSign className="h-4 w-4 mr-1" />Lançamentos</TabsTrigger>
          <TabsTrigger value="recurring"><RotateCcw className="h-4 w-4 mr-1" />Recorrentes</TabsTrigger>
          <TabsTrigger value="categories"><Tags className="h-4 w-4 mr-1" />Categorias</TabsTrigger>
          <TabsTrigger value="accounts"><Building2 className="h-4 w-4 mr-1" />Contas</TabsTrigger>
          <TabsTrigger value="analytics"><PieChartIcon className="h-4 w-4 mr-1" />Análises</TabsTrigger>
          <TabsTrigger value="export"><Download className="h-4 w-4 mr-1" />Exportar</TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: VISÃO GERAL ─────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Receita do Mês" value={receitaMes} variation={varReceita} icon={<TrendingUp className="h-5 w-5 text-emerald-500" />} />
            <SummaryCard title="Despesa do Mês" value={despesaMes} variation={varDespesa} negative icon={<TrendingDown className="h-5 w-5 text-red-500" />} />
            <SummaryCard title="Saldo do Mês" value={saldoMes} icon={<DollarSign className="h-5 w-5 text-primary" />} />
            <SummaryCard title="Contas Ativas" value={accounts.filter(a => a.is_active).length} isCount icon={<Wallet className="h-5 w-5 text-primary" />} />
          </div>

          {/* Bar chart last 6 months */}
          <Card>
            <CardHeader><CardTitle className="text-base">Receita vs Despesa — Últimos 6 meses</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last6}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="mes" className="text-xs" />
                  <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <Tooltip formatter={(v: number) => curr(v)} />
                  <Legend />
                  <Bar dataKey="receita" name="Receita" fill="#22c55e" radius={[4,4,0,0]} />
                  <Bar dataKey="despesa" name="Despesa" fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Account balances */}
          {accounts.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Saldo por Conta</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {accounts.filter(a => a.is_active).map((a) => (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: a.color || "#3b82f6" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.bank_name || a.account_type}</p>
                      </div>
                      <span className="text-sm font-bold">{curr(Number(a.balance))}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── TAB 2: LANÇAMENTOS ──────────────────────────────────── */}
        <TabsContent value="transactions" className="space-y-4">
          <TransactionsTab
            transactions={transactions}
            categories={categories}
            accounts={accounts}
            userId={user?.id || ""}
            qc={qc}
          />
        </TabsContent>

        {/* ─── TAB 3: RECORRENTES ──────────────────────────────────── */}
        <TabsContent value="recurring" className="space-y-4">
          <RecurringTab
            recurring={recurring}
            categories={categories}
            accounts={accounts}
            userId={user?.id || ""}
            qc={qc}
          />
        </TabsContent>

        {/* ─── TAB 4: CATEGORIAS ───────────────────────────────────── */}
        <TabsContent value="categories" className="space-y-4">
          <CategoriesTab categories={categories} txThisMonth={txThisMonth} qc={qc} />
        </TabsContent>

        {/* ─── TAB 5: CONTAS BANCÁRIAS ─────────────────────────────── */}
        <TabsContent value="accounts" className="space-y-4">
          <AccountsTab accounts={accounts} transactions={transactions} qc={qc} />
        </TabsContent>

        {/* ─── TAB 6: ANÁLISES ─────────────────────────────────────── */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pie chart */}
            <Card>
              <CardHeader><CardTitle className="text-base">Despesas por Categoria</CardTitle></CardHeader>
              <CardContent className="h-72">
                {catBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={catBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {catBreakdown.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => curr(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">Sem dados no mês atual</p>
                )}
              </CardContent>
            </Card>

            {/* Monthly evolution line */}
            <Card>
              <CardHeader><CardTitle className="text-base">Evolução Mensal</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={last6}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="mes" className="text-xs" />
                    <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                    <Tooltip formatter={(v: number) => curr(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="receita" name="Receita" stroke="#22c55e" strokeWidth={2} />
                    <Line type="monotone" dataKey="despesa" name="Despesa" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Ticket Médio (Receita)</p>
                <p className="text-xl font-bold mt-1">
                  {txThisMonth.filter(t => t.type === "receita").length > 0
                    ? curr(receitaMes / txThisMonth.filter(t => t.type === "receita").length)
                    : "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Maior Despesa</p>
                <p className="text-xl font-bold mt-1">
                  {txThisMonth.filter(t => t.type === "despesa").length > 0
                    ? curr(Math.max(...txThisMonth.filter(t => t.type === "despesa").map(t => Number(t.amount))))
                    : "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Total Lançamentos Mês</p>
                <p className="text-xl font-bold mt-1">{txThisMonth.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Recorrentes Ativos</p>
                <p className="text-xl font-bold mt-1">{recurring.filter(r => r.is_active).length}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── TAB 7: EXPORTAR ─────────────────────────────────────── */}
        <TabsContent value="export" className="space-y-4">
          <ExportTab transactions={transactions} categories={categories} accounts={accounts} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─── Summary Card ─────────────────────────────────────────────────
const SummaryCard = ({ title, value, variation, negative, isCount, icon }: {
  title: string; value: number; variation?: number; negative?: boolean; isCount?: boolean; icon: React.ReactNode;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold mt-2">{isCount ? value : curr(value)}</p>
      {variation !== undefined && (
        <p className={cn("text-xs mt-1", variation >= 0 ? (negative ? "text-red-500" : "text-emerald-500") : (negative ? "text-emerald-500" : "text-red-500"))}>
          {variation >= 0 ? "+" : ""}{variation.toFixed(1)}% vs mês anterior
        </p>
      )}
    </CardContent>
  </Card>
);

// ─── Transactions Tab ─────────────────────────────────────────────
const TransactionsTab = ({ transactions, categories, accounts, userId, qc }: {
  transactions: FinTransaction[]; categories: FinCategory[]; accounts: BankAccount[];
  userId: string; qc: ReturnType<typeof useQueryClient>;
}) => {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCat, setFilterCat] = useState<string>("all");

  const [form, setForm] = useState({
    description: "", amount: "", type: "despesa", category_id: "", bank_account_id: "",
    date: format(new Date(), "yyyy-MM-dd"), payment_method: "", notes: "",
  });

  const resetForm = () => {
    setForm({ description: "", amount: "", type: "despesa", category_id: "", bank_account_id: "", date: format(new Date(), "yyyy-MM-dd"), payment_method: "", notes: "" });
    setEditId(null);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        description: form.description,
        amount: parseFloat(form.amount),
        type: form.type,
        category_id: form.category_id || null,
        bank_account_id: form.bank_account_id || null,
        date: form.date,
        payment_method: form.payment_method || null,
        notes: form.notes || null,
        created_by: userId,
      };
      if (editId) {
        const { error } = await supabase.from("financial_transactions").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("financial_transactions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial_transactions"] });
      toast({ title: editId ? "Lançamento atualizado" : "Lançamento criado" });
      setOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial_transactions"] });
      toast({ title: "Lançamento excluído" });
    },
  });

  const filtered = transactions.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (filterCat !== "all" && t.category_id !== filterCat) return false;
    return true;
  });

  const openEdit = (tx: FinTransaction) => {
    setForm({
      description: tx.description, amount: String(tx.amount), type: tx.type,
      category_id: tx.category_id || "", bank_account_id: tx.bank_account_id || "",
      date: tx.date, payment_method: tx.payment_method || "", notes: tx.notes || "",
    });
    setEditId(tx.id);
    setOpen(true);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="receita">Receita</SelectItem>
            <SelectItem value="despesa">Despesa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Lançamento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div><Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Categoria</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.type === form.type).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Conta</Label>
                  <Select value={form.bank_account_id} onValueChange={(v) => setForm({ ...form, bank_account_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {accounts.filter(a => a.is_active).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Data</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div><Label>Forma Pgto</Label><Input value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} placeholder="Pix, boleto..." /></div>
              </div>
              <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <Button className="w-full" onClick={() => saveMut.mutate()} disabled={!form.description || !form.amount}>
                {editId ? "Salvar Alterações" : "Criar Lançamento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum lançamento encontrado</TableCell></TableRow>
              ) : filtered.slice(0, 50).map((tx) => {
                const cat = categories.find((c) => c.id === tx.category_id);
                const acc = accounts.find((a) => a.id === tx.bank_account_id);
                return (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">{format(parseISO(tx.date), "dd/MM/yy")}</TableCell>
                    <TableCell className="text-sm font-medium">{tx.description}</TableCell>
                    <TableCell>
                      {cat && <Badge variant="outline" className="text-xs" style={{ borderColor: cat.color || undefined }}>{cat.name}</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{acc?.name || "—"}</TableCell>
                    <TableCell className={cn("text-right text-sm font-semibold", tx.type === "receita" ? "text-emerald-500" : "text-red-500")}>
                      {tx.type === "receita" ? "+" : "-"}{curr(Number(tx.amount))}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(tx)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMut.mutate(tx.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

// ─── Recurring Tab ────────────────────────────────────────────────
const RecurringTab = ({ recurring, categories, accounts, userId, qc }: {
  recurring: RecurringTx[]; categories: FinCategory[]; accounts: BankAccount[];
  userId: string; qc: ReturnType<typeof useQueryClient>;
}) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    description: "", amount: "", type: "despesa", category_id: "", bank_account_id: "",
    frequency: "mensal", day_of_month: "",
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("recurring_transactions").insert({
        description: form.description,
        amount: parseFloat(form.amount),
        type: form.type,
        category_id: form.category_id || null,
        bank_account_id: form.bank_account_id || null,
        frequency: form.frequency,
        day_of_month: form.day_of_month ? parseInt(form.day_of_month) : null,
        created_by: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring_transactions"] });
      toast({ title: "Recorrente criado" });
      setOpen(false);
      setForm({ description: "", amount: "", type: "despesa", category_id: "", bank_account_id: "", frequency: "mensal", day_of_month: "" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("recurring_transactions").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring_transactions"] });
      toast({ title: "Atualizado" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recurring_transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring_transactions"] });
      toast({ title: "Recorrente excluído" });
    },
  });

  return (
    <>
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Recorrente</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Novo Gasto/Receita Recorrente</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div><Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Frequência</Label>
                  <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Dia do mês</Label><Input type="number" min={1} max={31} value={form.day_of_month} onChange={(e) => setForm({ ...form, day_of_month: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Categoria</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.type === form.type).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Conta</Label>
                  <Select value={form.bank_account_id} onValueChange={(v) => setForm({ ...form, bank_account_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {accounts.filter(a => a.is_active).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={() => saveMut.mutate()} disabled={!form.description || !form.amount}>Criar Recorrente</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {recurring.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum gasto recorrente cadastrado</CardContent></Card>
        ) : recurring.map((r) => {
          const cat = categories.find(c => c.id === r.category_id);
          return (
            <Card key={r.id} className={cn(!r.is_active && "opacity-50")}>
              <CardContent className="py-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{r.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {cat && <Badge variant="outline" className="text-xs" style={{ borderColor: cat.color || undefined }}>{cat.name}</Badge>}
                    <span className="text-xs text-muted-foreground capitalize">{r.frequency}</span>
                    {r.day_of_month && <span className="text-xs text-muted-foreground">• dia {r.day_of_month}</span>}
                  </div>
                </div>
                <span className={cn("text-sm font-bold", r.type === "receita" ? "text-emerald-500" : "text-red-500")}>
                  {curr(Number(r.amount))}
                </span>
                <Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Ativo" : "Pausado"}</Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleMut.mutate({ id: r.id, active: !r.is_active })}>
                    {r.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMut.mutate(r.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
};

// ─── Categories Tab ───────────────────────────────────────────────
const CategoriesTab = ({ categories, txThisMonth, qc }: {
  categories: FinCategory[]; txThisMonth: FinTransaction[];
  qc: ReturnType<typeof useQueryClient>;
}) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "despesa", color: "#6366f1" });

  const saveMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("financial_categories").insert(form);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial_categories"] });
      toast({ title: "Categoria criada" });
      setOpen(false);
      setForm({ name: "", type: "despesa", color: "#6366f1" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial_categories"] });
      toast({ title: "Categoria excluída" });
    },
  });

  const totalDespMes = txThisMonth.filter(t => t.type === "despesa").reduce((s, t) => s + Number(t.amount), 0);
  const totalRecMes = txThisMonth.filter(t => t.type === "receita").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <>
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova Categoria</Button></DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Nova Categoria</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Cor</Label><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 p-1" /></div>
              </div>
              <Button className="w-full" onClick={() => saveMut.mutate()} disabled={!form.name}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((cat) => {
          const total = txThisMonth.filter(t => t.category_id === cat.id).reduce((s, t) => s + Number(t.amount), 0);
          const base = cat.type === "despesa" ? totalDespMes : totalRecMes;
          const pct = base > 0 ? (total / base) * 100 : 0;
          return (
            <Card key={cat.id}>
              <CardContent className="py-4 flex items-center gap-3">
                <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: cat.color || "#6366f1" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{cat.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{cat.type}</p>
                  {total > 0 && <p className="text-xs text-muted-foreground">{curr(total)} ({pct.toFixed(1)}%)</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => deleteMut.mutate(cat.id)}><Trash2 className="h-3 w-3" /></Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
};

// ─── Accounts Tab ─────────────────────────────────────────────────
const AccountsTab = ({ accounts, transactions, qc }: {
  accounts: BankAccount[]; transactions: FinTransaction[];
  qc: ReturnType<typeof useQueryClient>;
}) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", bank_name: "", account_type: "corrente", balance: "", color: "#3b82f6" });

  const saveMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("bank_accounts").insert({
        ...form,
        balance: parseFloat(form.balance) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bank_accounts"] });
      toast({ title: "Conta criada" });
      setOpen(false);
      setForm({ name: "", bank_name: "", account_type: "corrente", balance: "", color: "#3b82f6" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bank_accounts"] });
      toast({ title: "Conta excluída" });
    },
  });

  return (
    <>
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova Conta</Button></DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Nova Conta Bancária</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Conta PJ Itaú" /></div>
              <div><Label>Banco</Label><Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tipo</Label>
                  <Select value={form.account_type} onValueChange={(v) => setForm({ ...form, account_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corrente">Corrente</SelectItem>
                      <SelectItem value="poupança">Poupança</SelectItem>
                      <SelectItem value="caixa">Caixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Saldo Inicial</Label><Input type="number" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} /></div>
              </div>
              <div><Label>Cor</Label><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 p-1" /></div>
              <Button className="w-full" onClick={() => saveMut.mutate()} disabled={!form.name}>Criar Conta</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {accounts.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma conta bancária cadastrada</CardContent></Card>
        ) : accounts.map((acc) => {
          const accTxs = transactions.filter(t => t.bank_account_id === acc.id).slice(0, 5);
          return (
            <Card key={acc.id}>
              <CardContent className="py-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: acc.color || "#3b82f6" }} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{acc.name}</p>
                    <p className="text-xs text-muted-foreground">{acc.bank_name} • {acc.account_type}</p>
                  </div>
                  <span className="text-lg font-bold">{curr(Number(acc.balance))}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMut.mutate(acc.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
                {accTxs.length > 0 && (
                  <div className="border-t pt-2 space-y-1">
                    <p className="text-xs text-muted-foreground mb-1">Últimas movimentações</p>
                    {accTxs.map(tx => (
                      <div key={tx.id} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{format(parseISO(tx.date), "dd/MM")} — {tx.description}</span>
                        <span className={tx.type === "receita" ? "text-emerald-500" : "text-red-500"}>
                          {tx.type === "receita" ? "+" : "-"}{curr(Number(tx.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
};

// ─── Export Tab ────────────────────────────────────────────────────
const ExportTab = ({ transactions, categories, accounts }: {
  transactions: FinTransaction[]; categories: FinCategory[]; accounts: BankAccount[];
}) => {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const exportCSV = () => {
    const filtered = transactions.filter(t => t.date >= startDate && t.date <= endDate);
    const header = "Data,Descrição,Tipo,Categoria,Conta,Valor,Forma Pgto,Observações\n";
    const rows = filtered.map(tx => {
      const cat = categories.find(c => c.id === tx.category_id)?.name || "";
      const acc = accounts.find(a => a.id === tx.bank_account_id)?.name || "";
      return `${tx.date},"${tx.description}",${tx.type},"${cat}","${acc}",${tx.amount},"${tx.payment_method || ""}","${tx.notes || ""}"`;
    }).join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${filtered.length} lançamentos exportados` });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Exportar Relatório CSV</CardTitle>
        <CardDescription>Selecione o período e exporte todos os lançamentos filtrados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Data Início</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
          <div><Label>Data Fim</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
        </div>
        <div className="text-sm text-muted-foreground">
          {transactions.filter(t => t.date >= startDate && t.date <= endDate).length} lançamentos no período selecionado
        </div>
        <Button onClick={exportCSV}><Download className="h-4 w-4 mr-2" />Exportar CSV</Button>
      </CardContent>
    </Card>
  );
};

export default AdminFinanceiro;
