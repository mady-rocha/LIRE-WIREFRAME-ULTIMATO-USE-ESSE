import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Clock3, FileText, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { savePendingArticle } from "@/lib/pending-articles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/blog/submit")({
  head: () => ({ meta: [{ title: "Enviar artigo — Blog | Lire" }] }),
  component: Submit,
});

function Submit() {
  const navigate = useNavigate();
  const [anon, setAnon] = useState(false);
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedTitle, setSubmittedTitle] = useState("");

  return (
    <AppShell title="Enviar artigo">
      {submitted ? (
        <section className="mx-auto max-w-2xl px-6 py-10">
          <div className="rounded-2xl border border-secondary/30 bg-card p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-secondary">Artigo enviado</p>
                <h2 className="mt-1 font-display text-2xl font-bold">Seu artigo está aguardando aprovação</h2>
                <p className="mt-2 text-muted-foreground">
                  Recebemos “{submittedTitle}”. Nossa equipe vai revisar o conteúdo antes da publicação no Blog Lire.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm">
              <Clock3 className="h-5 w-5 shrink-0 text-accent" />
              <span>Está em avaliação. Você poderá acompanhar a aprovação quando o artigo for publicado.</span>
            </div>

            <Button type="button" className="mt-6 w-full" onClick={() => navigate({ to: "/blog" })}>
              Voltar para o Blog
            </Button>
          </div>
        </section>
      ) : (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const title = new FormData(form).get("title");
          setSubmittedTitle(String(title));
          savePendingArticle(String(title));
          setSubmitted(true);
        }}
        className="mx-auto max-w-2xl space-y-6 px-6 py-8"
      >
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-accent">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold">Compartilhe seu conhecimento</h2>
              <p className="mt-1 text-sm text-muted-foreground">Seu artigo passará por uma revisão antes de aparecer no Blog Lire.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" placeholder="Um título claro e descritivo" required />
          </div>

        <div className="mt-6 space-y-1.5">
          <Label htmlFor="cat">Categoria</Label>
          <Select>
            <SelectTrigger id="cat">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dislexia">Dislexia</SelectItem>
              <SelectItem value="tdah">TDAH</SelectItem>
              <SelectItem value="autismo">Autismo</SelectItem>
              <SelectItem value="surdez">Surdez</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 space-y-1.5">
          <Label htmlFor="body">Corpo do texto</Label>
          <Textarea id="body" placeholder="Escreva seu artigo…" className="min-h-48" required />
        </div>

        <div className="mt-6 space-y-1.5">
          <Label htmlFor="ref">Links e fontes</Label>
          <Textarea id="ref" name="references" placeholder="Adicione os links e fontes utilizadas" className="min-h-20" required />
        </div>

        <div className="mt-6 flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">{anon ? "Publicar anonimamente" : "Publicar com meu nome"}</p>
            <p className="text-sm text-muted-foreground">Você controla como seu nome aparece.</p>
          </div>
          <Switch checked={anon} onCheckedChange={setAnon} aria-label="Publicar anonimamente" />
        </div>

        <div className="mt-6 flex items-start gap-3">
          <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(!!v)} />
          <Label htmlFor="consent" className="text-sm font-normal leading-snug">
            Concordo com a publicação deste conteúdo e confirmo que tenho direito de compartilhá-lo.
          </Label>
        </div>

        </div>
        <Button type="submit" size="lg" className="w-full" disabled={!consent}>
          <Send className="h-4 w-4" /> Enviar para revisão
        </Button>
      </form>
      )}
    </AppShell>
  );
}
