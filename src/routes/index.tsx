import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lire — Tecnologia Assistiva para leitura e Libras" },
      {
        name: "description",
        content:
          "Lire é um aplicativo de tecnologia assistiva com leitura acessível (Jano) e comunicação em Libras (Minerva).",
      },
      { property: "og:title", content: "Lire — Tecnologia Assistiva" },
      {
        property: "og:description",
        content: "Leitura acessível e comunicação em Libras com dignidade pelo minimalismo.",
      },
    ],
  }),
  component: Splash,
});

function Splash() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-brand-dark px-6 text-center">
      <Logo size={88} variant="light" />
      <h1 className="mt-8 font-display text-6xl font-extrabold tracking-tight text-brand-cream">
        Lire
      </h1>
      <p className="mt-4 max-w-md text-lg text-brand-cream/70">
        Tecnologia assistiva para leitura acessível e comunicação em Libras. Dignidade pelo
        minimalismo.
      </p>

      <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
        <Button asChild size="lg" className="h-12 text-base">
          <Link to="/auth" search={{ mode: "signup" }}>
            Criar conta
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-12 border-brand-cream/30 bg-transparent text-base text-brand-cream hover:bg-brand-cream/10 hover:text-brand-cream"
        >
          <Link to="/auth" search={{ mode: "login" }}>
            Já tenho conta
          </Link>
        </Button>
      </div>
    </main>
  );
}
