

## Plano: Permitir que a IA edite/crie treinos diretamente dos cards da semana

### Problema atual
O `WorkoutAIAssistant` em `AdminWorkouts.tsx` não recebe `onApply`, então a IA gera sugestões mas não pode salvá-las. Só funciona dentro do `AdminWorkoutForm.tsx`.

### Solução
Adicionar a capacidade de a IA salvar treinos diretamente no banco de dados a partir da página semanal, sem precisar navegar ao formulário.

### Alterações

**1. `AdminWorkouts.tsx`**
- Passar `onApply` ao `WorkoutAIAssistant` com uma função que faz upsert direto no `weekly_workouts` (insert se não existe, update se já existe para aquele `week_start` + `day_of_week`)
- Passar também `dayOfWeek` (pode ser `undefined` se não selecionado, ou adicionar UI para a IA perguntar qual dia)
- Após aplicar, chamar `fetchWorkouts()` para atualizar os cards

**2. `WorkoutAIAssistant.tsx`**
- Ajustar para que, quando `onApply` receber a suggestion, inclua o `dayOfWeek` no retorno (já vem do tool call context)
- Opcionalmente: adicionar um campo `day_of_week` ao schema do tool `apply_workout` para que a IA indique para qual dia é o treino

**3. Edge function `workout-ai-assistant`**
- Adicionar `day_of_week` como parâmetro opcional no tool `apply_workout` para a IA poder especificar o dia ao sugerir

### Fluxo resultante
1. Coach abre o assistente IA na página semanal
2. Pede "Crie treino de força para segunda"
3. IA gera o treino e chama `apply_workout` com `day_of_week: 0`
4. Botão "Aplicar" aparece → coach clica → upsert no banco → card atualiza

