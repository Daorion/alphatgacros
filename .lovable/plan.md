
# Assistente IA para Criacao de Treinos

## Objetivo

Adicionar um assistente de IA integrado na secao de treinos que atua como um **conselheiro master de CrossFit**. O coach podera conversar com a IA para:

- Gerar treinos completos para um dia especifico baseado no historico de treinos anteriores
- Receber sugestoes inteligentes considerando periodizacao, variacao de estimulos e equilibrio muscular
- Informar sobre alunos lesionados para a IA adaptar os treinos
- Preencher automaticamente os campos do formulario com a sugestao da IA
- Pedir ajustes e variantes antes de salvar

## Como vai funcionar

O coach vera um botao "Assistente IA" na pagina de treinos e no formulario de criacao/edicao. Ao clicar, abre um painel lateral (drawer) com um chat onde ele conversa com a IA. A IA:

1. Busca o historico das ultimas 4-8 semanas de treinos no banco de dados
2. Analisa o dia da semana e o contexto (dia anterior/posterior)
3. Pergunta ao coach sobre lesoes, foco da semana, equipamentos disponiveis
4. Sugere um treino completo estruturado (warmup, ativacao, forca, WOD, obs)
5. Permite ao coach pedir ajustes ("troque o back squat por front squat", "reduza o volume")
6. Com um botao "Aplicar sugestao", preenche automaticamente os campos do formulario

## Estrutura tecnica

### Nova Edge Function: `supabase/functions/workout-ai-assistant/index.ts`

- Recebe mensagens do chat + contexto (dia, semana, historico)
- Busca as ultimas semanas de treinos do banco usando o service role
- Monta um system prompt detalhado com:
  - Papel de conselheiro master de CrossFit
  - Historico dos treinos recentes formatado
  - Dia da semana atual e semana
  - Instrucoes para retornar treino estruturado em JSON quando solicitado
- Usa streaming via Lovable AI (google/gemini-3-flash-preview)
- Quando o coach pede para gerar/aplicar, retorna JSON estruturado via tool calling com os campos: title, intensity, tags, warmup, activation, strength, wod, notes

### Novo componente: `src/components/WorkoutAIAssistant.tsx`

- Drawer/Sheet lateral com chat
- Input de mensagem na parte inferior
- Historico de mensagens com markdown rendering
- Botao "Aplicar no formulario" quando a IA sugerir um treino
- Indicador de loading durante streaming
- Campo para informar lesoes/restricoes

### Modificacoes em arquivos existentes

**`src/pages/AdminWorkoutForm.tsx`**:
- Adicionar botao "Assistente IA" no header
- Importar e renderizar o WorkoutAIAssistant como Sheet
- Receber callback `onApplySuggestion` que preenche os campos do formulario automaticamente

**`src/pages/AdminWorkouts.tsx`**:
- Adicionar botao "Assistente IA" na barra de acoes (ao lado de importar)
- Abrir o assistente com contexto da semana atual

### Fluxo do chat com a IA

1. Coach abre o assistente e digita: "Crie um treino de forca + engine para segunda"
2. A edge function busca treinos das ultimas 4 semanas
3. A IA responde com sugestao conversacional e pergunta sobre lesoes
4. Coach responde: "Sim, um aluno com dor no ombro"
5. A IA adapta a sugestao removendo movimentos overhead
6. Coach diz: "Perfeito, aplica"
7. A IA retorna o treino em formato estruturado
8. O botao "Aplicar" aparece e preenche o formulario

### System prompt da IA (resumo)

- Voce e um coach master de CrossFit com 15+ anos de experiencia
- Analise o historico para evitar repeticao e garantir periodizacao
- Pergunte sobre lesoes, equipamento disponivel, nivel dos alunos
- Varie estimulos: forca, engine, ginastica, potencia, skill
- Quando pedir para gerar o treino final, use a tool `apply_workout` retornando JSON estruturado
- Respostas em portugues brasileiro

### Detalhes de implementacao

- O streaming permite que o coach veja a resposta sendo gerada em tempo real
- O historico de treinos e enviado como contexto (nao como mensagem do usuario) para nao poluir o chat
- A IA usa tool calling para retornar dados estruturados quando o coach confirma a sugestao
- O componente WorkoutAIAssistant recebe props: `weekStart`, `dayOfWeek`, `onApply` (callback com dados do treino)
