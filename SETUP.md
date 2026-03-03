# Alpha Cross – Setup com Supabase Externo

## 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Anote a **URL** e a **anon key** (Settings → API)

## 2. Rodar a migração

1. No Supabase Dashboard, vá em **SQL Editor**
2. Cole o conteúdo do arquivo `full_schema.sql` (na raiz do projeto)
3. Execute o SQL

Isso cria todas as tabelas, funções, triggers, RLS policies, storage bucket e categorias financeiras.

## 3. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-anon-key
VITE_SUPABASE_PROJECT_ID=seu-project-id
```

## 4. Deploy das Edge Functions

### Instalar Supabase CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref SEU_PROJECT_ID
```

### Configurar secrets

```bash
supabase secrets set LOVABLE_API_KEY=sua-chave-aqui
```

> **Nota:** `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são injetados automaticamente pelo Supabase nas edge functions.

> **Nota sobre IA:** A edge function `workout-ai-assistant` usa o gateway `ai.gateway.lovable.dev`. Para usar fora da Lovable, substitua por uma chamada direta à API do Google Gemini ou OpenAI, e ajuste o secret `LOVABLE_API_KEY` para a chave correspondente.

### Deploy

```bash
supabase functions deploy admin-users
supabase functions deploy import-workouts
supabase functions deploy workout-ai-assistant
```

## 5. Criar primeiro admin

Após cadastrar um usuário, promova-o a admin no SQL Editor:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('UUID-DO-USUARIO', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

## 6. Rodar o projeto

```bash
npm install
npm run dev
```
