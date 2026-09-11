import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Settings2,
  Play,
  Pause,
  Focus,
  X,
  Type,
  Hand,
  Gauge,
  Bold,
  Lock,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/app-context";
import { getDocument, updateDocumentProgress } from "@/lib/documents";
import {
  defaultReadingPreferences,
  loadReadingPreferencesFromSupabase,
  readLocalReadingPreferences,
  saveReadingPreferencesToSupabase,
  type ReadingPreferences,
} from "@/lib/reading-preferences";

export const Route = createFileRoute("/jano/reader")({
  head: () => ({ meta: [{ title: "Leitor — Módulo Jano | Lire" }] }),
  component: Reader,
});

const defaultParagraphs = [
  "A leitura é uma das habilidades mais complexas que o cérebro humano realiza, integrando visão, linguagem e memória em frações de segundo.",
  "Para pessoas com dislexia, pequenas mudanças na tipografia — espaçamento maior, fontes específicas e contraste adequado — podem reduzir significativamente o esforço cognitivo.",
  "O modo de foco isola o parágrafo atual, atenuando o restante do texto e ajudando a manter a atenção durante a leitura.",
  "A narração por voz, quando disponível, destaca cada palavra à medida que é lida em voz alta, reforçando a associação entre som e símbolo.",
];

