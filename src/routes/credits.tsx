import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/credits')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/credits"!</div>
}
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
      <div className="mx-auto max-w-xl px-6 py-10 space-y-6">
        {/* Botão Voltar para Configurações */}
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
              Grupo de TCC — Lire
            </h1>
            <p className="text-sm font-medium text-accent mt-1">
              3º Desenvolvimento de Sistemas
            </p>
          </div>

          <hr className="border-border/60" />

          {/* Equipe */}
          <div className="space-y-3">
            <h2 className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Users className="h-4 w-4" /> Integrantes
            </h2>
            <ul className="space-y-1.5 text-base font-medium text-foreground">
              <li>Gabriel Vidal</li>
              <li>Lethicia Laurindo</li>
              <li>Lucas Abreu</li>
              <li>Maria Eduarda</li>
              <li>Yana Fonsenca</li>
            </ul>
          </div>

          <hr className="border-border/60" />

          {/* Orientação & Instituição */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <GraduationCap className="h-4 w-4" /> Orientação
            </div>
            <p className="text-base font-semibold text-foreground pt-1">
              Romeu Afecto
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              ETEC
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}