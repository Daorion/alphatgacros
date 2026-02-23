

## Planilha de Treinos Semanal

### Resumo
Criar uma funcionalidade de **Planilha de Treinos Semanal** onde o admin gerencia os treinos da semana (compartilhados para todos os alunos), e os clientes visualizam no seu dashboard.

---

### 1. Nova tabela no banco: `weekly_workouts`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid (PK) | Identificador |
| week_start | date (unique) | Segunda-feira da semana |
| day_of_week | integer (0-6) | Dia da semana (0=Segunda ... 6=Domingo) |
| title | text | Nome do treino (ex: "WOD Alpha") |
| description | text | Detalhes do treino (exercicios, reps, tempo) |
| created_by | uuid | ID do admin que criou |
| created_at / updated_at | timestamptz | Controle temporal |

**RLS:**
- Admins: CRUD completo
- Clientes autenticados: somente leitura (SELECT)

---

### 2. Arquivos a criar/modificar

**Novos:**
- `src/pages/AdminWorkouts.tsx` -- Pagina admin para gerenciar treinos da semana (selecionar semana, adicionar/editar/remover treinos por dia)
- `src/pages/AdminWorkoutForm.tsx` -- Formulario para criar/editar um treino de um dia especifico

**Modificados:**
- `src/App.tsx` -- Adicionar rotas `/admin/treinos` e `/admin/treinos/novo`
- `src/pages/AdminDashboard.tsx` -- Adicionar botao/link de navegacao para "Treinos da Semana"
- `src/pages/ClientDashboard.tsx` -- Adicionar card mostrando os treinos da semana atual

---

### 3. Fluxo Admin

1. No painel admin, clicar em "Treinos da Semana"
2. Ver a semana atual com os 7 dias (Seg-Dom)
3. Navegar entre semanas (anterior/proxima)
4. Para cada dia: adicionar, editar ou remover o treino
5. Cada treino tem titulo e descricao (texto livre para detalhar exercicios)

### 4. Fluxo Cliente

1. No dashboard do cliente, ver um card "Treinos da Semana"
2. Exibe os treinos da semana atual organizados por dia
3. Somente leitura

---

### Detalhes Tecnicos

**Migracao SQL:**
```text
CREATE TABLE public.weekly_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  title text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(week_start, day_of_week)
);

ALTER TABLE public.weekly_workouts ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "Admins can do everything on workouts"
  ON public.weekly_workouts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Clients: read only
CREATE POLICY "Authenticated users can view workouts"
  ON public.weekly_workouts FOR SELECT TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_weekly_workouts_updated_at
  BEFORE UPDATE ON public.weekly_workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Rotas novas no App.tsx:**
- `/admin/treinos` -> `AdminWorkouts` (protegida, admin)
- `/admin/treinos/novo` -> `AdminWorkoutForm` (protegida, admin)
- `/admin/treinos/:id` -> `AdminWorkoutForm` para edicao

**AdminWorkouts.tsx:** Tela com seletor de semana, grid 7 dias, cada dia mostra o treino ou botao "Adicionar". Botoes de editar/excluir em cada treino.

**ClientDashboard.tsx:** Novo card "Treinos da Semana" que busca `weekly_workouts` da semana atual e mostra os treinos organizados por dia.

