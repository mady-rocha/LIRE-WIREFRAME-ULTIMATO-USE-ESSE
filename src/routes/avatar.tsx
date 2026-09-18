import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Play, Pause, RotateCcw, Hand, Gauge } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { salvarSessaoAvatar } from "@/lib/avatar-session";

export const Route = createFileRoute("/avatar")({
  head: () => ({ meta: [{ title: "Avatar — Texto para Libras | Lire" }] }),
  component: AvatarScreen,
});

function AvatarScreen() {
  const [text, setText] = useState("");
  const [playing, setPlaying] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroMsg, setErroMsg] = useState("");

  async function interpretar() {
    if (!text.trim()) return;
    setPlaying(true);

    setSalvando(true);
    setErroMsg("");

    const resultado = await salvarSessaoAvatar(text);

    setSalvando(false);
    if (!resultado.ok) {
      if (resultado.reason !== "supabase_unconfigured") {
        console.error("erro ao salvar sessao do avatar:", resultado.error ?? resultado.message);
        setErroMsg(resultado.message);
      }
    }
  }

  return (
    <AppShell title="Texto → Libras">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <p className="text-muted-foreground">
          Digite qualquer conteúdo e veja a interpretação em Libras. Gratuito e ilimitado.
        </p>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva aqui o texto que deseja interpretar em Libras…"
          className="mt-4 min-h-28 text-lg"
        />
        <Button
          onClick={interpretar}
          size="lg"
          className="mt-3 w-full text-base"
          disabled={!text.trim() || salvando}
        >
          <Hand className="h-5 w-5" /> {salvando ? "Salvando..." : "Interpretar em Libras"}
        </Button>

        {erroMsg && <p className="mt-2 text-sm text-red-500">{erroMsg}</p>}

        {/* Avatar stage */}
        <div className="mt-6 flex aspect-square w-full items-center justify-center rounded-2xl border bg-gradient-to-b from-secondary/15 to-brand-dark/15">
          <div className="flex flex-col items-center text-muted-foreground">
            <Hand className="h-24 w-24 text-secondary" />
            <p className="mt-3 text-sm">{playing ? "Interpretando…" : "Avatar 3D — em repouso"}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Reproduzir ou pausar" onClick={() => setPlaying((v) => !v)}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" aria-label="Repetir" onClick={() => setPlaying(true)}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <div className="ml-3 flex flex-1 items-center gap-3">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <Slider min={50} max={200} step={10} defaultValue={[100]} className="flex-1" aria-label="Velocidade" />
          </div>
        </div>

        <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          Palavras sem sinal no dicionário aparecem <span className="font-semibold text-foreground">datilologadas</span> (soletradas), letra por letra.
        </p>
      </div>
    </AppShell>
  );
}
