import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify user is admin
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, weekStart, dayOfWeek } = await req.json();

    // Fetch last 6 weeks of workouts for context
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
    const fromDate = sixWeeksAgo.toISOString().split("T")[0];

    const { data: workouts } = await supabaseAdmin
      .from("weekly_workouts")
      .select("*")
      .gte("week_start", fromDate)
      .order("week_start", { ascending: false })
      .order("day_of_week");

    // Format workout history for context
    let historyContext = "";
    if (workouts && workouts.length > 0) {
      const grouped: Record<string, typeof workouts> = {};
      for (const w of workouts) {
        const key = w.week_start;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(w);
      }

      historyContext = "\n\n## HISTÓRICO DE TREINOS (últimas semanas)\n\n";
      for (const [week, wks] of Object.entries(grouped)) {
        const label = wks[0]?.week_label || week;
        historyContext += `### Semana: ${label} (${week})\n`;
        for (const w of wks) {
          historyContext += `**${DAY_NAMES[w.day_of_week]}** - ${w.title}`;
          if (w.intensity) historyContext += ` [${w.intensity}]`;
          if (w.tags?.length) historyContext += ` (${w.tags.join(", ")})`;
          historyContext += "\n";
          if (w.warmup) historyContext += `  Warm-up: ${w.warmup.substring(0, 100)}...\n`;
          if (w.strength) historyContext += `  Força: ${w.strength.substring(0, 150)}...\n`;
          if (w.wod) historyContext += `  WOD: ${w.wod.substring(0, 150)}...\n`;
        }
        historyContext += "\n";
      }
    }

    const dayInfo = dayOfWeek !== undefined && dayOfWeek !== null
      ? `\n\nO coach está criando um treino para: **${DAY_NAMES[dayOfWeek]}** da semana de **${weekStart}**.`
      : weekStart
        ? `\nO coach está visualizando a semana de **${weekStart}**.`
        : "";

    const systemPrompt = `Você é um coach master de CrossFit com mais de 15 anos de experiência em programação de treinos. Você atua como conselheiro/consultor para o coach que está planejando os treinos da semana.

## Seu papel:
- Analisar o histórico de treinos para garantir periodização adequada
- Evitar repetição excessiva de movimentos e estímulos
- Variar entre: força, engine/metcon, ginástica, potência, skill, recuperação
- Considerar o equilíbrio entre grupos musculares ao longo da semana
- Perguntar sobre lesões, equipamentos disponíveis e nível dos alunos
- Sugerir treinos completos e estruturados

## Regras:
- Responda SEMPRE em português brasileiro
- Seja conciso mas detalhado nos treinos
- Use formatação markdown para organizar as respostas
- Quando o coach confirmar que quer aplicar o treino, use a tool \`apply_workout\` para retornar os dados estruturados
- Sempre pergunte se há alunos lesionados ou restrições antes de finalizar
- Considere o dia da semana: segundas costumam ser mais pesadas, sextas mais leves ou skill
${dayInfo}
${historyContext}`;

    const tools = [
      {
        type: "function",
        function: {
          name: "apply_workout",
          description:
            "Retorna o treino estruturado para preencher o formulário. Use quando o coach confirmar que quer aplicar a sugestão.",
          parameters: {
            type: "object",
            properties: {
              day_of_week: { type: "integer", description: "Dia da semana: 0=Segunda, 1=Terça, 2=Quarta, 3=Quinta, 4=Sexta, 5=Sábado, 6=Domingo. Infira do contexto da conversa." },
              title: { type: "string", description: "Título curto do treino (ex: Força + Engine)" },
              intensity: { type: "string", enum: ["leve", "média", "alta"], description: "Intensidade geral" },
              tags: {
                type: "array",
                items: { type: "string", enum: ["força", "engine", "ginástica", "potência", "recuperação", "skill"] },
                description: "Tags do treino",
              },
              warmup: { type: "string", description: "Aquecimento completo" },
              activation: { type: "string", description: "Ativação/preparação" },
              strength: { type: "string", description: "Parte de força ou técnica" },
              wod: { type: "string", description: "WOD (Workout of the Day)" },
              notes: { type: "string", description: "Observações adicionais" },
            },
            required: ["day_of_week", "title", "intensity", "tags", "warmup", "wod"],
            additionalProperties: false,
          },
        },
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        tools,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("workout-ai-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
