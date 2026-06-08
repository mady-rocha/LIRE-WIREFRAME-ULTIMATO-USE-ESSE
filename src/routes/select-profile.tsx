import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Hand, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useApp } from "@/lib/app-context";

export const Route = createFileRoute("/select-profile")({
  head: () => ({
    meta: [{ title: "Escolha seu perfil — Lire" }],
  }),
  component: SelectProfile,
});

function SelectProfile() {
  const navigate = useNavigate();
  const { setModule } = useApp();
  const [selected, setSelected] = useState<Set<"jano" | "minerva">>(new Set());

  const toggle = (id: "jano" | "minerva") => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const confirm = () => {
    const primary = selected.has("jano") || selected.size === 0 ? "jano" : "minerva";
    setModule(primary);
    navigate({ to: primary === "jano" ? "/jano" : "/minerva" });
  };

  const options = [
    {
      id: "jano" as const,
      icon: BookOpen,
      title: "Módulo Jano",
      subtitle: "Tenho dificuldades de leitura",
      desc: "Leitura acessível com fontes, contraste e foco adaptáveis para dislexia, TDAH e autismo.",
    },
    {
      id: "minerva" as const,
      icon: Hand,
      title: "Módulo Minerva",
      subtitle: "Sou surdo ou me comunico em Libras",
      desc: "Tradução em Libras com avatar 3D e reconhecimento de sinais por câmera.",
    },
  ];

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <Logo size={44} />
      <h1 className="mt-6 font-display text-3xl font-bold">Como podemos te ajudar?</h1>
      <p className="mt-2 max-w-md text-center text-muted-foreground">
        Escolha um ou ambos os perfis. Você pode alterar isso depois nas Configurações.
      </p>

      <div className="mt-10 grid w-full max-w-3xl gap-5 sm:grid-cols-2">
        {options.map((o) => {
          const active = selected.has(o.id);
          return (
            <button
              key={o.id}
              onClick={() => toggle(o.id)}
              aria-pressed={active}
              className={`relative flex flex-col rounded-2xl border-2 bg-card p-6 text-left transition-colors ${
                active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
              }`}
            >
              {active && (
                <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" />
                </span>
              )}
              <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 text-accent">
                <o.icon className="h-7 w-7" />
              </span>
              <h2 className="mt-4 font-display text-xl font-bold">{o.title}</h2>
              <p className="mt-1 font-semibold text-accent">{o.subtitle}</p>
              <p className="mt-2 text-sm text-muted-foreground">{o.desc}</p>
            </button>
          );
        })}
      </div>

      <Button onClick={confirm} size="lg" className="mt-10 h-12 w-full max-w-xs text-base">
        Confirmar
      </Button>
    </main>
  );
}
