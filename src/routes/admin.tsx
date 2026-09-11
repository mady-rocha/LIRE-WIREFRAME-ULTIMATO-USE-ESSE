import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  FilePlus2,
  LogOut,
  Newspaper,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import { supabase } from "@/lib/supabase";
import {
  approveArticleSubmission,
  listArticleSubmissions,
  publishAdminArticle,
  rejectArticleSubmission,
  type ArticleSubmission,
} from "@/lib/blog-submissions";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Administração — Lire" }] }),
  component: AdminPage,
});

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    setLoading(true);
    setError("");

    if (email.trim().toLowerCase() === "admin@lire.com" && password === "lire-admin") {
      sessionStorage.setItem("lire.admin-authenticated", "true");
      setLoading(false);
      onLogin();
      return;
    }

    setLoading(false);
    setError("E-mail ou senha de administrador inválidos.");
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={52} />
          <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-accent">
            <ShieldCheck className="h-4 w-4" /> Área administrativa
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold">Entrar como administrador</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie os artigos e publicações do Blog Lire.
          </p>
        </div>
        <form
          onSubmit={(event) => event.preventDefault()}
          className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm"
        >
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">E-mail</Label>
            <Input
              id="admin-email"
              name="email"
              type="email"
              placeholder="admin@lire.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Senha</Label>
            <Input
              id="admin-password"
              name="password"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="button" className="h-11 w-full" onClick={submit}>
            Entrar no painel
          </Button>
        </form>
      </div>
    </main>
  );
}

function AdminPage() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [pendingArticles, setPendingArticles] = useState<ArticleSubmission[]>([]);
  const [notice, setNotice] = useState("");

  const refresh = async () => {
    try {
      setPendingArticles(await listArticleSubmissions());
    } catch {
      setPendingArticles([]);
    }
  };

  useEffect(() => {
    setAuthenticated(sessionStorage.getItem("lire.admin-authenticated") === "true");
    void refresh();
    window.addEventListener("lire:pending-articles-changed", refresh);
    return () => window.removeEventListener("lire:pending-articles-changed", refresh);
  }, []);

  if (!authenticated)
    return (
      <AdminLogin
        onLogin={() => {
          setAuthenticated(true);
        }}
      />
    );

  return (
    <main className="min-h-dvh bg-muted/30">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <p className="font-display font-bold">Lire Admin</p>
              <p className="text-xs text-muted-foreground">Painel de publicações do Blog</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="admin-logout-button"
            onClick={() => {
              sessionStorage.removeItem("lire.admin-authenticated");
              setAuthenticated(false);
            }}
          >
            <LogOut className="admin-logout-icon h-4 w-4" /> Sair
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div>
          <p className="text-sm font-semibold text-accent">Conteúdo</p>
          <h1 className="font-display text-3xl font-bold">Olá, administrador</h1>
          <p className="mt-1 text-muted-foreground">
            Publique e mantenha os artigos do Blog Lire.
          </p>
        </div>
        {notice && (
          <p
            className="rounded-lg border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm font-medium text-secondary"
            role="status"
          >
            {notice}
          </p>
        )}
        <ArticleReview
          articles={pendingArticles}
          onUpdated={() => {
            setNotice("Status do artigo atualizado.");
            void refresh();
          }}
        />
        <BlogForm onSaved={setNotice} />
        <Button onClick={() => navigate({ to: "/blog" })}>
          <ArrowLeft className="admin-back-icon h-4 w-4" /> Voltar ao Blog
        </Button>
      </div>
    </main>
  );
}

function ArticleReview({
  articles,
  onUpdated,
}: {
  articles: ArticleSubmission[];
  onUpdated: () => void;
}) {
  const update = async (article: ArticleSubmission, status: "aprovado" | "recusado") => {
    try {
      if (status === "aprovado") await approveArticleSubmission(article);
      else await rejectArticleSubmission(article.id);
      onUpdated();
    } catch (error) {
      console.error("Não foi possível atualizar o artigo.", error);
      onUpdated();
    }
  };

  return (
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="flex items-center gap-2 font-display text-xl font-bold">
        <Newspaper className="h-5 w-5 text-accent" /> Aprovar blogs dos usuários
      </h2>
      <div className="mt-4 space-y-3">
        {articles.map((article) => (
          <div key={article.id} className="flex items-center justify-between gap-3 rounded-lg border p-4">
            <div>
              <p className="font-semibold">{article.titulo}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Enviado em {new Date(article.data_envio).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="default" aria-label={`Aprovar artigo ${article.titulo}`} onClick={() => void update(article, "aprovado")}>
                Aprovar
              </Button>
              <Button size="sm" variant="outline" aria-label={`Rejeitar artigo ${article.titulo}`} onClick={() => void update(article, "recusado")}>
                Recusar
              </Button>
            </div>
          </div>
        ))}
        {articles.length === 0 && <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">Nenhum artigo aguardando aprovação.</p>}
      </div>
    </section>
  );
}

function BlogForm({ onSaved }: { onSaved: (message: string) => void }) {
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await publishAdminArticle({
        titulo: String(data.get("title")),
        corpo: String(data.get("content")),
        referencias: "Conteúdo publicado pela equipe Lire",
        categoria: String(data.get("category")),
      });
      event.currentTarget.reset();
      onSaved("Blog publicado com sucesso.");
    } catch (error) {
      onSaved(error instanceof Error ? error.message : "Não foi possível publicar o blog.");
    }
  };
  return (
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="flex items-center gap-2 font-display text-xl font-bold">
        <FilePlus2 className="h-5 w-5 text-accent" /> Postar novo blog
      </h2>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <Field id="blog-title" name="title" label="Título" placeholder="Título do artigo" />
        <Field id="blog-category" name="category" label="Categoria" placeholder="Ex.: Dislexia" />
        <div className="space-y-1.5">
          <Label htmlFor="blog-content">Conteúdo</Label>
          <Textarea
            id="blog-content"
            name="content"
            className="min-h-32"
            placeholder="Escreva o conteúdo do artigo."
            required
          />
        </div>
        <Button type="submit">
          <Newspaper className="admin-submit-icon h-4 w-4" /> Publicar blog
        </Button>
      </form>
    </section>
  );
}

function Field({
  id,
  name,
  label,
  placeholder,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} placeholder={placeholder} required />
    </div>
  );
}
