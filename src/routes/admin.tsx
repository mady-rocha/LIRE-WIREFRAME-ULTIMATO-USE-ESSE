import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  FilePlus2,
  Hand,
  LogOut,
  Newspaper,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import {
  approveArticleSubmission,
  listArticleSubmissions,
  rejectArticleSubmission,
  type ArticleSubmission,
} from "@/lib/blog-submissions";
import {
  listAdminBlogPosts,
  listGestureSuggestions,
  listImplementedGestures,
  saveAdminBlogPost,
  saveImplementedGesture,
  updateGestureSuggestion,
  type AdminBlogPost,
  type GestureSuggestion,
  type ImplementedGesture,
} from "@/lib/admin-data";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Administração — Lire" }] }),
  component: AdminPage,
});

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (email === "admin@lire.com" && password === "lire-admin") {
      sessionStorage.setItem("lire.admin-authenticated", "true");
      onLogin();
    } else {
      setError("E-mail ou senha de administrador inválidos.");
    }
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
            Gerencie o conteúdo e os sinais da comunidade Lire.
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
  const [suggestions, setSuggestions] = useState<GestureSuggestion[]>([]);
  const [pendingArticles, setPendingArticles] = useState<ArticleSubmission[]>([]);
  const [implemented, setImplemented] = useState<ImplementedGesture[]>([]);
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [notice, setNotice] = useState("");

  const refresh = async () => {
    setSuggestions(listGestureSuggestions());
    try {
      setPendingArticles(await listArticleSubmissions());
    } catch {
      setPendingArticles([]);
    }
    setImplemented(listImplementedGestures());
    setPosts(listAdminBlogPosts());
  };

  useEffect(() => {
    setAuthenticated(sessionStorage.getItem("lire.admin-authenticated") === "true");
    void refresh();
    window.addEventListener("lire:admin-data-changed", refresh);
    window.addEventListener("lire:pending-articles-changed", refresh);
    return () => {
      window.removeEventListener("lire:admin-data-changed", refresh);
      window.removeEventListener("lire:pending-articles-changed", refresh);
    };
  }, []);

  if (!authenticated)
    return (
      <AdminLogin
        onLogin={() => {
          setAuthenticated(true);
          void refresh();
        }}
      />
    );

  const approveGesture = (id: string, status: GestureSuggestion["status"]) => {
    updateGestureSuggestion(id, status);
    setNotice(status === "aprovado" ? "Gesto aprovado." : "Sugestão rejeitada.");
    refresh();
  };

  return (
    <main className="min-h-dvh bg-muted/30">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <p className="font-display font-bold">Lire Admin</p>
              <p className="text-xs text-muted-foreground">Painel de conteúdo e comunidade</p>
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
          <p className="text-sm font-semibold text-accent">Visão geral</p>
          <h1 className="font-display text-3xl font-bold">Olá, administrador</h1>
          <p className="mt-1 text-muted-foreground">
            Acompanhe as contribuições e mantenha o conteúdo acessível.
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
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            icon={Hand}
            label="Gestos em avaliação"
            value={suggestions.filter((item) => item.status === "pendente").length}
          />
          <Stat icon={Newspaper} label="Blogs aguardando" value={pendingArticles.length} />
          <Stat icon={ShieldCheck} label="Gestos implementados" value={implemented.length} />
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <GestureReview suggestions={suggestions} onAction={approveGesture} />
          <GestureForm
            onSaved={(message) => {
              setNotice(message);
              refresh();
            }}
          />
          <ArticleReview
            articles={pendingArticles}
            onUpdated={() => {
              setNotice("Status do artigo atualizado.");
              refresh();
            }}
          />
          <BlogForm
            onSaved={(message) => {
              setNotice(message);
              refresh();
            }}
          />
        </div>
        {posts.length > 0 && (
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">
              <Newspaper className="h-5 w-5 text-accent" /> Posts publicados pelo admin
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {posts.map((post) => (
                <div key={post.id} className="rounded-lg border p-4">
                  <p className="font-semibold">{post.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {post.category} · {post.source}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
        <Button onClick={() => navigate({ to: "/blog" })}>
          <ArrowLeft className="admin-back-icon h-4 w-4" /> Voltar ao Blog
        </Button>
      </div>
    </main>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Hand; label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <Icon className="h-5 w-5 text-accent" />
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function GestureReview({
  suggestions,
  onAction,
}: {
  suggestions: GestureSuggestion[];
  onAction: (id: string, status: GestureSuggestion["status"]) => void;
}) {
  return (
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="flex items-center gap-2 font-display text-xl font-bold">
        <Hand className="h-5 w-5 text-accent" /> Aprovar gestos sugeridos
      </h2>
      <div className="mt-4 space-y-3">
        {suggestions
          .filter((item) => item.status === "pendente")
          .map((item) => (
            <div key={item.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Enviado por {item.submittedBy}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    aria-label={`Aprovar gesto ${item.name}`}
                    onClick={() => onAction(item.id, "aprovado")}
                  >
                    <Check className="admin-action-icon h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label={`Rejeitar gesto ${item.name}`}
                    onClick={() => onAction(item.id, "rejeitado")}
                  >
                    <X className="admin-outline-action-icon h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        {suggestions.filter((item) => item.status === "pendente").length === 0 && (
          <Empty text="Nenhum gesto aguardando aprovação." />
        )}
      </div>
    </section>
  );
}

function GestureForm({ onSaved }: { onSaved: (message: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  };

  const openCamera = async () => {
    setCameraError("");
    setCameraLoading(true);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Seu navegador não oferece acesso à câmera.");
      setCameraLoading(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError("Permissão para a câmera não concedida.");
    } finally {
      setCameraLoading(false);
    }
  };

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOpen]);

  useEffect(() => stopCamera, []);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    saveImplementedGesture({
      name: String(data.get("name")),
      description: String(data.get("description")),
      category: String(data.get("category")),
    });
    event.currentTarget.reset();
    onSaved("Gesto implementado e adicionado ao catálogo.");
  };
  return (
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="flex items-center gap-2 font-display text-xl font-bold">
        <Plus className="h-5 w-5 text-accent" /> Implementar novo gesto
      </h2>
      <div className="mt-4 rounded-lg border border-dashed p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Captura da mão</p>
            <p className="text-xs text-muted-foreground">Abra a câmera para posicionar a mão.</p>
          </div>
          <Button type="button" variant="outline" size="sm" disabled={cameraLoading} onClick={() => void (cameraOpen ? stopCamera() : openCamera())}>
            <Camera className="admin-camera-icon h-4 w-4" /> {cameraLoading ? "Aguardando permissão..." : cameraOpen ? "Fechar câmera" : "Abrir câmera"}
          </Button>
        </div>
        {cameraOpen && <video ref={videoRef} autoPlay muted playsInline className="mt-3 aspect-video w-full rounded-md bg-black object-cover" aria-label="Prévia da câmera para captura do gesto" />}
        {cameraError && <p className="mt-2 text-sm text-destructive" role="alert">{cameraError}</p>}
      </div>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <Field id="gesture-name" name="name" label="Nome do gesto" placeholder="Ex.: Biblioteca" />
        <Field
          id="gesture-category"
          name="category"
          label="Categoria"
          placeholder="Ex.: Educação"
        />
        <div className="space-y-1.5">
          <Label htmlFor="gesture-description">Descrição do movimento</Label>
          <Textarea
            id="gesture-description"
            name="description"
            placeholder="Descreva como o gesto deve ser realizado."
            required
          />
        </div>
        <Button type="submit">
          <Plus className="admin-submit-icon h-4 w-4" /> Implementar gesto
        </Button>
      </form>
    </section>
  );
}

function ArticleReview({
  articles,
  onUpdated,
}: {
  articles: PendingArticle[];
  onUpdated: () => void;
}) {
  const update = async (article: ArticleSubmission, status: "aprovado" | "rejeitado") => {
    try {
      if (status === "aprovado") {
        await approveArticleSubmission(article);
      } else {
        await rejectArticleSubmission(article.id);
      }
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
          <div
            key={article.id}
            className="flex items-center justify-between gap-3 rounded-lg border p-4"
          >
            <div>
              <p className="font-semibold">{article.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Enviado em {new Date(article.submittedAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                size="icon"
                aria-label={`Aprovar artigo ${article.title}`}
                onClick={() => void update(article, "aprovado")}
              >
                <Check className="admin-action-icon h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                aria-label={`Rejeitar artigo ${article.title}`}
                onClick={() => void update(article, "rejeitado")}
              >
                <X className="admin-outline-action-icon h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {articles.length === 0 && <Empty text="Nenhum artigo aguardando aprovação." />}
      </div>
    </section>
  );
}

function BlogForm({ onSaved }: { onSaved: (message: string) => void }) {
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    saveAdminBlogPost({
      title: String(data.get("title")),
      category: String(data.get("category")),
      summary: String(data.get("summary")),
      content: String(data.get("content")),
      source: "Equipe Lire",
    });
    event.currentTarget.reset();
    onSaved("Blog publicado com sucesso.");
  };
  return (
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="flex items-center gap-2 font-display text-xl font-bold">
        <FilePlus2 className="h-5 w-5 text-accent" /> Postar novo blog
      </h2>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <Field id="blog-title" name="title" label="Título" placeholder="Título do artigo" />
        <Field id="blog-category" name="category" label="Categoria" placeholder="Ex.: Dislexia" />
        <Field
          id="blog-summary"
          name="summary"
          label="Resumo"
          placeholder="Uma frase para apresentar o artigo"
        />
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
function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}
