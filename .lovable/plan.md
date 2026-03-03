

## Plano: Preparar código para migração a novo projeto com Supabase externo

### Contexto
O código já está bem estruturado e usa variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) para conectar ao backend. As edge functions usam `Deno.env.get("SUPABASE_URL")` etc., que são automaticamente injetados pelo Supabase. Não há URLs ou chaves hardcoded no código.

### O que precisa ser feito

**1. Gerar um SQL consolidado de migração**
Criar um arquivo `supabase/migrations/00000000000000_full_schema.sql` que consolida todas as 5 migrações existentes em uma única, para você rodar no seu Supabase externo. Isso inclui:
- Enum `app_role`
- Tabelas: `profiles`, `user_roles`, `murph_registrations`, `audit_logs`, `weekly_workouts`, `bank_accounts`, `financial_categories`, `recurring_transactions`, `financial_transactions`
- Todas as RLS policies
- Functions: `has_role`, `handle_new_user`, `update_updated_at_column`
- Trigger `on_auth_user_created`
- Storage bucket `receipts`
- Seed de categorias financeiras

**2. Atualizar `supabase/config.toml`**
Remover o `project_id` do Lovable Cloud para que o arquivo fique genérico e pronto para apontar ao seu projeto.

**3. Criar `.env.example`**
Criar um arquivo modelo para que no novo projeto você só precise preencher com as credenciais do seu Supabase:
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-anon-key
```

**4. Ajustar o `WorkoutAIAssistant.tsx`**
O componente usa `VITE_SUPABASE_PUBLISHABLE_KEY` como Bearer token para chamar a edge function. Isso precisa ser trocado para usar o token de sessão do usuário (como as outras chamadas fazem), garantindo compatibilidade.

**5. Documentar o processo de setup**
Adicionar um `SETUP.md` com instruções claras:
1. Criar projeto no Supabase
2. Rodar a migração consolidada no SQL Editor
3. Preencher `.env` com URL e anon key
4. Configurar secrets nas edge functions (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`)
5. Deploy das edge functions

### Arquivos que serão criados/alterados

| Arquivo | Ação |
|---|---|
| `supabase/migrations/00000000000000_full_schema.sql` | Criar (SQL consolidado) |
| `.env.example` | Criar |
| `SETUP.md` | Criar |
| `supabase/config.toml` | Limpar project_id |
| `src/components/WorkoutAIAssistant.tsx` | Corrigir auth header |

### Nota importante sobre Edge Functions
As edge functions (`admin-users`, `import-workouts`, `workout-ai-assistant`) já usam `Deno.env.get()` para acessar as variáveis, então funcionarão automaticamente no novo Supabase desde que os secrets estejam configurados. A `workout-ai-assistant` usa `LOVABLE_API_KEY` para o gateway de IA da Lovable — no novo ambiente, você precisará de uma chave de API de IA alternativa (ex: Google Gemini diretamente) ou manter o gateway Lovable se disponível.

