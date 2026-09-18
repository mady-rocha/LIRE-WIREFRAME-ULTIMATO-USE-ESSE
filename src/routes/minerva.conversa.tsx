import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera as CameraIcon, Send, RefreshCcw, Hand } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PremiumBadge } from "@/components/PremiumBadge";
import { useApp } from "@/lib/app-context";
import { supabase, supabaseConfigurado } from "@/lib/supabase";
import { salvarSessaoAvatar } from "@/lib/avatar-session";

export const Route = createFileRoute("/minerva/conversa")({
  head: () => ({ meta: [{ title: "Conversa por câmera — Minerva | Lire" }] }),
  component: Conversa,
});

// ── config do modelo ──────────────────────────────────────────────────────

const LIMIAR = 0.85;
const FRAMES_JANELA = 30;
const FRAMES_ESTABILIDADE = 8; // precisa repetir a mesma predição por N frames seguidos pra "confirmar"
const DIM_POSE = 33 * 4;
const DIM_MAO = 21 * 3;
const MODELO_URL = "/models/libras_model_tfjs"; // ajuste pro caminho real dos assets

// liga quando tiver mais gestos treinados e o popup automático fizer sentido
// (com poucas classes, quase tudo dá baixa confiança e o popup vira spam)
const POPUP_AUTOMATICO_ATIVO = false;
const FRAMES_BAIXA_CONFIANCA_PRA_POPUP = 45; // ~1.5s a 30fps sem reconhecer nada

// ── inferência (espelho do exportar_tfjs.py — sem depender do TF.js) ───────

type Camada =
  | { type: "lstm"; units: number; returnSequences: boolean; kernel: Float32Array; recKernel: Float32Array; bias: Float32Array }
  | { type: "dense"; units: number; activation: string; kernel: Float32Array; bias: Float32Array };

function sigmoid(x: number[]) {
  return x.map((v) => 1 / (1 + Math.exp(-v)));
}
function tanhArr(x: number[]) {
  return x.map((v) => Math.tanh(v));
}
function matMul(a: Float32Array | number[], b: Float32Array, aCols: number) {
  const aRows = a.length / aCols;
  const bCols = b.length / aCols;
  const out = new Float32Array(aRows * bCols);
  for (let i = 0; i < aRows; i++) {
    for (let j = 0; j < bCols; j++) {
      let s = 0;
      for (let k = 0; k < aCols; k++) s += a[i * aCols + k] * b[k * bCols + j];
      out[i * bCols + j] = s;
    }
  }
  return out;
}
function vecAdd(a: number[], b: number[]) {
  return a.map((v, i) => v + b[i]);
}
function vecMul(a: number[], b: number[]) {
  return a.map((v, i) => v * b[i]);
}

function lstmStep(
  xt: number[],
  h: number[],
  c: number[],
  kernel: Float32Array,
  recKernel: Float32Array,
  bias: Float32Array,
  units: number,
) {
  const z1 = matMul(xt, kernel, xt.length);
  const z2 = matMul(h, recKernel, units);
  const z = vecAdd(vecAdd(Array.from(z1), Array.from(z2)), Array.from(bias));

  const i_ = sigmoid(z.slice(0, units));
  const f_ = sigmoid(z.slice(units, units * 2));
  const g_ = tanhArr(z.slice(units * 2, units * 3));
  const o_ = sigmoid(z.slice(units * 3, units * 4));

  const c_ = vecAdd(vecMul(f_, c), vecMul(i_, g_));
  const h_ = vecMul(o_, tanhArr(c_));

  return { h: h_, c: c_ };
}

function lstm(
  seq: number[][],
  kernel: Float32Array,
  recKernel: Float32Array,
  bias: Float32Array,
  units: number,
  returnSeq: boolean,
) {
  let h = new Array(units).fill(0);
  let c = new Array(units).fill(0);
  const saidas: number[][] = [];

  for (let t = 0; t < seq.length; t++) {
    const r = lstmStep(seq[t], h, c, kernel, recKernel, bias, units);
    h = r.h;
    c = r.c;
    if (returnSeq) saidas.push([...h]);
  }
  return returnSeq ? saidas : h;
}

