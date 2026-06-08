import { createFileRoute } from "@tanstack/react-router";
import { Hand } from "lucide-react";
import { useApp } from "@/lib/app-context";

export const Route = createFileRoute("/loading")({
  head: () => ({ meta: [{ title: "Carregando — Lire" }] }),
  component: LoadingScreen,
});

function SpinningSunflower() {
  return (
    <svg width={80} height={80} viewBox="0 0 48 48" className="animate-spin [animation-duration:6s]" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x="22.5" y="2" width="3" height="13" rx="1.5" fill="var(--brand-salmon)" transform={`rotate(${i * 30} 24 24)`} />
      ))}
      <circle cx="24" cy="24" r="9" fill="var(--brand-orange-dark)" />
      <circle cx="24" cy="24" r="4.5" fill="var(--brand-brown)" />
    </svg>
  );
}

function LoadingScreen() {
  const { module } = useApp();
  const minerva = module === "minerva";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <SpinningSunflower />

      {minerva ? (
        <div className="mt-8 flex flex-col items-center">
          <Hand className="h-14 w-14 animate-pulse text-secondary" />
          <p className="mt-4 max-w-sm text-muted-foreground">
            Sinal básico: “Olá” — mão aberta movendo-se levemente para o lado.
          </p>
        </div>
      ) : (
        <p className="mt-8 max-w-sm text-muted-foreground">
          Dica de ergonomia: posicione a tela a um braço de distância e levemente abaixo da linha
          dos olhos.
        </p>
      )}
    </main>
  );
}
