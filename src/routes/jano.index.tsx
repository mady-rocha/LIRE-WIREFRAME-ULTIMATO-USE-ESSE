import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FileText, FileType, ScanText, Lightbulb, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { PremiumBadge } from "@/components/PremiumBadge";
import { useApp } from "@/lib/app-context";

export const Route = createFileRoute("/jano/")({
  head: () => ({ meta: [{ title: "Início — Módulo Jano | Lire" }] }),
  component: JanoHome,
});

const recents = [
  { name: "Artigo — Neurociência da leitura.pdf", page: 12, total: 48 },
  { name: "Contrato de locação.pdf", page: 3, total: 9 },
  { name: "Resumo de biologia.txt", page: 5, total: 14 },
];

function JanoHome() {
  const { isPremium, showUpgrade } = useApp();
  const navigate = useNavigate();

  return (
    <AppShell title="Início">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h2 className="font-display text-3xl font-bold">Olá, Ana 👋</h2>
        <p className="mt-1 text-muted-foreground">O que você quer ler hoje?</p>

        {/* Quick actions */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <ActionCard icon={FileText} label="Importar PDF" onClick={() => navigate({ to: "/jano/reader" })} />
          <ActionCard icon={FileType} label="Importar TXT" onClick={() => navigate({ to: "/jano/reader" })} />
          <ActionCard
            icon={ScanText}
            label="Capturar imagem (OCR)"
            premium
            locked={!isPremium}
            onClick={() => (isPremium ? navigate({ to: "/jano/reader" }) : showUpgrade("OCR de imagens"))}
          />
        </section>

        {/* Continue reading */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold">Continue onde parou</h3>
            <Button variant="link" className="text-accent">Ver todos</Button>
          </div>
          <div className="mt-4 space-y-3">
            {recents.map((r) => {
              const pct = Math.round((r.page / r.total) * 100);
              return (
                <Link
                  key={r.name}
                  to="/jano/reader"
                  className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/50"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.name}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        página {r.page} de {r.total}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Tip of the day */}
        <section className="mt-10 flex items-start gap-4 rounded-xl border border-secondary/30 bg-secondary/5 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
            <Lightbulb className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold">Dica do dia</p>
            <p className="text-sm text-muted-foreground">
              Faça pausas a cada 20 minutos e olhe para um ponto distante por 20 segundos para
              reduzir a fadiga visual.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function ActionCard({
  icon: Icon,
  label,
  premium,
  locked,
  onClick,
}: {
  icon: typeof FileText;
  label: string;
  premium?: boolean;
  locked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-start gap-3 rounded-xl border bg-card p-5 text-left transition-colors hover:border-primary/50"
    >
      {premium && <PremiumBadge className="absolute right-3 top-3" />}
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-accent">
        <Icon className="h-5 w-5" />
      </span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}