function dense(x: number[], kernel: Float32Array, bias: Float32Array, activation: string, inDim: number, outDim: number) {
  const out = new Array(outDim).fill(0);
  for (let j = 0; j < outDim; j++) {
    let s = bias[j];
    for (let i = 0; i < inDim; i++) s += x[i] * kernel[i * outDim + j];
    out[j] = s;
  }
  if (activation === "relu") return out.map((v) => Math.max(0, v));
  if (activation === "softmax") {
    const mx = Math.max(...out);
    const exp = out.map((v) => Math.exp(v - mx));
    const sum = exp.reduce((a, b) => a + b, 0);
    return exp.map((v) => v / sum);
  }
  return out;
}

function prever(seq: number[][], camadas: Camada[]): number[] {
  let x: any = seq;
  for (const cam of camadas) {
    if (cam.type === "lstm") {
      x = lstm(x, cam.kernel, cam.recKernel, cam.bias, cam.units, cam.returnSequences);
    } else {
      x = dense(x, cam.kernel, cam.bias, cam.activation, x.length, cam.units);
    }
  }
  return x;
}

function extrairLandmarks(results: any): number[] {
  const pose = results.poseLandmarks
    ? results.poseLandmarks.flatMap((lm: any) => [lm.x, lm.y, lm.z, lm.visibility ?? 0])
    : new Array(DIM_POSE).fill(0);

  let maoEsq = new Array(DIM_MAO).fill(0);
  let maoDir = new Array(DIM_MAO).fill(0);

  if (results.leftHandLandmarks) maoEsq = results.leftHandLandmarks.flatMap((lm: any) => [lm.x, lm.y, lm.z]);
  if (results.rightHandLandmarks) maoDir = results.rightHandLandmarks.flatMap((lm: any) => [lm.x, lm.y, lm.z]);

  return [...pose, ...maoEsq, ...maoDir]; // 258 valores
}

// carrega os scripts do MediaPipe via CDN (mesmo caminho já validado no libras_test.html)
function carregarScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`falha ao carregar ${src}`));
    document.body.appendChild(s);
  });
}

// ── componente ───────────────────────────────────────────────────────────

