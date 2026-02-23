import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "" });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setForm({ full_name: data.full_name || "", phone: data.phone || "" });
        setLoading(false);
      });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: form.full_name, phone: form.phone })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-black text-foreground mb-6 flex items-center gap-2">
        <UserCircle className="h-6 w-6 text-primary" />
        Meu Perfil
      </h1>

      <div className="glass rounded-xl p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-foreground">Email</Label>
            <Input value={user?.email || ""} disabled className="bg-background/50 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Nome completo</Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="bg-background/50 border-border/50 focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Telefone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-background/50 border-border/50 focus:border-primary"
            />
          </div>
          <Button type="submit" className="w-full bg-gradient-fire" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;
