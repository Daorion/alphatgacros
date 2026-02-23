import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Instagram } from "lucide-react";
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
    <section id="contact" className="py-20 px-4 bg-spartan-dark">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-foreground">
            COMECE SUA <span className="text-transparent bg-clip-text bg-gradient-fire">TRANSFORMAÇÃO</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Entre em contato e agende sua aula experimental. A jornada de mil quilômetros começa com um único passo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <Card className="p-8 bg-card border-2 border-border">
            <h3 className="text-2xl font-bold mb-6 text-foreground uppercase tracking-wider">
              Fale Conosco
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input name="name" placeholder="Seu Nome" className="bg-background border-border focus:border-primary" maxLength={100} required />
              <Input name="email" type="email" placeholder="Seu E-mail" className="bg-background border-border focus:border-primary" maxLength={255} required />
              <Input name="phone" type="tel" placeholder="Seu Telefone (opcional)" className="bg-background border-border focus:border-primary" maxLength={20} />
              <Textarea name="message" placeholder="Mensagem" rows={4} className="bg-background border-border focus:border-primary resize-none" maxLength={1000} required />
              <Button type="submit" variant="default" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar Mensagem"}
              </Button>
            </form>
          </Card>

          <div className="space-y-6">
            <Card
              className="p-6 bg-card border-2 border-border hover:border-primary transition-colors cursor-pointer"
              onClick={() => window.open('https://maps.app.goo.gl/8SAefB2KJ3zfttpx7', '_blank')}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-fire flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-foreground mb-1 uppercase tracking-wider">Localização</h4>
                  <p className="text-muted-foreground">Tangará da Serra, Mato Grosso</p>
                  <p className="text-primary text-sm mt-1">Ver no Google Maps →</p>
                </div>
              </div>
            </Card>

            <Card
              className="p-6 bg-card border-2 border-border hover:border-primary transition-colors cursor-pointer"
              onClick={() => window.open('https://api.whatsapp.com/message/YRAQS37QE3MSJ1?autoload=1&app_absent=0&utm_source=ig', '_blank')}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-fire flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-foreground mb-1 uppercase tracking-wider">Telefone / WhatsApp</h4>
                  <p className="text-muted-foreground">(65) 9697-2883</p>
                  <p className="text-primary text-sm mt-1">Clique para conversar →</p>
                </div>
              </div>
            </Card>

            <div className="pt-6">
              <h4 className="text-xl font-bold text-foreground mb-4 uppercase tracking-wider">Redes Sociais</h4>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="hover:bg-primary hover:border-primary"
                  onClick={() => window.open('https://www.instagram.com/alphacrosstga/', '_blank')}
                >
                  <Instagram className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
