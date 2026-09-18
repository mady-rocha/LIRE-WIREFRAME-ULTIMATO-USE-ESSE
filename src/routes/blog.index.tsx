import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, CheckCircle2, Info, Plus } from "lucide-react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { articles, catColor } from "@/lib/blog-articles";
import { listArticleSubmissions, listPublishedArticleRows, publishedRowToBlogArticle, type ArticleSubmission } from "@/lib/blog-submissions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/blog/")({
  head: () => ({ meta: [{ title: "Blog — Lire" }] }),
  component: Blog,
});

const categories = ["Todos", "Dislexia", "TDAH", "Autismo", "Surdez"] as const;
function Blog() {
  const [active, setActive] = useState<string>("Todos");
  const [search, setSearch] = useState("");
  const [pendingArticles, setPendingArticles] = useState<ArticleSubmission[]>([]);
  const [publishedArticles, setPublishedArticles] = useState<typeof articles>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  const allArticles = publishedArticles;
  const list = allArticles.filter((article) => {
    const matchesCategory = active === "Todos" || article.cat === active;
    const searchableText = `${article.title} ${article.cat} ${article.author} ${article.summary}`.toLocaleLowerCase("pt-BR");
    return matchesCategory && (!normalizedSearch || searchableText.includes(normalizedSearch));
  });

  useEffect(() => {
    const loadArticles = async () => {
      setPendingArticles([]);
      setPublishedArticles([]);

      const [pending, published] = await Promise.all([
        listArticleSubmissions(),
        listPublishedArticleRows(),
      ]);

      const hydratedPublished = await Promise.all(
        published.map(async (row) => {
          if (row.anonimo || !row.id_usuario) {
            return { ...row, autor_nome: row.anonimo ? "Anônimo" : null };
          }

          try {
            const { data: profile } = await supabase
              .from("usuario")
              .select("nome")
              .eq("id", row.id_usuario)
              .maybeSingle();

            return { ...row, autor_nome: profile?.nome ?? null };
          } catch {
            return { ...row, autor_nome: null };
          }
        }),
      );

      setPendingArticles(pending);
      setPublishedArticles(hydratedPublished.map(publishedRowToBlogArticle));
    };

    void loadArticles().catch(() => {
      setPendingArticles([]);
      setPublishedArticles([]);
    });

    const channel = supabase
      .channel("blog-live-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "artigo_blog" }, () => {
        void loadArticles().catch(() => {
          setPendingArticles([]);
          setPublishedArticles([]);
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "submissao_artigo" }, () => {
        void loadArticles().catch(() => {
          setPendingArticles([]);
          setPublishedArticles([]);
        });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <AppShell
      title="Blog"
      headerExtra={
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${pendingArticles.length} artigo(s) aguardando aprovação`}
            onClick={() => setNotificationsOpen((open) => !open)}
            className="relative"
          >
            <Bell className="h-5 w-5" />
            {pendingArticles.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                {pendingArticles.length > 9 ? "9+" : pendingArticles.length}
              </span>
            )}
          </Button>
          {notificationsOpen && (
            <div className="absolute right-0 top-11 z-50 w-72 rounded-xl border bg-card p-4 text-left shadow-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-secondary" />
                <p className="font-semibold">Artigos em avaliação</p>
              </div>
              {pendingArticles.length > 0 ? (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {pendingArticles.length} artigo(s) aguardando aprovação da equipe Lire.
                  </p>
                  <div className="mt-3 max-h-32 space-y-2 overflow-y-auto">
                    {pendingArticles.slice().reverse().map((article) => (
                      <p key={article.id} className="truncate text-sm">{article.title}</p>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Nenhum artigo aguardando aprovação.</p>
              )}
            </div>
          )}
        </div>
      }
    >
      <div className="relative mx-auto max-w-5xl px-6 py-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar artigos…"
            className="pl-9"
            aria-label="Buscar artigos"
          />
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

        <TooltipProvider>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {list.map((a) => (
              <Link
                key={a.slug}
                to="/blog/article/$slug"
                params={{ slug: a.slug }}
                className="relative flex flex-col rounded-xl border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      role="img"
                      tabIndex={0}
                      aria-label={`Fonte: ${a.source}`}
                      className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Info className="h-4 w-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Fonte: {a.source}</TooltipContent>
                </Tooltip>
                <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${catColor[a.cat]}`}>
                  {a.cat}
                </span>
                <h2 className="mt-3 font-display text-lg font-bold">{a.title}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{a.summary}</p>
                <p className="mt-4 text-xs text-muted-foreground">{a.author} · {a.date}</p>
              </Link>
            ))}
          </div>
        </TooltipProvider>

        {list.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed p-8 text-center">
            <Search className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-medium">Nenhum artigo encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tente buscar por outro termo ou categoria.
            </p>
          </div>
        )}

        <Button asChild size="lg" className="fixed bottom-6 right-6 z-20 shadow-lg">
          <Link to="/blog/submit">
            <Plus className="h-5 w-5" /> Enviar meu artigo
          </Link>
        </Button>
      </div>
    </AppShell>
  );
}