function Conversa() {
  const { isPremium, showUpgrade } = useApp();
  const [text, setText] = useState("");
  const [textoEnviando, setTextoEnviando] = useState(false);

  async function enviarParaAvatar() {
    if (!text.trim()) return;

    setTextoEnviando(true);
    const resultado = await salvarSessaoAvatar(text);

    setTextoEnviando(false);
    if (!resultado.ok) {
      if (resultado.reason !== "supabase_unconfigured") {
        console.error("erro ao enviar texto pro avatar:", resultado.error ?? resultado.message);
      }
      return;
    }
    setText("");
  }

  const videoRef = useRef<HTMLVideoElement>(null);
  const camadasRef = useRef<Camada[] | null>(null);
  const sinaisRef = useRef<string[]>([]);
  const janelaRef = useRef<number[][]>([]);
  const maoDetectadaRef = useRef<boolean[]>([]);
  const ultimasPredicoesRef = useRef<string[]>([]);
  const holisticRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  const [statusModelo, setStatusModelo] = useState<"carregando" | "ok" | "erro">("carregando");
  const [erroMsg, setErroMsg] = useState("");
  const [sinalAtual, setSinalAtual] = useState("—");
  const [confianca, setConfianca] = useState(0);
  const [barras, setBarras] = useState<Record<string, number>>({});
  const [framesCount, setFramesCount] = useState(0);
  const [cameraOn, setCameraOn] = useState(true);
  const glosaRef = useRef<string[]>([]);
  const [glosaTexto, setGlosaTexto] = useState("");
  const [textoNatural, setTextoNatural] = useState("");
  const [reescrevendo, setReescrevendo] = useState(false);
  const baixaConfiancaCountRef = useRef(0);
  const [popupSugestaoAberto, setPopupSugestaoAberto] = useState(false);
  const sessaoIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isPremium) showUpgrade("Conversa por câmera (Libras → texto)");
  }, [isPremium, showUpgrade]);

  useEffect(() => {
    if (!isPremium || !cameraOn) return; // só inicia câmera/modelo se tiver acesso e estiver ligada

    let cancelado = false;

    async function carregarModelo() {
      const [manifestRes, weightsRes] = await Promise.all([
        fetch(`${MODELO_URL}/model.json`),
        fetch(`${MODELO_URL}/weights.bin`),
      ]);
      const manifest = await manifestRes.json();
      const weightsBuf = await weightsRes.arrayBuffer();
      const allWeights = new Float32Array(weightsBuf);

      const pesoMap: Record<string, Float32Array> = {};
      for (const w of manifest.weights) {
        pesoMap[w.name] = allWeights.slice(w.offset, w.offset + w.length);
      }

      const camadas: Camada[] = manifest.layers.map((l: any) =>
        l.type === "lstm"
          ? {
              type: "lstm",
              units: l.units,
              returnSequences: l.returnSequences,
              kernel: pesoMap[l.kernel],
              recKernel: pesoMap[l.recurrentKernel],
              bias: pesoMap[l.bias],
            }
          : {
              type: "dense",
              units: l.units,
              activation: l.activation,
              kernel: pesoMap[l.kernel],
              bias: pesoMap[l.bias],
            },
      );

      camadasRef.current = camadas;
      sinaisRef.current = manifest.classes;
      setBarras(Object.fromEntries(manifest.classes.map((s: string) => [s, 0])));
    }

    async function criarSessao() {
      if (!supabaseConfigurado) return;

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data, error } = await supabase
        .from("sessao_libras")
        .insert({
          id_usuario: userData.user.id,
          inicio: new Date().toISOString(),
          tipo: "reconhecimento",
        })
        .select("id")
        .single();

      if (error) {
        console.error("erro ao criar sessão:", error);
        return;
      }
      sessaoIdRef.current = data.id;
    }

    async function init() {
      try {
        await carregarModelo();
        if (cancelado) return;
        setStatusModelo("ok");
      } catch (e: any) {
        setStatusModelo("erro");
        setErroMsg(e.message ?? "erro ao carregar modelo");
        return;
      }

      criarSessao(); // não bloqueia o resto do init — roda em paralelo

      await Promise.all([
        carregarScript("https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js"),
        carregarScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"),
      ]);
      if (cancelado || !videoRef.current) return;

      const Holistic = (window as any).Holistic;
      const CameraUtil = (window as any).Camera;

      const holistic = new Holistic({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${f}`,
      });
      holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        selfieMode: false,
      });

      holistic.onResults((results: any) => {
        if (!camadasRef.current) return;

        const temMao = Boolean(results.leftHandLandmarks) || Boolean(results.rightHandLandmarks);
        const vetor = extrairLandmarks(results);
        const janela = janelaRef.current;
        janela.push(vetor);
        if (janela.length > FRAMES_JANELA) janela.shift();
        setFramesCount(janela.length);

        const maos = maoDetectadaRef.current;
        maos.push(temMao);
        if (maos.length > FRAMES_JANELA) maos.shift();

        if (janela.length < FRAMES_JANELA) {
          setSinalAtual("...");
          return;
        }

        // exige mão detectada em pelo menos 70% dos frames da janela —
        // sem isso, nem roda o modelo (evita prever sinal com mão fora de quadro)
        const framesComMao = maos.filter(Boolean).length;
        if (framesComMao < FRAMES_JANELA * 0.7) {
          setSinalAtual("—");
          setConfianca(0);
          return;
        }

        const resultado = prever(janela, camadasRef.current);
        const sinais = sinaisRef.current;
        const idx = resultado.indexOf(Math.max(...resultado));
        const conf = resultado[idx];

        setBarras(Object.fromEntries(sinais.map((s, i) => [s, resultado[i]])));
        setConfianca(conf);

        // exige a mesma predição se repetindo por N frames seguidos antes de
        // "confirmar" — evita pegar movimento de transição entre sinais
        const candidato = conf >= LIMIAR ? sinais[idx] : null;
        const ultimas = ultimasPredicoesRef.current;
        ultimas.push(candidato ?? "");
        if (ultimas.length > FRAMES_ESTABILIDADE) ultimas.shift();

        const estavel =
          ultimas.length === FRAMES_ESTABILIDADE &&
          ultimas.every((s) => s === candidato) &&
          candidato !== null;

        setSinalAtual(estavel ? candidato!.replace("_", " ") : "—");

        // acumula na glosa só quando confirma um sinal NOVO (evita repetir o mesmo
        // sinal a cada frame enquanto a pessoa segura a posição)
        if (estavel && candidato) {
          const glosa = glosaRef.current;
          const ultimoDaGlosa = glosa[glosa.length - 1];
          if (ultimoDaGlosa !== candidato) {
            glosa.push(candidato);
            setGlosaTexto(glosa.join(" "));
          }
        }

        // gatilho do popup automático — desligado por enquanto (ver POPUP_AUTOMATICO_ATIVO)
        if (POPUP_AUTOMATICO_ATIVO) {
          if (conf < LIMIAR) {
            baixaConfiancaCountRef.current += 1;
            if (baixaConfiancaCountRef.current >= FRAMES_BAIXA_CONFIANCA_PRA_POPUP && !popupSugestaoAberto) {
              setPopupSugestaoAberto(true);
              baixaConfiancaCountRef.current = 0;
            }
          } else {
            baixaConfiancaCountRef.current = 0;
          }
        }
      });

      holisticRef.current = holistic;

      const cam = new CameraUtil(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) await holistic.send({ image: videoRef.current });
        },
        width: 480,
        height: 360,
      });
      cam.start();
      cameraRef.current = cam;
    }

    init();

    return () => {
      cancelado = true;
      cameraRef.current?.stop?.(); // para o loop do MediaPipe

      // para de vez a captura da webcam (o Camera util não solta o stream sozinho)
      const stream = videoRef.current?.srcObject as MediaStream | undefined;
      stream?.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;

      holisticRef.current?.close?.();
      janelaRef.current = [];
      maoDetectadaRef.current = [];
      ultimasPredicoesRef.current = [];
      glosaRef.current = [];
      setGlosaTexto("");
      setTextoNatural("");
      setFramesCount(0);
      setSinalAtual("—");
      setConfianca(0);

      if (sessaoIdRef.current) {
        supabase
          .from("sessao_libras")
          .update({ fim: new Date().toISOString() })
          .eq("id", sessaoIdRef.current)
          .then(({ error }) => {
            if (error) console.error("erro ao fechar sessão:", error);
          });
        sessaoIdRef.current = null;
      }
    };
  }, [isPremium, cameraOn]);

  const [sugestaoAberta, setSugestaoAberta] = useState(false);
  const [nomeSinal, setNomeSinal] = useState("");
  const [descricaoSignificado, setDescricaoSignificado] = useState("");
  const [sugestaoStatus, setSugestaoStatus] = useState<"idle" | "enviando" | "ok" | "erro">("idle");
  const [sugestaoErroMsg, setSugestaoErroMsg] = useState("");

  const [reescritaErro, setReescritaErro] = useState("");

  async function reescreverGlosa() {
    if (!glosaTexto) return;
    setReescrevendo(true);
    setReescritaErro("");

    let textoGerado: string | null = null;
    if (supabaseConfigurado) {
      const { data, error } = await supabase.functions.invoke("reescrever-final", {
        body: { glosa: glosaTexto },
      });
      if (error) {
        console.error("erro ao reescrever glosa:", error);
        setReescritaErro("não foi possível gerar o texto natural agora");
      } else {
        textoGerado = data?.texto ?? null;
      }
    }

    if (textoGerado) {
      setTextoNatural(textoGerado);

      // só grava o registro da tradução quando realmente temos a glosa_gerado
      // (a coluna é NOT NULL — sem isso o insert sempre falha)
      if (supabaseConfigurado && sessaoIdRef.current) {
        const { error } = await supabase.from("traduc_libras").insert({
          id_sessao_libras: sessaoIdRef.current,
          id_banco_gestos: null,
          texto_entrada: glosaTexto,
          glosa_gerado: textoGerado,
          duracao_animacao: null,
          timestamp: new Date().toISOString(),
        });
        if (error) console.error("erro ao salvar tradução:", error);
      }
    }

    setReescrevendo(false);
  }

  function abrirSugestao() {
    if (janelaRef.current.length < FRAMES_JANELA) return;
    setNomeSinal(sinalAtual !== "—" ? sinalAtual : "");
    setDescricaoSignificado("");
    setSugestaoStatus("idle");
    setSugestaoAberta(true);
  }

  async function enviarSugestao() {
    if (!nomeSinal.trim()) return;

    if (!supabaseConfigurado) {
      setSugestaoStatus("erro");
      setSugestaoErroMsg("Supabase ainda não configurado (.env sem VITE_SUPABASE_URL/ANON_KEY)");
      return;
    }

    if (!sessaoIdRef.current) {
      setSugestaoStatus("erro");
      setSugestaoErroMsg("sessão ainda não foi criada — tenta de novo em alguns segundos");
      return;
    }

    setSugestaoStatus("enviando");

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setSugestaoStatus("erro");
      setSugestaoErroMsg("usuário não autenticado");
      return;
    }

    // 1) registra o gesto não reconhecido, ligado à sessão atual
    const { data: gestoData, error: gestoError } = await supabase
      .from("gesto_nao_reconhecido")
      .insert({
        id_sessao_libras: sessaoIdRef.current,
        confidence_score: confianca,
        timestamp: new Date().toISOString(),
        landmarks_capturados: janelaRef.current,
        campo: null, // TODO: confirmar com o time o que esse campo representa
      })
      .select("id")
      .single();

    if (gestoError) {
      console.error("erro ao registrar gesto não reconhecido:", gestoError);
      setSugestaoStatus("erro");
      setSugestaoErroMsg(gestoError.message);
      return;
    }

    // 2) registra a sugestão, referenciando o gesto acima
    const { error } = await supabase.from("sugestao_gesto").insert({
      id_usuario: userData.user.id,
      id_gesto_nao_rec: gestoData.id,
      descricao_significado: `${nomeSinal.trim()}${descricaoSignificado.trim() ? " — " + descricaoSignificado.trim() : ""}`,
      landmarks_frames_json: janelaRef.current,
      status_sugestao: "pendente",
      data_envio: new Date().toISOString(),
    });

    if (error) {
      console.error("erro ao enviar sugestão:", error);
      setSugestaoStatus("erro");
      setSugestaoErroMsg(error.message);
      return;
    }

    setSugestaoStatus("ok");
    setTimeout(() => {
      setSugestaoAberta(false);
      setPopupSugestaoAberto(false);
      setSugestaoStatus("idle");
    }, 1500);
  }

  return (
    <AppShell title="Conversa">
      <div className="mx-auto grid max-w-5xl gap-4 px-6 py-8 lg:grid-cols-2">
        {/* Left — deaf input (camera) */}
        <section className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Você (câmera)</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCameraOn((v) => !v)}
              >
                <CameraIcon className="h-4 w-4" />
                {cameraOn ? "Desligar câmera" : "Ligar câmera"}
              </Button>
              <PremiumBadge />
            </div>
          </div>

          <div className="relative mt-4 flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-brand-dark text-brand-cream/70">
            {cameraOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-sm text-brand-cream/50">
                <CameraIcon className="h-8 w-8" />
                <span>câmera desligada</span>
              </div>
            )}
            {cameraOn && statusModelo !== "ok" && (
              <div className="absolute inset-0 flex items-center justify-center bg-brand-dark/80 text-sm">
                {statusModelo === "carregando" ? (
                  <span>carregando modelo…</span>
                ) : (
                  <span className="text-red-400">erro ao carregar modelo: {erroMsg}</span>
                )}
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-secondary">
                {framesCount < FRAMES_JANELA ? `capturando… (${framesCount}/${FRAMES_JANELA})` : "Reconhecendo…"}
              </span>
              <span className="text-muted-foreground">Confiança {(confianca * 100).toFixed(0)}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-secondary" style={{ width: `${confianca * 100}%` }} />
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
            <p className="text-muted-foreground">
              Sinal reconhecido: <span className="text-foreground">{sinalAtual}</span>
            </p>
            {glosaTexto && (
              <p className="mt-2 text-muted-foreground">
                Glosa: <span className="text-foreground">{glosaTexto}</span>
              </p>
            )}
            {textoNatural && (
              <p className="mt-2 text-muted-foreground">
                Reescrito: <span className="text-foreground">{textoNatural}</span>
              </p>
            )}
            {reescritaErro && <p className="mt-2 text-xs text-red-500">{reescritaErro}</p>}
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" disabled={!glosaTexto || reescrevendo} onClick={reescreverGlosa}>
              <RefreshCcw className="h-4 w-4" /> {reescrevendo ? "Reescrevendo..." : "Reescrever em português natural"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={framesCount < FRAMES_JANELA}
              onClick={abrirSugestao}
            >
              <Hand className="h-4 w-4" /> Sugerir esse gesto
            </Button>
            {glosaTexto && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  glosaRef.current = [];
                  setGlosaTexto("");
                  setTextoNatural("");
                }}
              >
                Limpar
              </Button>
            )}
          </div>

          {(sugestaoAberta || popupSugestaoAberto) && (
            <div className="mt-3 space-y-3 rounded-lg border bg-muted/30 p-3">
              <p className="text-sm font-medium">
                {popupSugestaoAberto && !sugestaoAberta
                  ? "Não estamos reconhecendo esse gesto — quer sugerir um novo?"
                  : "Sugerir novo gesto"}
              </p>

              <div>
                <label className="text-xs text-muted-foreground">Nome do sinal</label>
                <input
                  type="text"
                  value={nomeSinal}
                  onChange={(e) => setNomeSinal(e.target.value)}
                  placeholder="ex: Obrigado"
                  className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Descrição / significado</label>
                <Textarea
                  value={descricaoSignificado}
                  onChange={(e) => setDescricaoSignificado(e.target.value)}
                  placeholder="Explica quando e como esse sinal é usado…"
                  className="mt-1 min-h-16 text-sm"
                />
              </div>

              {sugestaoStatus === "erro" && (
                <p className="text-xs text-red-500">erro ao enviar: {sugestaoErroMsg}</p>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={!nomeSinal.trim() || sugestaoStatus === "enviando"}
                  onClick={enviarSugestao}
                >
                  {sugestaoStatus === "enviando" && "Enviando..."}
                  {sugestaoStatus === "ok" && "Enviado!"}
                  {(sugestaoStatus === "idle" || sugestaoStatus === "erro") && "Enviar sugestão"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSugestaoAberta(false);
                    setPopupSugestaoAberto(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Right — hearing input (text → avatar) */}
        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-display text-lg font-bold">Ouvinte (texto)</h2>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite uma mensagem para o avatar interpretar em Libras…"
            className="mt-4 min-h-20"
          />
          <Button className="mt-3 w-full" disabled={!text.trim() || textoEnviando} onClick={enviarParaAvatar}>
            <Send className="h-4 w-4" /> {textoEnviando ? "Enviando..." : "Enviar para Avatar"}
          </Button>

          <div className="mt-5 flex aspect-square items-center justify-center rounded-xl bg-gradient-to-b from-secondary/15 to-brand-dark/10">
            <div className="flex flex-col items-center text-muted-foreground">
              <Hand className="h-12 w-12 text-secondary" />
              <p className="mt-3 text-sm">Avatar 3D — em repouso</p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
