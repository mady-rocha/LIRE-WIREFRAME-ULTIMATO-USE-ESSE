import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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

  return (
    <AppShell title="Enviar artigo">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/blog" });
        }}
        className="mx-auto max-w-2xl space-y-6 px-6 py-8"
      >
        <div className="space-y-1.5">
          <Label htmlFor="t">Título</Label>
          <Input id="t" placeholder="Um título claro e descritivo" required />
        </div>

        <div className="space-y-1.5">
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

        <div className="space-y-1.5">
          <Label htmlFor="body">Corpo do texto</Label>
          <Textarea id="body" placeholder="Escreva seu artigo…" className="min-h-48" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ref">Referências</Label>
          <Textarea id="ref" placeholder="Links e fontes utilizadas (opcional)" className="min-h-20" />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">{anon ? "Publicar anonimamente" : "Publicar com meu nome"}</p>
            <p className="text-sm text-muted-foreground">Você controla como seu nome aparece.</p>
          </div>
          <Switch checked={anon} onCheckedChange={setAnon} aria-label="Publicar anonimamente" />
        </div>

        <div className="flex items-start gap-3">
          <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(!!v)} />
          <Label htmlFor="consent" className="text-sm font-normal leading-snug">
            Concordo com a publicação deste conteúdo e confirmo que tenho direito de compartilhá-lo.
          </Label>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={!consent}>
          Enviar para revisão
        </Button>
      </form>
    </AppShell>
  );
}
