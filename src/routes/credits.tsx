import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, Users, Heart } from "lucide-react";

export const Route = createFileRoute("/credits")({
  head: () => ({ meta: [{ title: "Créditos — Lire" }] }),
  component: CreditsScreen,
});

function CreditsScreen() {
  const navigate = useNavigate();

  return (
    <AppShell title="Créditos">
      <div className="mx-auto max-w-xl space-y-6 px-6 py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/settings" })}
          className="gap-2 mb-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Configurações
        </Button>

        {/* Cartão Principal de Créditos */}
        <div className="rounded-2xl border bg-card p-8 text-center shadow-sm space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Heart className="h-8 w-8 fill-primary/20" />
          </div>

          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Sistema Lire
            </h1>
            <p className="mt-1 text-sm font-medium text-accent">Plataforma Desktop de Tecnologia Assistiva</p>
            <p className="mt-1 text-sm text-muted-foreground">Versão 1.0.0</p>
          </div>

          <hr className="border-border/60" />

          <div className="space-y-3">
            <h2 className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Users className="h-4 w-4" /> Desenvolvido por
            </h2>
            <ul className="space-y-1.5 text-base font-medium text-foreground">
              <li>Gabriel Vidal</li>
              <li>Lethicia Laurindo</li>
              <li>Lucas Abreu</li>
              <li>Maria Eduarda</li>
              <li>Yana Fonseca</li>
            </ul>
          </div>

          <hr className="border-border/60" />

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <GraduationCap className="h-4 w-4" /> Instituição
            </div>
            <p className="pt-1 text-base font-semibold text-foreground">ETEC Albert Einstein - 3DS (2026)</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}