import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/blog/")({
  head: () => ({ meta: [{ title: "Blog — Lire" }] }),
  component: Blog,
});

const categories = ["Todos", "Dislexia", "TDAH", "Autismo", "Surdez"] as const;
const catColor: Record<string, string> = {
  Dislexia: "bg-primary/15 text-accent",
  TDAH: "bg-secondary/15 text-secondary",
  Autismo: "bg-brand-blue-light/15 text-brand-navy",
  Surdez: "bg-accent/15 text-accent",
};

const articles = [
  { title: "Como a tipografia afeta a leitura na dislexia", cat: "Dislexia", author: "Dra. Helena Costa", date: "12 mai 2025", summary: "Espaçamento, fontes e contraste que reduzem o esforço de leitura." },
  { title: "Foco e atenção: estratégias práticas para TDAH", cat: "TDAH", author: "Anônimo", date: "03 mai 2025", summary: "Técnicas de leitura por blocos e pausas estruturadas." },
  { title: "Comunicação previsível e o espectro autista", cat: "Autismo", author: "Marcos Lima", date: "28 abr 2025", summary: "Por que a clareza visual importa tanto." },
  { title: "Libras na prática: primeiros sinais do dia a dia", cat: "Surdez", author: "Comunidade Lire", date: "20 abr 2025", summary: "Um guia introdutório para ouvintes." },
];

function Blog() {
  const [active, setActive] = useState<string>("Todos");
  const list = active === "Todos" ? articles : articles.filter((a) => a.cat === active);

  return (
    <AppShell title="Blog">
      <div className="relative mx-auto max-w-5xl px-6 py-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar artigos…" className="pl-9" aria-label="Buscar artigos" />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium ${active === c ? "border-primary bg-primary/10 text-accent" : "hover:bg-muted"}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {list.map((a) => (
            <article key={a.title} className="flex flex-col rounded-xl border bg-card p-5">
              <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${catColor[a.cat]}`}>
                {a.cat}
              </span>
              <h2 className="mt-3 font-display text-lg font-bold">{a.title}</h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{a.summary}</p>
              <p className="mt-4 text-xs text-muted-foreground">{a.author} · {a.date}</p>
            </article>
          ))}
        </div>

        <Button asChild size="lg" className="fixed bottom-6 right-6 z-20 shadow-lg">
          <Link to="/blog/submit">
            <Plus className="h-5 w-5" /> Enviar meu artigo
          </Link>
        </Button>
      </div>
    </AppShell>
  );
}
