import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Settings2,
  Play,
  Pause,
  Focus,
  X,
  Type,
  Hand,
  Gauge,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { PremiumBadge } from "@/components/PremiumBadge";
import { useApp } from "@/lib/app-context";

export const Route = createFileRoute("/jano/reader")({
  head: () => ({ meta: [{ title: "Leitor — Módulo Jano | Lire" }] }),
  component: Reader,
});

const paragraphs = [
  "A leitura é uma das habilidades mais complexas que o cérebro humano realiza, integrando visão, linguagem e memória em frações de segundo.",
  "Para pessoas com dislexia, pequenas mudanças na tipografia — espaçamento maior, fontes específicas e contraste adequado — podem reduzir significativamente o esforço cognitivo.",
  "O modo de foco isola o parágrafo atual, atenuando o restante do texto e ajudando a manter a atenção durante a leitura.",
  "A narração por voz, quando disponível, destaca cada palavra à medida que é lida em voz alta, reforçando a associação entre som e símbolo.",
];

function Reader() {
  const { isPremium, showUpgrade } = useApp();
  const [panelOpen, setPanelOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [activePara, setActivePara] = useState(1);
  const [fontSize, setFontSize] = useState([20]);
  const [lineHeight, setLineHeight] = useState([180]);
  const [dyslexic, setDyslexic] = useState(false);
  const [contrast, setContrast] = useState<"claro" | "escuro" | "alto">("claro");

  const tts = (action: () => void) => () =>
    isPremium ? action() : showUpgrade("Narração por voz (TTS)");

  const surface =
    contrast === "escuro"
      ? "bg-brand-dark text-brand-cream"
      : contrast === "alto"
        ? "bg-black text-yellow-300"
        : "bg-card text-card-foreground";

  return (
    <AppShell
      title="Neurociência da leitura.pdf"
      headerExtra={
        <>
          <Button
            variant={focusMode ? "default" : "outline"}
            size="sm"
            onClick={() => setFocusMode((v) => !v)}
          >
            <Focus className="h-4 w-4" /> Modo Foco
          </Button>
          <Button variant="outline" size="sm" onClick={tts(() => setPlaying((v) => !v))}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {!isPremium && <PremiumBadge className="ml-1" />}
            <span className="ml-1">TTS</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPanelOpen(true)}>
            <Settings2 className="h-4 w-4" /> Ajustes
          </Button>
        </>
      }
    >
      <div className="relative">
        {/* Reading area */}
        <article
          className={`mx-auto my-8 max-w-2xl rounded-2xl border p-8 transition-colors ${surface}`}
          style={{ fontFamily: dyslexic ? "Comic Sans MS, 'OpenDyslexic', sans-serif" : undefined }}
        >
          {paragraphs.map((p, i) => {
            const dim = focusMode && i + 1 !== activePara;
            return (
              <p
                key={i}
                onClick={() => setActivePara(i + 1)}
                className="mb-6 cursor-pointer transition-opacity"
                style={{
                  fontSize: `${fontSize[0]}px`,
                  lineHeight: `${lineHeight[0]}%`,
                  opacity: dim ? 0.25 : 1,
                }}
              >
                {i + 1 === activePara && playing && isPremium ? (
                  <>
                    <mark className="rounded bg-primary/40 px-0.5">A leitura</mark>
                    {p.slice(10)}
                  </>
                ) : (
                  p
                )}
              </p>
            );
          })}
        </article>

        {/* Right customization panel with blur overlay */}
        {panelOpen && (
          <button
            aria-label="Fechar painel"
            onClick={() => setPanelOpen(false)}
            className="fixed inset-0 z-40 bg-brand-dark/25 backdrop-blur-sm"
          />
        )}
        <aside
          aria-hidden={!panelOpen}
          className={`sidebar-shadow fixed inset-y-0 right-0 z-50 flex w-80 flex-col overflow-y-auto bg-card p-5 transition-transform duration-300 ${
            panelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Personalização</h2>
            <button onClick={() => setPanelOpen(false)} aria-label="Fechar" className="rounded-md p-2 hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <Label className="flex items-center gap-2"><Type className="h-4 w-4" /> Tipografia</Label>
              <button
                onClick={() => setDyslexic((v) => !v)}
                className={`mt-2 w-full rounded-lg border px-3 py-2 text-left text-sm ${dyslexic ? "border-primary bg-primary/10" : ""}`}
              >
                Fonte OpenDyslexic {dyslexic ? "(ativa)" : ""}
              </button>
            </div>

            <div>
              <Label>Tamanho do texto — {fontSize[0]}px</Label>
              <Slider className="mt-3" min={14} max={32} step={1} value={fontSize} onValueChange={setFontSize} />
            </div>

            <div>
              <Label>Espaçamento entre linhas — {lineHeight[0]}%</Label>
              <Slider className="mt-3" min={120} max={260} step={10} value={lineHeight} onValueChange={setLineHeight} />
            </div>

            <div>
              <Label>Contraste</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["claro", "escuro", "alto"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setContrast(c)}
                    className={`rounded-lg border px-2 py-2 text-xs capitalize ${contrast === c ? "border-primary bg-primary/10" : ""}`}
                  >
                    {c === "alto" ? "Alto contraste" : c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2"><Gauge className="h-4 w-4" /> Velocidade do TTS</Label>
              {!isPremium && <PremiumBadge className="ml-1 mt-1" />}
              <Slider
                className="mt-3"
                min={50}
                max={200}
                step={10}
                defaultValue={[100]}
                disabled={!isPremium}
                onValueChange={() => !isPremium && showUpgrade("Velocidade da narração (TTS)")}
              />
            </div>

            <Button variant="secondary" className="w-full">
              <Hand className="h-4 w-4" /> Traduzir trecho para Libras (Avatar)
            </Button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
