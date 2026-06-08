import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, Send, RefreshCcw, Hand } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PremiumBadge } from "@/components/PremiumBadge";
import { useApp } from "@/lib/app-context";

export const Route = createFileRoute("/minerva/conversa")({
  head: () => ({ meta: [{ title: "Conversa por câmera — Minerva | Lire" }] }),
  component: Conversa,
});

function Conversa() {
  const { isPremium, showUpgrade } = useApp();
  const [text, setText] = useState("");

  useEffect(() => {
    if (!isPremium) showUpgrade("Conversa por câmera (Libras → texto)");
  }, [isPremium, showUpgrade]);

  return (
    <AppShell title="Conversa">
      <div className="mx-auto grid max-w-6xl gap-5 px-6 py-8 lg:grid-cols-2">
        {/* Left — deaf input (camera) */}
        <section className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Você (câmera)</h2>
            <PremiumBadge />
          </div>

          <div className="relative mt-4 flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-brand-dark text-brand-cream/70">
            <Camera className="h-10 w-10" />
            {/* hand landmark overlay mock */}
            <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 320 180" aria-hidden="true">
              {[[120, 90], [140, 70], [160, 60], [180, 70], [150, 110]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3" fill="var(--brand-salmon)" />
              ))}
              <polyline points="120,90 140,70 160,60 180,70" fill="none" stroke="var(--brand-salmon)" strokeWidth="1.5" />
            </svg>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-secondary">Reconhecendo…</span>
              <span className="text-muted-foreground">Confiança 82%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-secondary" style={{ width: "82%" }} />
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
            <p className="text-muted-foreground">Glosa literal: <span className="text-foreground">EU QUERER CAFÉ</span></p>
          </div>
          <Button variant="outline" size="sm" className="mt-3">
            <RefreshCcw className="h-4 w-4" /> Reescrever em português natural
          </Button>

          <div className="mt-4 space-y-2 border-t pt-4 text-sm">
            <p className="font-semibold">Histórico</p>
            <p className="rounded-lg bg-secondary/10 p-2">Eu gostaria de um café, por favor.</p>
            <p className="rounded-lg bg-muted/50 p-2 text-muted-foreground">Glosa: EU QUERER CAFÉ</p>
          </div>
        </section>

        {/* Right — hearing input (text → avatar) */}
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-display text-lg font-bold">Ouvinte (texto)</h2>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite uma mensagem para o avatar interpretar em Libras…"
            className="mt-4 min-h-24"
          />
          <Button className="mt-3 w-full">
            <Send className="h-4 w-4" /> Enviar para Avatar
          </Button>

          <div className="mt-5 flex aspect-square items-center justify-center rounded-xl bg-gradient-to-b from-secondary/15 to-brand-dark/10">
            <div className="flex flex-col items-center text-muted-foreground">
              <Hand className="h-16 w-16 text-secondary" />
              <p className="mt-3 text-sm">Avatar 3D — em repouso</p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
