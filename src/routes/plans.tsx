import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Lock, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/app-context";

export const Route = createFileRoute("/plans")({
  head: () => ({ meta: [{ title: "Planos — Lire" }] }),
  component: PlansPage,
});

const plans = [
  {
    id: "free",
    name: "Gratuito",
    price: "R$0",
    period: "/sempre",
    description: "Para conhecer o Lire com recursos essenciais.",
    features: ["Leitor de documentos", "Ajustes básicos de leitura", "Acesso aos módulos Jano e Minerva"],
  },
  {
    id: "monthly",
    name: "Premium mensal",
    price: "R$19,90",
    period: "/mês",
    description: "Recursos assistivos completos sem compromisso anual.",
    features: ["OCR de imagens", "Narração por voz (TTS)", "Todos os recursos Premium"],
  },
  {
    id: "annual",
    name: "Premium anual",
    price: "R$199,90",
    period: "/ano",
    originalPrice: "R$238,80/ano",
    description: "A melhor economia para usar o Lire o ano todo.",
    features: ["Tudo do Premium mensal", "Economize R$38,90", "Todos os recursos Premium"],
  },
] as const;

function PlansPage() {
  const navigate = useNavigate();
  const { setIsPremium, setSubscriptionPlan } = useApp();

  const choosePlan = (id: (typeof plans)[number]["id"]) => {
    setSubscriptionPlan(id);
    setIsPremium(id !== "free");
    navigate({ to: "/jano" });
  };

  return (
    <AppShell title="Planos Lire">
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-accent">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold">Escolha seu plano</h1>
          <p className="mt-2 text-muted-foreground">Desbloqueie ferramentas que tornam sua leitura e comunicação mais acessíveis.</p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => {
            const premium = plan.id !== "free";
            return (
              <section key={plan.id} className={`relative flex flex-col rounded-2xl border bg-card p-6 ${plan.id === "annual" ? "border-primary shadow-lg" : ""}`}>
                {plan.id === "annual" && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">Mais vantajoso</span>}
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-bold">{plan.name}</h2>
                  {premium ? <Lock className="h-5 w-5 text-accent" /> : <Check className="h-5 w-5 text-secondary" />}
                </div>
                <p className="mt-4 text-3xl font-extrabold text-accent">{plan.price}<span className="text-sm font-medium text-muted-foreground">{plan.period}</span></p>
                {"originalPrice" in plan && <p className="mt-1 text-sm text-muted-foreground line-through">{plan.originalPrice}</p>}
                <p className="mt-3 min-h-12 text-sm text-muted-foreground">{plan.description}</p>
                <ul className="mt-5 flex-1 space-y-3 border-t border-border/60 pt-5">
                  {plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm"><Check className="h-4 w-4 shrink-0 text-accent" /> {feature}</li>)}
                </ul>
                <Button className="mt-6 w-full" variant={plan.id === "free" ? "outline" : "default"} onClick={() => choosePlan(plan.id)}>
                  {plan.id === "free" ? "Continuar grátis" : "Assinar"}
                </Button>
              </section>
            );
          })}
        </div>
      </main>
    </AppShell>
  );
}