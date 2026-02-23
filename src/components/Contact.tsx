import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Instagram, Send } from "lucide-react";
import { useState, FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(100, "Nome muito longo"),
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
  phone: z.string().trim().regex(/^[\d\s\(\)\-]+$/, "Telefone inválido").max(20, "Telefone muito longo").optional().or(z.literal("")),
  message: z.string().trim().min(10, "Mensagem muito curta").max(1000, "Mensagem muito longa")
});

export const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        message: formData.get("message") as string
      };

      const result = contactSchema.safeParse(data);

      if (!result.success) {
        const firstError = result.error.errors[0];
        toast.error(firstError.message);
        return;
      }

      const whatsappMessage = `*Nova mensagem do site*%0A%0A*Nome:* ${encodeURIComponent(result.data.name)}%0A*Email:* ${encodeURIComponent(result.data.email)}${result.data.phone ? `%0A*Telefone:* ${encodeURIComponent(result.data.phone)}` : ""}%0A%0A*Mensagem:*%0A${encodeURIComponent(result.data.message)}`;
      const whatsappUrl = `https://api.whatsapp.com/message/YRAQS37QE3MSJ1?text=${whatsappMessage}`;

      window.open(whatsappUrl, "_blank");
      toast.success("Redirecionando para WhatsApp...");
      e.currentTarget.reset();
    } catch (error) {
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 px-4 bg-spartan-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 divider-gradient" />

      <div className="container mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary text-xs font-bold uppercase tracking-[0.3em] mb-4">Contato</p>
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-foreground">
            COMECE SUA <span className="text-gradient-fire">TRANSFORMAÇÃO</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Entre em contato e agende sua aula experimental. A jornada começa com um único passo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Form */}
          <div className="glass rounded-xl p-8">
            <h3 className="text-lg font-black mb-6 text-foreground uppercase tracking-wider">
              Fale Conosco
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input name="name" placeholder="Seu Nome" className="bg-background/50 border-border/50 focus:border-primary transition-colors" maxLength={100} required />
              <Input name="email" type="email" placeholder="Seu E-mail" className="bg-background/50 border-border/50 focus:border-primary transition-colors" maxLength={255} required />
              <Input name="phone" type="tel" placeholder="Seu Telefone (opcional)" className="bg-background/50 border-border/50 focus:border-primary transition-colors" maxLength={20} />
              <Textarea name="message" placeholder="Mensagem" rows={4} className="bg-background/50 border-border/50 focus:border-primary resize-none transition-colors" maxLength={1000} required />
              <Button type="submit" className="w-full bg-gradient-fire hover:shadow-glow-spartan text-primary-foreground transition-all duration-300" size="lg" disabled={isSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? "Enviando..." : "Enviar Mensagem"}
              </Button>
            </form>
          </div>

          {/* Contact cards */}
          <div className="space-y-4">
            <div
              className="group glass rounded-xl p-5 cursor-pointer transition-all duration-300 border-gradient hover:-translate-y-1"
              onClick={() => window.open('https://maps.app.goo.gl/8SAefB2KJ3zfttpx7', '_blank')}
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground mb-1 uppercase tracking-wider">Localização</h4>
                  <p className="text-muted-foreground text-sm">Tangará da Serra, Mato Grosso</p>
                  <p className="text-primary text-xs mt-1 font-semibold">Ver no Google Maps →</p>
                </div>
              </div>
            </div>

            <div
              className="group glass rounded-xl p-5 cursor-pointer transition-all duration-300 border-gradient hover:-translate-y-1"
              onClick={() => window.open('https://api.whatsapp.com/message/YRAQS37QE3MSJ1?autoload=1&app_absent=0&utm_source=ig', '_blank')}
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground mb-1 uppercase tracking-wider">WhatsApp</h4>
                  <p className="text-muted-foreground text-sm">(65) 9697-2883</p>
                  <p className="text-primary text-xs mt-1 font-semibold">Clique para conversar →</p>
                </div>
              </div>
            </div>

            <div
              className="group glass rounded-xl p-5 cursor-pointer transition-all duration-300 border-gradient hover:-translate-y-1"
              onClick={() => window.open('https://www.instagram.com/alphacrosstga/', '_blank')}
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Instagram className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground mb-1 uppercase tracking-wider">Instagram</h4>
                  <p className="text-muted-foreground text-sm">@alphacrosstga</p>
                  <p className="text-primary text-xs mt-1 font-semibold">Seguir no Instagram →</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
