import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  Users, UserCheck, UserX, AlertTriangle, Clock, Trophy,
  TrendingDown, CreditCard, BarChart3, PieChart, UserMinus,
  Fingerprint, CalendarDays,
} from "lucide-react";
import {
  SUMMARY, TOP_CHECKINS, FREQUENCY_BY_HOUR, GENDER_DISTRIBUTION,
  AGE_DISTRIBUTION, CONTRACT_TYPES, ABANDONMENT_RISK, CHURN_REASONS,
  CHURN_BY_MONTH, PAYMENT_METHODS, CHECKIN_STATUS, REPORT_DATE,
  MISSING_CLIENTS, CONTRACT_ANALYSIS, ACCESS_METHODS, DAILY_CHECKINS_FEB,
} from "@/data/nextfit-report";

type Tab = "resumo" | "frequencia" | "ranking" | "risco" | "ausentes" | "contratos" | "evasao" | "perfil" | "financeiro";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "resumo", label: "Resumo", icon: BarChart3 },
  { key: "ranking", label: "Ranking", icon: Trophy },
  { key: "frequencia", label: "Frequência", icon: Clock },
  { key: "contratos", label: "Contratos", icon: CalendarDays },
  { key: "perfil", label: "Perfil", icon: PieChart },
  { key: "ausentes", label: "Ausentes", icon: UserMinus },
  { key: "risco", label: "Risco", icon: AlertTriangle },
  { key: "evasao", label: "Evasão", icon: TrendingDown },
  { key: "financeiro", label: "Financeiro", icon: CreditCard },
];

const AdminRelatorios = () => {
  const [tab, setTab] = useState<Tab>("resumo");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-foreground">Relatórios NextFit</h1>
        <Badge variant="outline" className="text-xs text-muted-foreground">
          Dados de {REPORT_DATE}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumo" && <ResumoTab />}
      {tab === "ranking" && <RankingTab />}
      {tab === "frequencia" && <FrequenciaTab />}
      {tab === "contratos" && <ContratosTab />}
      {tab === "perfil" && <PerfilTab />}
      {tab === "ausentes" && <AusentesTab />}
      {tab === "risco" && <RiscoTab />}
      {tab === "evasao" && <EvasaoTab />}
      {tab === "financeiro" && <FinanceiroTab />}
    </div>
  );
};

