

## Plano: Seção pública "Treinos da Semana" na landing page

### Objetivo
Adicionar uma nova seção na página inicial (visível sem login) que exibe os treinos da semana atual, usando a mesma tabela `weekly_workouts` que já possui RLS permitindo SELECT para usuários autenticados.

### Alterações necessárias

**1. RLS — Permitir leitura pública**
A política atual só permite SELECT para `authenticated`. Precisamos adicionar uma política para `anon` também, já que visitantes não logados precisam ver os treinos.

```sql
CREATE POLICY "Anyone can view workouts"
  ON public.weekly_workouts FOR SELECT TO anon
  USING (true);
```

**2. Novo componente `src/components/WeeklyWorkoutsPublic.tsx`**
- Busca os treinos da semana atual (calcula `week_start` = segunda-feira da semana corrente)
- Reutiliza a mesma lógica de `getMonday()` e as constantes `DAY_NAMES`, `TAG_COLORS`, `INTENSITY_COLORS` do `ClientDashboard`
- Exibe cards dos dias em grid responsivo (1 col mobile, 2 md, 3 lg)
- Cada card mostra: dia, intensidade, tags, e as seções (warmup, ativação, força, WOD)
- Destaca o dia atual com borda/glow especial
- Mostra mensagem "Nenhum treino cadastrado" se vazio
- Estilo consistente com o restante da landing (dark theme, glass cards)

**3. `src/pages/Index.tsx`**
- Importar e adicionar `<WeeklyWorkoutsPublic />` entre `<Programs />` e `<Gallery />`

**4. `src/components/Header.tsx`**
- Adicionar link "Treinos" no nav apontando para `#workouts` (scroll suave)

### Detalhes de UX
- Seção com id `workouts` para navegação por âncora
- Título: "Treino da Semana" com subtítulo mostrando o período (ex: "03/03 — 09/03")
- Dia atual destacado visualmente para o visitante saber qual treino é de hoje
- Seções colapsáveis nos cards para não sobrecarregar visualmente

