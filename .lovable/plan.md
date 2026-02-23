

# Painel Administrativo Completo

## Visao Geral

Transformar o painel admin atual (que e basicamente uma lista de usuarios) em um hub administrativo completo com navegacao lateral e multiplas secoes organizadas.

## Estrutura do Novo Painel

O admin tera uma **sidebar de navegacao** fixa com as seguintes secoes:

1. **Dashboard** (visao geral) - Resumo com cards de estatisticas (total usuarios, ativos, inativos, admins, treinos da semana, ultimo login)
2. **Usuarios** - Listagem completa com busca, filtros por status/plano, criar/editar/resetar senha (ja existe, sera integrado)
3. **Treinos** - Gerenciamento semanal de treinos (ja existe em `/admin/treinos`, sera integrado no layout)
4. **Insights** - Analytics de treinos (ja existe em `/admin/insights`, sera integrado)
5. **Logs de Auditoria** - Visualizacao dos logs de acoes administrativas (tabela `audit_logs` ja existe)
6. **Meu Perfil** - Dados do admin logado

## Mudancas na Interface

- Criar um **layout compartilhado** (`AdminLayout.tsx`) com sidebar + header + area de conteudo
- Sidebar colapsavel no mobile (hamburger menu)
- Header com nome do admin, foto/avatar e botao de logout
- Navegacao por abas/sidebar ao inves de paginas separadas com headers repetidos

## Secao: Logs de Auditoria (nova)

Exibir a tabela `audit_logs` com:
- Data/hora da acao
- Quem fez (actor)
- Tipo de acao (create_user, update_user, reset_password)
- Usuario alvo
- Detalhes em JSON expandivel

## Detalhes Tecnicos

### Arquivos novos:
- `src/components/AdminLayout.tsx` - Layout com sidebar, header e outlet
- `src/pages/AdminAuditLogs.tsx` - Pagina de logs de auditoria
- `src/pages/AdminProfile.tsx` - Perfil do admin
- `src/pages/AdminOverview.tsx` - Dashboard resumo (extraido do atual AdminDashboard)

### Arquivos modificados:
- `src/App.tsx` - Reorganizar rotas admin para usar layout aninhado
- `src/pages/AdminDashboard.tsx` - Refatorar para usar AdminLayout
- `src/pages/AdminWorkouts.tsx` - Remover header duplicado, usar layout
- `src/pages/AdminInsights.tsx` - Remover header duplicado, usar layout
- `src/pages/AdminUserForm.tsx` - Usar layout compartilhado

### Rota da sidebar:
- `/admin` - Overview/Dashboard
- `/admin/usuarios` - Lista de usuarios (conteudo atual do AdminDashboard)
- `/admin/usuarios/novo` - Novo usuario
- `/admin/usuarios/:id` - Editar usuario
- `/admin/treinos` - Treinos semanais
- `/admin/treinos/novo` - Novo treino
- `/admin/treinos/:id` - Editar treino
- `/admin/treinos/importar` - Importar treinos
- `/admin/insights` - Analytics
- `/admin/auditoria` - Logs
- `/admin/perfil` - Perfil do admin

### Edge function `admin-users`:
- Adicionar action `audit-logs` para listar logs com dados de perfil do actor

### Banco de dados:
- Nenhuma migracao necessaria - todas as tabelas ja existem (`profiles`, `user_roles`, `audit_logs`, `weekly_workouts`)

