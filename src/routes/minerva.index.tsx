import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Camera, Keyboard, Newspaper, ChevronRight, Hand } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { PremiumBadge } from "@/components/PremiumBadge";
import { useApp } from "@/lib/app-context";

export const Route = createFileRoute("/minerva/")({
  head: () => ({ meta: [{ title: "Início — Módulo Minerva | Lire" }] }),
  component: MinervaHome,
});

const history = [
  { text: "Bom dia, como você está?", kind: "Frase digitada" },
  { text: "Onde fica a estação mais próxima?", kind: "Conversa com avatar" },
  { text: "Obrigada pela ajuda!", kind: "Texto traduzido" },
];

function MinervaHome() {
  const { isPremium, showUpgrade } = useApp();
  const navigate = useNavigate();

  return (
    <AppShell title="Início">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h2 className="font-display text-3xl font-bold">Olá, Ana</h2>

        {/* Quick actions — larger touch targets */}
        <section className="mt-8 grid gap-5 sm:grid-cols-3">
          <BigAction
            icon={Camera}
            label="Iniciar Conversa (Câmera)"
            premium
            locked={!isPremium}
            onClick={() =>
              isPremium ? navigate({ to: "/minerva/conversa" }) : showUpgrade("Conversa por câmera")
            }
          />
          <BigAction icon={Keyboard} label="Digitar para Avatar" onClick={() => navigate({ to: "/avatar" })} />
          <BigAction icon={Newspaper} label="Blog" onClick={() => navigate({ to: "/blog" })} />
        </section>

        {/* Continue — Libras only */}
        <section className="mt-10">
          <h3 className="font-display text-2xl font-bold">Continue onde parou</h3>
          <div className="mt-4 space-y-3">
            {history.map((h) => (
              <Link
                key={h.text}
                to="/avatar"
                className="flex items-center gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <Hand className="h-7 w-7" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold">{h.text}</p>
                  <p className="text-sm text-muted-foreground">{h.kind}</p>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>

        {/* Sign of the day */}
        <section className="mt-10 flex items-center gap-5 rounded-xl border border-secondary/30 bg-secondary/5 p-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
            <Hand className="h-9 w-9" />
          </span>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Sinal do dia</p>
            <p className="font-display text-xl font-bold">“Obrigado(a)”</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function BigAction({
  icon: Icon,
  label,
  premium,
  locked,
  onClick,
}: {
  icon: typeof Camera;
  label: string;
  premium?: boolean;
  locked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex min-h-[140px] flex-col items-start justify-between gap-4 rounded-2xl border-2 bg-card p-6 text-left transition-colors hover:border-primary/60"
    >
      {premium && <PremiumBadge className="absolute right-3 top-3" />}
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-accent">
        <Icon className="h-9 w-9" />
      </span>
      <span className="text-lg font-bold">{label}</span>
    </button>
  );
}
