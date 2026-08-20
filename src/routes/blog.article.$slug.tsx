import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Bold, Focus, Gauge, Pause, Play, Settings2, Type, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { catColor, findArticle } from "@/lib/blog-articles";

export const Route = createFileRoute("/blog/article/$slug")({
  loader: ({ params }) => {
    const article = findArticle(params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.article.title} — Blog | Lire` : "Artigo — Blog | Lire" },
      { name: "description", content: loaderData?.article.summary ?? "Leia este artigo no Blog Lire." },
    ],
  }),
  component: ArticlePage,
});

function ArticlePage() {
  const { article } = Route.useLoaderData();
  const [panelOpen, setPanelOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [bold, setBold] = useState(false);
  const [dyslexic, setDyslexic] = useState(false);
  const [fontSize, setFontSize] = useState([18]);
  const [lineHeight, setLineHeight] = useState([180]);
  const [contrast, setContrast] = useState<"claro" | "escuro" | "alto">("claro");
  const [activeSentence, setActiveSentence] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState([100]);
  const [activeTtsRange, setActiveTtsRange] = useState<{ start: number; end: number } | null>(null);
  const sentences = article.paragraphs.map((paragraph) => paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [paragraph]);
  const ttsText = article.paragraphs.join("\n\n");
  const ttsSegments: Array<{ id: string; start: number; end: number }> = [];
  let ttsOffset = 0;
  sentences.forEach((paragraphSentences, paragraphIndex) => {
    paragraphSentences.forEach((sentence, sentenceIndex) => {
      ttsSegments.push({ id: `${paragraphIndex}-${sentenceIndex}`, start: ttsOffset, end: ttsOffset + sentence.length });
      ttsOffset += sentence.length;
    });
    ttsOffset += 2;
  });
  const speech = (rate: number) => {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(ttsText);
    utterance.lang = "pt-BR";
    utterance.rate = rate / 100;
    utterance.onstart = () => setPlaying(true);
    utterance.onboundary = (event) => setActiveTtsRange({ start: event.charIndex, end: event.charIndex + (event.charLength || 1) });
    utterance.onend = () => { setPlaying(false); setActiveTtsRange(null); };
    utterance.onerror = () => { setPlaying(false); setActiveTtsRange(null); };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const toggleSpeech = () => {
    if (!("speechSynthesis" in window)) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setPlaying(false);
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPlaying(true);
    } else {
      speech(ttsSpeed[0]);
    }
  };

  const surface = contrast === "escuro" ? "bg-brand-dark text-brand-cream" : contrast === "alto" ? "bg-black text-yellow-300" : "bg-card text-card-foreground";

  return (
    <AppShell
      title="Blog"
      headerExtra={
        <>
          <Button variant={focusMode ? "default" : "outline"} size="sm" onClick={() => setFocusMode((value) => !value)}>
            <Focus className="h-4 w-4" /> Modo Foco
          </Button>
          <Button variant="outline" size="sm" onClick={toggleSpeech}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} TTS
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPanelOpen(true)}>
            <Settings2 className="h-4 w-4" /> Ajustes
          </Button>
        </>
      }
    >
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Button asChild variant="ghost" className="-ml-3 mb-8">
          <Link to="/blog">
            <ArrowLeft className="h-4 w-4" /> Voltar para o Blog
          </Link>
        </Button>

        <article>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${catColor[article.cat]}`}>
            {article.cat}
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">{article.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{article.summary}</p>
          <p className="mt-5 text-sm text-muted-foreground">{article.author} · {article.date}</p>

          <div className="mt-8 flex items-center gap-3 rounded-xl border border-secondary/30 bg-secondary/5 p-4 text-sm">
            <BookOpen className="h-5 w-5 shrink-0 text-secondary" />
            <span>Leitura acessível com conteúdo organizado para facilitar o acompanhamento.</span>
          </div>

          <div className={`mt-8 space-y-6 rounded-2xl border p-6 text-lg ${surface} ${dyslexic ? "font-dyslexic" : ""} ${bold ? "font-bold" : ""}`}>
            {sentences.map((paragraphSentences, paragraphIndex) => {
              const paragraphIsDimmed = focusMode && activeSentence && !activeSentence.startsWith(`${paragraphIndex}-`);
              return <p key={paragraphIndex} className={`transition-opacity ${paragraphIsDimmed ? "opacity-25" : ""}`} style={{ fontSize: `${fontSize[0]}px`, lineHeight: `${lineHeight[0]}%` }} onMouseLeave={() => setActiveSentence(null)}>
                {paragraphSentences.map((sentence, sentenceIndex) => {
                  const id = `${paragraphIndex}-${sentenceIndex}`;
                  const isFocusActive = focusMode && activeSentence === id;
                  const ttsSegment = ttsSegments.find((segment) => segment.id === id);
                  const isTtsActive = Boolean(activeTtsRange && ttsSegment && activeTtsRange.end > ttsSegment.start && activeTtsRange.start < ttsSegment.end);
                  return <span key={id} onMouseEnter={() => setActiveSentence(id)} className={`rounded px-0.5 ${isFocusActive || isTtsActive ? "bg-primary/40" : ""}`}>{sentence}{" "}</span>;
                })}
              </p>;
            })}
          </div>
        </article>

        {panelOpen && <button aria-label="Fechar painel" onClick={() => setPanelOpen(false)} className="fixed inset-0 z-40 bg-brand-dark/25" />}
        <aside className={`fixed inset-y-0 right-0 z-50 w-80 overflow-y-auto bg-card p-5 shadow-xl transition-transform ${panelOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">Personalização</h2><button onClick={() => setPanelOpen(false)} aria-label="Fechar"><X className="h-5 w-5" /></button></div>
          <div className="mt-6 space-y-6">
            <div><Label className="flex items-center gap-2"><Type className="h-4 w-4" /> Tipografia</Label><button onClick={() => setDyslexic((value) => !value)} className={`mt-2 w-full rounded-lg border px-3 py-2 text-left text-sm ${dyslexic ? "border-primary bg-primary/10" : ""}`}>Fonte OpenDyslexic</button><button onClick={() => setBold((value) => !value)} className={`mt-2 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm ${bold ? "border-primary bg-primary/10" : ""}`}><Bold className="h-4 w-4" /> Texto em negrito</button></div>
            <div><Label>Tamanho do texto — {fontSize[0]}px</Label><Slider className="mt-3" min={14} max={32} step={1} value={fontSize} onValueChange={setFontSize} /></div>
            <div><Label>Espaçamento entre linhas — {lineHeight[0]}%</Label><Slider className="mt-3" min={120} max={260} step={10} value={lineHeight} onValueChange={setLineHeight} /></div>
            <div><Label>Contraste</Label><div className="mt-2 grid grid-cols-3 gap-2">{(["claro", "escuro", "alto"] as const).map((value) => <button key={value} onClick={() => setContrast(value)} className={`rounded-lg border px-2 py-2 text-xs capitalize ${contrast === value ? "border-primary bg-primary/10" : ""}`}>{value === "alto" ? "Alto" : value}</button>)}</div></div>
            <div><Label className="flex items-center gap-2"><Gauge className="h-4 w-4" /> Velocidade do TTS — {ttsSpeed[0]}%</Label><Slider className="mt-3" min={50} max={200} step={10} value={ttsSpeed} onValueChange={(value) => { setTtsSpeed(value); if (playing) speech(value[0]); }} /></div>
          </div>
        </aside>
      </main>
    </AppShell>
  );
}