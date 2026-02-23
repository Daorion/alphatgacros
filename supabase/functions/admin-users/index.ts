import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await callerClient.from("user_roles").select("role").eq("user_id", caller.id).single();
    if (!roleData || roleData.role !== "admin") {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // LIST USERS
    if (req.method === "GET" && action === "list") {
      const { data: profiles, error } = await adminClient
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get roles for all users
      const { data: roles } = await adminClient.from("user_roles").select("*");
      const rolesMap: Record<string, string> = {};
      roles?.forEach((r: any) => { rolesMap[r.user_id] = r.role; });

      // Get emails from auth
      const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers();
      const emailsMap: Record<string, string> = {};
      authUsers?.forEach((u: any) => { emailsMap[u.id] = u.email; });

      const result = profiles?.map((p: any) => ({
        ...p,
        role: rolesMap[p.id] || "client",
        email: emailsMap[p.id] || "",
      }));

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE USER
    if (req.method === "POST" && action === "create") {
      const body = await req.json();
      const { email, password, full_name, role, plan_name, plan_status, next_renewal, notes } = body;

      if (!email || !password || !full_name) {
        return new Response(JSON.stringify({ error: "Email, senha e nome são obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create auth user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

      if (createError) throw createError;

      // Update profile with extra fields
      await adminClient.from("profiles").update({
        plan_name: plan_name || null,
        plan_status: plan_status || "active",
        next_renewal: next_renewal || null,
        notes: notes || null,
      }).eq("id", newUser.user.id);

      // Set role if admin
      if (role === "admin") {
        await adminClient.from("user_roles").update({ role: "admin" }).eq("user_id", newUser.user.id);
      }

      // Audit log
      await adminClient.from("audit_logs").insert({
        actor_id: caller.id,
        action: "create_user",
        target_user_id: newUser.user.id,
        details: { email, role: role || "client" },
      });

      return new Response(JSON.stringify({ id: newUser.user.id, email }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UPDATE USER
    if (req.method === "POST" && action === "update") {
      const body = await req.json();
      const { user_id, full_name, status, plan_name, plan_status, next_renewal, notes, role } = body;

      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await adminClient.from("profiles").update({
        full_name,
        status,
        plan_name,
        plan_status,
        next_renewal: next_renewal || null,
        notes,
      }).eq("id", user_id);

      // Update role
      if (role) {
        await adminClient.from("user_roles").upsert({
          user_id,
          role,
        }, { onConflict: "user_id" });
      }

      // Audit log
      await adminClient.from("audit_logs").insert({
        actor_id: caller.id,
        action: "update_user",
        target_user_id: user_id,
        details: { full_name, status, role },
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // RESET PASSWORD
    if (req.method === "POST" && action === "reset-password") {
      const body = await req.json();
      const { user_id } = body;

      // Get user email
      const { data: { user: targetUser } } = await adminClient.auth.admin.getUserById(user_id);
      if (!targetUser?.email) {
        return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate password reset link
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: "recovery",
        email: targetUser.email,
      });

      if (linkError) throw linkError;

      // Audit log
      await adminClient.from("audit_logs").insert({
        actor_id: caller.id,
        action: "reset_password",
        target_user_id: user_id,
        details: { email: targetUser.email },
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Link de reset gerado para ${targetUser.email}`,
        // In production, this would be sent via email
        reset_link: linkData?.properties?.action_link 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação não encontrada" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
