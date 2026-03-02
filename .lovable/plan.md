

## Painel de Gerenciamento Financeiro da Academia

### Visão Geral
Criar uma nova seção administrativa completa (`/admin/financeiro`) com um painel financeiro manual onde a gestora pode registrar receitas, despesas, contas bancárias e gerar relatórios comparativos.

### Tabelas no Banco de Dados (4 novas tabelas)

1. **`bank_accounts`** — Contas bancárias da academia
   - `id`, `name` (ex: "Conta PJ Itaú"), `bank_name`, `account_type` (corrente/poupança/caixa), `balance`, `color` (para gráficos), `is_active`, `created_at`

2. **`financial_categories`** — Categorias de receita/despesa
   - `id`, `name` (ex: "Aluguel", "Energia", "Salários"), `type` (receita/despesa), `color`, `is_active`, `created_at`

3. **`financial_transactions`** — Lançamentos individuais
   - `id`, `description`, `amount`, `type` (receita/despesa), `category_id` (FK), `bank_account_id` (FK), `date`, `is_recurring`, `recurring_id` (FK nullable), `payment_method`, `notes`, `created_by` (user id), `created_at`

4. **`recurring_transactions`** — Gastos/receitas recorrentes (templates)
   - `id`, `description`, `amount`, `type`, `category_id` (FK), `bank_account_id` (FK), `frequency` (mensal/semanal/anual), `day_of_month`, `start_date`, `end_date`, `is_active`, `created_by`, `created_at`

Todas com RLS restrito a admins.

### Estrutura da Página (`/admin/financeiro`)

**7 abas:**

1. **Visão Geral** — Cards de resumo (receita total mês, despesa total mês, saldo, variação vs mês anterior) + gráfico de barras receita vs despesa últimos 6 meses + saldo por conta bancária

2. **Lançamentos** — Tabela completa com filtros (período, categoria, tipo, conta), botão "Novo Lançamento" abrindo dialog com formulário, edição e exclusão inline

3. **Recorrentes** — Lista de despesas/receitas recorrentes ativas, criar/editar/pausar, indicador de próximo vencimento

4. **Categorias** — CRUD de categorias com cores, exibição de quanto cada categoria representa no mês

5. **Contas Bancárias** — CRUD de contas, saldo atual de cada, histórico de movimentação por conta

6. **Análises** — Gráfico de pizza despesas por categoria, evolução mensal (linha), comparativo mês a mês, indicadores (ticket médio, maior despesa, dia com mais gastos)

7. **Exportar** — Selecionar período e gerar CSV com todos os lançamentos filtrados

### Navegação
- Adicionar item "Financeiro" com ícone `Wallet` no sidebar do `AdminLayout.tsx`
- Rota `/admin/financeiro` no `App.tsx`

### Componentes
- `src/pages/AdminFinanceiro.tsx` — Página principal com as 7 abas
- Reutiliza componentes UI existentes (Card, Table, Dialog, Badge, charts do Recharts)

### Segurança
- RLS em todas as tabelas: somente admins podem ler/escrever
- `created_by` registra quem fez cada lançamento

