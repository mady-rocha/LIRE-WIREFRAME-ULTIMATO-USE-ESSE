import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Política de Privacidade — Lire" }] }),
  component: PrivacyScreen,
});

const sections = [
  {
    title: "1. Informações Gerais e Compromisso LGPD",
    content: [
      "O Lire é uma aplicação de Tecnologia Assistiva de caráter acadêmico. Comprometemo-nos rigorosamente com a proteção dos seus dados pessoais e a sua privacidade, operando em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).",
    ],
  },
  {
    title: "2. Tratamento de Imagens e Uso da Câmera (Módulo Minerva / Libras)",
    content: [
      "Processamento On-Device (Local): Todo o processamento de vídeo para o reconhecimento de gestos ocorre localmente no seu dispositivo. Nenhuma imagem ou frame da sua câmera é transmitido para servidores externos ou armazenado.",
      "Permissão Contextual: O acesso à câmera é solicitado de forma individual e pode ser revogado a qualquer momento nas configurações do aplicativo.",
    ],
  },
  {
    title: "3. Coleta e Sincronização de Dados em Nuvem",
    content: [
      "O que sincronizamos: Para sua comodidade, sincronizamos via nuvem criptografada apenas suas preferências de interface (tamanho de fonte, tema, cores, velocidade do TTS) e metadados dos seus arquivos.",
      "Seus Arquivos: Seus documentos em PDF e TXT permanecem salvos exclusivamente no armazenamento local do seu computador.",
      "Segurança: A comunicação com o servidor é protegida por criptografia TLS 1.3 em trânsito e AES-256 em repouso.",
    ],
  },
  {
    title: "4. Recurso de Sugestão de Novos Sinais (Opcional)",
    content: [
      "Ao acionar a opção \"Sugerir Sinal\", o sistema captura apenas coordenadas numéricas (landmarks) dos pontos das mãos. Nenhuma imagem da sua face ou do seu ambiente é enviada. O envio é anônimo, criptografado via Web Crypto API e você pode cancelar a sugestão em até 8 dias diretamente pelo app.",
    ],
  },
  {
    title: "5. Uso de Serviços de Terceiros",
    content: [
      "Reescrita de Glosas: A função opcional de reescrita gramatical utiliza processamento de linguagem natural via nuvem. O envio do texto ocorre apenas com sua ação direta.",
      "Síntese de Voz (TTS) e OCR: O OCR e o TTS padrão funcionam totalmente offline.",
    ],
  },
  {
    title: "6. Proteção de Menores e Seus Direitos",
    content: [
      "O aplicativo exige consentimento explícito do responsável legal para menores de 12 anos e possui avisos orientativos para usuários entre 12 e 17 anos ao acessar periféricos.",
      "Direito de Exclusão: Você pode solicitar a exclusão definitiva da sua conta a qualquer momento. Seus dados pessoais serão eliminados em até 30 dias.",
    ],
  },
];

function PrivacyScreen() {
  const navigate = useNavigate();

  return (
    <AppShell title="Política de privacidade">
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/settings" })}
          className="mb-2 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Configurações
        </Button>

        <article className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <header className="border-b border-border/60 pb-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Política de privacidade e termos de uso</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sistema Lire · Plataforma Desktop de Tecnologia Assistiva</p>
          </header>

          <div className="divide-y divide-border/60">
            {sections.map((section) => (
              <section key={section.title} className="space-y-3 py-6 first:pt-0 last:pb-0">
                <h2 className="font-display text-lg font-bold text-foreground">{section.title}</h2>
                {section.content.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </article>
      </div>
    </AppShell>
  );
}