function Reader() {
  const { isPremium, showUpgrade } = useApp();
  const [panelOpen, setPanelOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(defaultReadingPreferences.modo_foco);
  const [playing, setPlaying] = useState(false);
  const [activeTtsRange, setActiveTtsRange] = useState<{ start: number; end: number } | null>(null);
  const [activePara, setActivePara] = useState(1);
  const [activeSentence, setActiveSentence] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState([defaultReadingPreferences.tamanho_fonte]);
  const [lineHeight, setLineHeight] = useState([defaultReadingPreferences.espacamento_linha]);
  const [dyslexic, setDyslexic] = useState(false);
  const [bold, setBold] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState([defaultReadingPreferences.velocidade_tts]);
  const [contrast, setContrast] = useState<"claro" | "escuro" | "alto">(
    defaultReadingPreferences.modo_tema,
  );
  const [documentName, setDocumentName] = useState("Neurociência da leitura.pdf");
  const [paragraphs, setParagraphs] = useState(defaultParagraphs);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const speechGenerationRef = useRef(0);
  const speechQueueRef = useRef<Array<{ text: string; start: number }>>([]);
  const speechIndexRef = useRef(0);
  const speechVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const speechSessionRef = useRef(false);

  const persistPreferences = async (next: ReadingPreferences) => {
    await saveReadingPreferencesToSupabase(next);
  };

  const buildReadingPreferencesFromUi = (): ReadingPreferences => ({
    fonte: dyslexic ? "OpenDyslexic" : "DM Sans",
    tamanho_fonte: fontSize[0],
    espacamento_linha: lineHeight[0],
    modo_tema: contrast,
    modo_foco: focusMode,
    velocidade_tts: ttsSpeed[0],
  });

  useEffect(() => {
    const localPreferences = readLocalReadingPreferences();
    const loadedFromLocal = { ...localPreferences };
    const load = async () => {
      const cloudPreferences = await loadReadingPreferencesFromSupabase();
      const finalPreferences = cloudPreferences ?? loadedFromLocal;
      setFontSize([finalPreferences.tamanho_fonte]);
      setLineHeight([finalPreferences.espacamento_linha]);
      setTtsSpeed([finalPreferences.velocidade_tts]);
      setFocusMode(finalPreferences.modo_foco);
      setContrast(finalPreferences.modo_tema);
      setDyslexic(finalPreferences.fonte === "OpenDyslexic");
    };
    void load()
      .catch(() => undefined)
      .finally(() => setPreferencesLoaded(true));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const selectPortugueseVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      speechVoiceRef.current =
        voices.find((voice) => voice.lang.toLowerCase() === "pt-br") ??
        voices.find((voice) => voice.lang.toLowerCase().startsWith("pt-br")) ??
        voices.find((voice) => voice.lang.toLowerCase().startsWith("pt")) ??
        null;
    };

    selectPortugueseVoice();
    window.speechSynthesis.addEventListener("voiceschanged", selectPortugueseVoice);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", selectPortugueseVoice);
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("lire.pending-document");
    if (!stored) {
      setDocumentLoaded(true);
      return;
    }

    try {
      const pending = JSON.parse(stored) as { id?: string; name?: string; content?: string };
      if (pending.id) {
        setDocumentId(pending.id);
        void getDocument(pending.id).then((document) => {
          if (!document) return;
          setDocumentName(document.name);
          setParagraphs(document.content.split(/\n\s*\n/).filter((paragraph) => paragraph.trim()));
        }).catch(() => undefined).finally(() => setDocumentLoaded(true));
      } else if (pending.name && pending.content) {
        setDocumentName(pending.name);
        setParagraphs(pending.content.split(/\n\s*\n/).filter((paragraph) => paragraph.trim()));
        setDocumentLoaded(true);
      } else {
        setDocumentLoaded(true);
      }
    } catch {
      sessionStorage.removeItem("lire.pending-document");
      setDocumentLoaded(true);
    }

  }, []);

  useEffect(() => {
    if (!documentId) return;

    let lastProgress = -1;
    const updateProgress = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollableHeight <= 0
        ? 100
        : Math.min(100, Math.max(0, Math.round((window.scrollY / scrollableHeight) * 100)));
      if (progress === lastProgress) return;
      lastProgress = progress;
      void updateDocumentProgress(documentId, progress).catch(() => undefined);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [documentId, paragraphs.length]);

  const sentences = paragraphs.map((paragraph) => paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [paragraph]);
  const ttsSegments: Array<{ id: string; start: number; end: number }> = [];
  let ttsOffset = 0;
  sentences.forEach((paragraphSentences, paragraphIndex) => {
    paragraphSentences.forEach((sentence, sentenceIndex) => {
      ttsSegments.push({
        id: `${paragraphIndex}-${sentenceIndex}`,
        start: ttsOffset,
        end: ttsOffset + sentence.length,
      });
      ttsOffset += sentence.length;
    });
    ttsOffset += 2;
  });

  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speakNextChunk = (rate: number, generation: number) => {
    const chunk = speechQueueRef.current[speechIndexRef.current];
    if (!chunk || speechGenerationRef.current !== generation) {
      speechSessionRef.current = false;
      setPlaying(false);
      setActiveTtsRange(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunk.text);
    utterance.lang = "pt-BR";
    if (speechVoiceRef.current) utterance.voice = speechVoiceRef.current;
    utterance.rate = rate / 100;
    utterance.onstart = () => {
      if (speechGenerationRef.current !== generation) return;
      setPlaying(true);
    };
    utterance.onboundary = (event) => {
      if (speechGenerationRef.current !== generation) return;
      const start = chunk.start + event.charIndex;
      const end = start + (event.charLength || 1);
      setActiveTtsRange({ start, end });
    };
    utterance.onend = () => {
      if (speechGenerationRef.current !== generation) return;
      speechIndexRef.current += 1;
      speakNextChunk(rate, generation);
    };
    utterance.onerror = () => {
      if (speechGenerationRef.current !== generation) return;
      speechSessionRef.current = false;
      setPlaying(false);
      setActiveTtsRange(null);
    };
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const speakText = (rate: number) => {
    const text = paragraphs.join("\n\n");
    const chunks: Array<{ text: string; start: number }> = [];
    const chunkPattern = /[^,.;:!?…]+(?:[,.;:!?…]+|$)/g;
    for (const match of text.matchAll(chunkPattern)) {
      if (match.index === undefined || !match[0].trim()) continue;
      chunks.push({ text: match[0], start: match.index });
    }

    const generation = speechGenerationRef.current + 1;
    speechGenerationRef.current = generation;
    speechQueueRef.current = chunks;
    speechIndexRef.current = 0;
    speechSessionRef.current = true;
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    speakNextChunk(rate, generation);
  };

  const toggleTts = () => {
    if (!isPremium) {
      showUpgrade("Narração por voz (TTS)");
      return;
    }
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      showUpgrade("A narração por voz não está disponível neste navegador");
      return;
    }

    if (speechSessionRef.current && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setPlaying(false);
      return;
    }

    if (speechSessionRef.current && window.speechSynthesis.paused && window.speechSynthesis.speaking) {
      window.speechSynthesis.resume();
      setPlaying(true);
      return;
    }

    speakText(ttsSpeed[0]);
  };

  const changeTtsSpeed = (value: number[]) => {
    const nextSpeed = value[0];
    setTtsSpeed([nextSpeed]);
    const nextPreferences: ReadingPreferences = {
      fonte: dyslexic ? "OpenDyslexic" : "DM Sans",
      tamanho_fonte: fontSize[0],
      espacamento_linha: lineHeight[0],
      modo_tema: contrast,
      modo_foco: focusMode,
      velocidade_tts: nextSpeed,
    };
    void persistPreferences(nextPreferences);
    if (typeof window !== "undefined" && "speechSynthesis" in window &&
      (window.speechSynthesis.speaking || window.speechSynthesis.paused)) {
      setActiveTtsRange(null);
      speakText(nextSpeed);
    }
  };

  useEffect(() => () => {
    speechGenerationRef.current += 1;
    speechSessionRef.current = false;
    speechQueueRef.current = [];
    speechIndexRef.current = 0;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      speechRef.current = null;
      setActiveTtsRange(null);
    }
  }, []);

  const surface =
    contrast === "escuro"
      ? "bg-brand-dark text-brand-cream"
      : contrast === "alto"
        ? "bg-black text-yellow-300"
        : "bg-card text-card-foreground";

  if (!preferencesLoaded || !documentLoaded) {
    return (
      <AppShell title="Carregando leitor...">
        <div className="flex min-h-[60vh] items-center justify-center px-6">
          <div className="rounded-xl border bg-card px-8 py-6 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="mt-4 font-medium">Carregando documento e preferências...</p>
            <p className="mt-1 text-sm text-muted-foreground">Aguarde um instante.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={documentName}
      headerExtra={
        <>
          <Button
            variant={focusMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              const nextFocusMode = !focusMode;
              setFocusMode(nextFocusMode);
              const nextPreferences = buildReadingPreferencesFromUi();
              nextPreferences.modo_foco = nextFocusMode;
              void persistPreferences(nextPreferences);
            }}
          >
            <Focus className="h-4 w-4" /> Modo Foco
          </Button>
          <Button variant="outline" size="sm" onClick={toggleTts}>
            {!isPremium && <Lock className="h-4 w-4 text-accent" aria-label="TTS bloqueado" />}
            <span>TTS</span>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
          className={`mx-auto my-8 max-w-2xl rounded-2xl border p-8 transition-colors ${surface} ${dyslexic ? "font-dyslexic" : ""} ${bold ? "font-bold" : ""}`}
        >
          {sentences.map((paragraphSentences, i) => {
            const dim = focusMode && i + 1 !== activePara;
            return (
              <p
                key={i}
                onMouseEnter={() => setActivePara(i + 1)}
                onMouseLeave={() => setActiveSentence(null)}
                className="mb-6 cursor-pointer transition-opacity"
                style={{
                  fontSize: `${fontSize[0]}px`,
                  lineHeight: `${lineHeight[0]}%`,
                  opacity: dim ? 0.25 : 1,
                }}
              >
                {paragraphSentences.map((sentence, sentenceIndex) => {
                  const sentenceId = `${i}-${sentenceIndex}`;
                  const isActive = focusMode && activeSentence === sentenceId;
                  const sentenceSegment = ttsSegments.find((segment) => segment.id === sentenceId);
                  const isTtsActive = Boolean(
                    activeTtsRange &&
                      sentenceSegment &&
                      activeTtsRange.end > sentenceSegment.start &&
                      activeTtsRange.start < sentenceSegment.end,
                  );
                  return (
                    <span
                      key={sentenceId}
                      onMouseEnter={() => setActiveSentence(sentenceId)}
                      className={`rounded px-0.5 transition-colors ${
                        isActive ? "bg-primary/40" : ""
                      } ${isTtsActive ? "bg-primary/40" : ""} ${
                        focusMode && activeSentence && !isActive ? "opacity-25" : ""
                      }`}
                    >
                      {sentence}{" "}
                    </span>
                  );
                })}
              </p>
            );
          })}
        </article>
        

        {/* Right customization panel with blur overlay */}
        {panelOpen && (
          <button
            aria-label="Fechar painel"
            onClick={() => setPanelOpen(false)}
            className="fixed inset-0 z-40 bg-brand-dark/25"
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
                onClick={() => {
                  const next = !dyslexic;
                  setDyslexic(next);
                  const nextPreferences = buildReadingPreferencesFromUi();
                  nextPreferences.fonte = next ? "OpenDyslexic" : "DM Sans";
                  void persistPreferences(nextPreferences);
                }}
                className={`mt-2 w-full rounded-lg border px-3 py-2 text-left text-sm ${dyslexic ? "border-primary bg-primary/10" : ""}`}
              >
                Fonte OpenDyslexic {dyslexic ? "(ativa)" : ""}
              </button>
              <button
                onClick={() => setBold((v) => !v)}
                className={`mt-2 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm ${bold ? "border-primary bg-primary/10" : ""}`}
              >
                <Bold className="h-4 w-4" />
                Texto em negrito {bold ? "(ativo)" : ""}
              </button>
            </div>

            <div>
              <Label>Tamanho do texto — {fontSize[0]}px</Label>
              <Slider
                className="mt-3"
                min={14}
                max={32}
                step={1}
                value={fontSize}
                onValueChange={(value) => {
                  const next = value[0];
                  setFontSize([next]);
                  const nextPreferences = buildReadingPreferencesFromUi();
                  nextPreferences.tamanho_fonte = next;
                  void persistPreferences(nextPreferences);
                }}
              />
            </div>

            <div>
              <Label>Espaçamento entre linhas — {lineHeight[0]}%</Label>
              <Slider
                className="mt-3"
                min={120}
                max={260}
                step={10}
                value={lineHeight}
                onValueChange={(value) => {
                  const next = value[0];
                  setLineHeight([next]);
                  const nextPreferences = buildReadingPreferencesFromUi();
                  nextPreferences.espacamento_linha = next;
                  void persistPreferences(nextPreferences);
                }}
              />
            </div>

            <div>
              <Label>Contraste</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["claro", "escuro", "alto"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      const nextContrast = c;
                      setContrast(nextContrast);
                      const nextPreferences = buildReadingPreferencesFromUi();
                      nextPreferences.modo_tema = nextContrast;
                      void persistPreferences(nextPreferences);
                    }}
                    className={`rounded-lg border px-2 py-2 text-xs capitalize ${contrast === c ? "border-primary bg-primary/10" : ""}`}
                  >
                    {c === "alto" ? "Alto contraste" : c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2"><Gauge className="h-4 w-4" /> Velocidade do TTS</Label>
              <Slider
                className="mt-3"
                min={50}
                max={200}
                step={10}
                value={ttsSpeed}
                onValueChange={(value) => changeTtsSpeed(value)}
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
