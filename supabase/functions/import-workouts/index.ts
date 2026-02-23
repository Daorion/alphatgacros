import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check admin role
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: roleData } = await adminClient.from('user_roles').select('role').eq('user_id', user.id).single();
    if (roleData?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { rawText, weekStart, weekLabel } = await req.json();

    if (!rawText || !weekStart) {
      return new Response(JSON.stringify({ error: 'rawText and weekStart are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const prompt = `Você é um parser de treinos de CrossFit. Analise o texto abaixo e extraia os treinos de cada dia da semana.

Retorne EXATAMENTE um JSON array com objetos para cada dia que tenha treino. Cada objeto deve ter:
- "day_of_week": número de 0 (segunda) a 6 (domingo)
- "title": título resumido do dia (ex: "Força + Engine")
- "intensity": "leve", "média" ou "alta" (baseado na carga e volume)
- "tags": array de strings entre ["força", "engine", "ginástica", "potência", "recuperação", "skill"]
- "warmup": texto do aquecimento/mobilidade (se houver)
- "activation": texto da ativação (se houver)
- "strength": texto da parte de força/técnica/skill (se houver)
- "wod": texto do WOD/endurance (se houver)
- "notes": observações (se houver)

Se um campo não existir, use null.
Mantenha o texto dos exercícios exatamente como está, apenas organize nas seções corretas.
Retorne APENAS o JSON array, sem markdown, sem explicações.

TEXTO DOS TREINOS DA SEMANA:
${rawText}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      console.error('AI error:', err);
      return new Response(JSON.stringify({ error: 'AI parsing failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || '';
    
    // Clean markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let workouts;
    try {
      workouts = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      return new Response(JSON.stringify({ error: 'Failed to parse AI response', raw: content }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!Array.isArray(workouts)) {
      return new Response(JSON.stringify({ error: 'AI response is not an array' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Delete existing workouts for this week
    await adminClient.from('weekly_workouts').delete().eq('week_start', weekStart);

    // Insert new workouts
    const inserts = workouts.map((w: any) => ({
      week_start: weekStart,
      day_of_week: w.day_of_week,
      title: w.title || 'Treino',
      intensity: w.intensity || 'média',
      tags: w.tags || [],
      warmup: w.warmup || null,
      activation: w.activation || null,
      strength: w.strength || null,
      wod: w.wod || null,
      notes: w.notes || null,
      week_label: weekLabel || null,
      created_by: user.id,
    }));

    const { error: insertError } = await adminClient.from('weekly_workouts').insert(inserts);
    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: insertError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(
      JSON.stringify({ success: true, imported: inserts.length, weekStart }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