// === RESUMO ===
const ResumoTab = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <SummaryCard icon={Users} label="Total Cadastrados" value={SUMMARY.totalRegistered} />
      <SummaryCard icon={UserCheck} label="Ativos" value={SUMMARY.activeClients} color="text-green-500" />
      <SummaryCard icon={UserX} label="Inativos" value={SUMMARY.inactiveClients} color="text-muted-foreground" />
      <SummaryCard icon={TrendingDown} label="Evasões" value={SUMMARY.churnedRecent} color="text-red-500" />
      <SummaryCard icon={AlertTriangle} label="Em Risco" value={SUMMARY.atRisk} color="text-yellow-500" />
      <SummaryCard icon={Trophy} label="Maior Check-in" value={SUMMARY.peakCheckins} color="text-primary" />
    </div>

    {/* Taxa de retenção */}
    <Card className="p-6 bg-card border-border">
      <h3 className="text-base font-black text-foreground mb-4">📊 Taxa de Retenção</h3>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-muted-foreground">Ativos vs Total</span>
            <span className="text-sm font-bold text-foreground">
              {((SUMMARY.activeClients / SUMMARY.totalRegistered) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-4">
            <div
              className="bg-green-500 h-4 rounded-full transition-all"
              style={{ width: `${(SUMMARY.activeClients / SUMMARY.totalRegistered) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </Card>

    {/* Status dos que fizeram check-in */}
    <Card className="p-6 bg-card border-border">
      <h3 className="text-base font-black text-foreground mb-4">📋 Status dos Alunos com Check-in</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CHECKIN_STATUS.map((s) => (
          <div key={s.status} className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-2xl font-black text-foreground">{s.count}</p>
            <p className="text-xs text-muted-foreground">{s.status}</p>
          </div>
        ))}
      </div>
    </Card>

    {/* Top 5 rápido */}
    <Card className="p-6 bg-card border-border">
      <h3 className="text-base font-black text-foreground mb-4">🏆 Top 5 Presenças</h3>
      <div className="space-y-2">
        {TOP_CHECKINS.slice(0, 5).map((c, i) => (
          <div key={c.name} className="flex items-center gap-3">
            <span className="text-lg font-black text-primary w-8">{i + 1}º</span>
            <span className="text-sm text-foreground flex-1 truncate">{c.name}</span>
            <Badge variant="secondary" className="font-bold">{c.count} check-ins</Badge>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

// === RANKING ===
const RankingTab = () => (
  <Card className="p-6 bg-card border-border">
    <h3 className="text-base font-black text-foreground mb-4">🏆 Ranking Completo de Check-ins</h3>
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Aluno</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Último Check-in</TableHead>
            <TableHead className="text-right">Check-ins</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {TOP_CHECKINS.map((c, i) => (
            <TableRow key={c.name}>
              <TableCell className="font-black text-primary">{i + 1}</TableCell>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>
                <StatusBadge status={c.status} />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">{c.lastCheckin}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-20 bg-muted rounded-full h-2 hidden md:block">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(c.count / 47) * 100}%` }}
                    />
                  </div>
                  <span className="font-bold text-sm">{c.count}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </Card>
);

// === FREQUÊNCIA ===
const FrequenciaTab = () => {
  const maxFreq = Math.max(...FREQUENCY_BY_HOUR.map((f) => f.count));
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <h3 className="text-base font-black text-foreground mb-4">⏰ Frequência por Horário (acumulado)</h3>
        <div className="flex items-end gap-2 h-64">
          {FREQUENCY_BY_HOUR.map((f) => {
            const height = (f.count / maxFreq) * 100;
            const isPeak = f.count > 2000;
            return (
              <div key={f.hour} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-[10px] font-bold text-foreground mb-1">{f.count.toLocaleString("pt-BR")}</span>
                <div
                  className={`w-full rounded-t transition-all ${isPeak ? "bg-primary" : "bg-primary/40"}`}
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] text-muted-foreground mt-1 font-bold">{f.hour}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 bg-card border-border">
          <h3 className="text-sm font-black text-foreground mb-2">🌅 Pico Manhã</h3>
          <p className="text-3xl font-black text-primary">06h</p>
          <p className="text-sm text-muted-foreground">2.661 acessos acumulados</p>
        </Card>
        <Card className="p-6 bg-card border-border">
          <h3 className="text-sm font-black text-foreground mb-2">🌆 Pico Tarde/Noite</h3>
          <p className="text-3xl font-black text-primary">18h</p>
          <p className="text-sm text-muted-foreground">2.620 acessos acumulados</p>
        </Card>
      </div>
    </div>
  );
};

// === PERFIL ===
const PerfilTab = () => {
  const totalGender = GENDER_DISTRIBUTION.reduce((a, b) => a + b.count, 0);
  const maxAge = Math.max(...AGE_DISTRIBUTION.map((a) => a.count));
  const maxContract = Math.max(...CONTRACT_TYPES.map((c) => c.count));

  return (
    <div className="space-y-6">
      {/* Gênero */}
      <Card className="p-6 bg-card border-border">
        <h3 className="text-base font-black text-foreground mb-4">👥 Distribuição por Sexo</h3>
        <div className="flex gap-6 items-center">
          {GENDER_DISTRIBUTION.map((g) => (
            <div key={g.label} className="text-center">
              <p className="text-3xl font-black text-foreground">{g.count}</p>
              <p className="text-xs text-muted-foreground">{g.label}</p>
              <p className="text-xs font-bold text-primary">
                {((g.count / totalGender) * 100).toFixed(0)}%
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Faixa Etária */}
      <Card className="p-6 bg-card border-border">
        <h3 className="text-base font-black text-foreground mb-4">📊 Faixa Etária</h3>
        <div className="space-y-3">
          {AGE_DISTRIBUTION.map((a) => (
            <div key={a.label}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{a.label}</span>
                <span className="text-xs text-muted-foreground">{a.count} alunos</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all"
                  style={{ width: `${(a.count / maxAge) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Contratos */}
      <Card className="p-6 bg-card border-border">
        <h3 className="text-base font-black text-foreground mb-4">📄 Tipos de Contrato</h3>
        <div className="space-y-2">
          {CONTRACT_TYPES.map((c) => (
            <div key={c.label} className="flex items-center gap-3">
              <span className="text-xs text-foreground flex-1 truncate">{c.label}</span>
              <div className="w-32 bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${(c.count / maxContract) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-muted-foreground w-8 text-right">{c.count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// === RISCO ===
const RiscoTab = () => (
  <div className="space-y-4">
    <Card className="p-4 bg-destructive/10 border-destructive/20">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <span className="text-sm font-bold text-destructive">
          {ABANDONMENT_RISK.length} alunos em risco de abandono
        </span>
      </div>
    </Card>

    <Card className="p-6 bg-card border-border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead>Última Presença</TableHead>
              <TableHead className="text-right">Média Semanal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ABANDONMENT_RISK.map((r) => (
              <TableRow key={r.name}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.contract}</TableCell>
                <TableCell className="text-sm">{r.lastPresence}</TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={r.avgPresences < 2 ? "destructive" : "secondary"}
                    className="font-bold"
                  >
                    {r.avgPresences}x
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  </div>
);

// === EVASÃO ===
const EvasaoTab = () => {
  const maxChurn = Math.max(...CHURN_BY_MONTH.map((c) => c.count));
  const totalChurn = CHURN_REASONS.reduce((a, b) => a + b.count, 0);

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <h3 className="text-base font-black text-foreground mb-4">📉 Evasão por Mês</h3>
        <div className="flex items-end gap-1 h-48">
          {CHURN_BY_MONTH.map((c) => {
            const height = (c.count / maxChurn) * 100;
            return (
              <div key={c.month} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-[9px] font-bold text-foreground mb-1">{c.count}</span>
                <div
                  className="w-full bg-destructive/70 rounded-t transition-all"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[8px] text-muted-foreground mt-1 leading-tight text-center">
                  {c.month.split("/")[0]}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 bg-card border-border">
        <h3 className="text-base font-black text-foreground mb-4">📊 Motivos de Saída</h3>
        <div className="space-y-3">
          {CHURN_REASONS.map((r) => (
            <div key={r.reason}>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-foreground">{r.reason}</span>
                <span className="text-xs text-muted-foreground">
                  {r.count} ({((r.count / totalChurn) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-destructive h-2 rounded-full"
                  style={{ width: `${(r.count / totalChurn) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// === FINANCEIRO ===
const FinanceiroTab = () => {
  const totalRevenue = PAYMENT_METHODS.reduce((a, b) => a + b.total, 0);
  const totalTx = PAYMENT_METHODS.reduce((a, b) => a + b.count, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6 bg-card border-border text-center">
          <CreditCard className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-black text-foreground">
            R$ {totalRevenue.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-muted-foreground">Receita Total</p>
        </Card>
        <Card className="p-6 bg-card border-border text-center">
          <BarChart3 className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-black text-foreground">{totalTx}</p>
          <p className="text-xs text-muted-foreground">Transações</p>
        </Card>
      </div>

      <Card className="p-6 bg-card border-border">
        <h3 className="text-base font-black text-foreground mb-4">💳 Métodos de Pagamento</h3>
        <div className="space-y-3">
          {PAYMENT_METHODS.map((p) => (
            <div key={p.method}>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-foreground">{p.method}</span>
                <span className="text-xs text-muted-foreground">
                  {p.count}x — R$ {p.total.toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all"
                  style={{ width: `${(p.total / totalRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// === AUSENTES ===
const AusentesTab = () => (
  <div className="space-y-4">
    <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
      <div className="flex items-center gap-2">
        <UserMinus className="h-5 w-5 text-yellow-500" />
        <span className="text-sm font-bold text-yellow-500">
          {MISSING_CLIENTS.length} alunos com contrato ativo sem frequentar
        </span>
      </div>
    </Card>

    <Card className="p-6 bg-card border-border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="text-right">Dias Ausente</TableHead>
              <TableHead>Último Check-in</TableHead>
              <TableHead>Venc. Contrato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MISSING_CLIENTS.map((c) => (
              <TableRow key={c.name}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.phone}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={c.daysAbsent > 30 ? "destructive" : "secondary"} className="font-bold">
                    {c.daysAbsent}d
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.lastCheckin}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.contractExpiry}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  </div>
);

// === CONTRATOS ===
const ContratosTab = () => {
  const totalContracts = CONTRACT_ANALYSIS.reduce((a, b) => a + b.count, 0);
  const maxContract = Math.max(...CONTRACT_ANALYSIS.map((c) => c.count));
  const maxDaily = Math.max(...DAILY_CHECKINS_FEB.map((d) => d.count));

  return (
    <div className="space-y-6">
      {/* Resumo de contratos */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-card border-border text-center">
          <CalendarDays className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-black text-foreground">{totalContracts}</p>
          <p className="text-[10px] text-muted-foreground">Contratos Ativos</p>
        </Card>
        <Card className="p-4 bg-card border-border text-center">
          <Fingerprint className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-black text-foreground">
            {((ACCESS_METHODS[0].count / (ACCESS_METHODS[0].count + ACCESS_METHODS[1].count)) * 100).toFixed(0)}%
          </p>
          <p className="text-[10px] text-muted-foreground">Acesso por Biometria</p>
        </Card>
        <Card className="p-4 bg-card border-border text-center">
          <Users className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-black text-foreground">{ACCESS_METHODS[0].count + ACCESS_METHODS[1].count}</p>
          <p className="text-[10px] text-muted-foreground">Acessos Registrados</p>
        </Card>
      </div>

      {/* Análise de contratos */}
      <Card className="p-6 bg-card border-border">
        <h3 className="text-base font-black text-foreground mb-4">📄 Análise de Contratos (NextFit)</h3>
        <div className="space-y-2">
          {CONTRACT_ANALYSIS.map((c) => (
            <div key={c.label} className="flex items-center gap-3">
              <span className="text-xs text-foreground flex-1 truncate">{c.label}</span>
              <div className="w-40 bg-muted rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(c.count / maxContract) * 100}%` }} />
              </div>
              <span className="text-xs font-bold text-muted-foreground w-8 text-right">{c.count}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Check-ins diários Fev */}
      <Card className="p-6 bg-card border-border">
        <h3 className="text-base font-black text-foreground mb-4">📅 Check-ins Diários — Fevereiro 2026</h3>
        <div className="flex items-end gap-1 h-48">
          {DAILY_CHECKINS_FEB.map((d) => {
            const height = (d.count / maxDaily) * 100;
            const isWeekend = [7, 8, 14, 15, 21, 22].includes(d.day);
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-[8px] font-bold text-foreground mb-1">{d.count}</span>
                <div
                  className={`w-full rounded-t transition-all ${isWeekend ? "bg-muted-foreground/30" : "bg-primary"}`}
                  style={{ height: `${height}%` }}
                />
                <span className="text-[8px] text-muted-foreground mt-1">{d.day}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">Barras claras = fins de semana</p>
      </Card>

      {/* Método de acesso */}
      <Card className="p-6 bg-card border-border">
        <h3 className="text-base font-black text-foreground mb-4">🔐 Método de Acesso</h3>
        <div className="flex gap-8">
          {ACCESS_METHODS.map((a) => (
            <div key={a.method} className="text-center">
              <p className="text-3xl font-black text-foreground">{a.count.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground">{a.method}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// === HELPERS ===
const SummaryCard = ({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number; color?: string;
}) => (
  <Card className="p-4 bg-card border-border text-center">
    <Icon className={`h-5 w-5 mx-auto mb-2 ${color || "text-primary"}`} />
    <p className="text-2xl font-black text-foreground">{value.toLocaleString("pt-BR")}</p>
    <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
  </Card>
);

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    Ativo: "bg-green-500/20 text-green-400",
    Bloqueado: "bg-yellow-500/20 text-yellow-400",
    Inativo: "bg-red-500/20 text-red-400",
    Suspenso: "bg-orange-500/20 text-orange-400",
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${variants[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
};

export default AdminRelatorios;
