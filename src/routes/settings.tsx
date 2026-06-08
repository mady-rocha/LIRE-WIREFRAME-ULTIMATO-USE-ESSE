import { createFileRoute } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { User, UserCog, CreditCard, Type, ShieldCheck, Info, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PremiumBadge } from "@/components/PremiumBadge";
import { useApp } from "@/lib/app-context";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações — Lire" }] }),
  component: SettingsScreen;
});

function Section({ icon: Icon, title, children }: { icon: typeof User; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <Icon className="h-5 w-5 text-accent" /> {title}
      </h2>
      <div className="mt-4 space-y-2">{children}</div>
    </section>
  );
}

function Row({ label, action }: { label: string; action: ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-1 py-2 text-sm">
      <span>{label}</span>
      {action}
    </div>
  );
}

function SettingsScreen() {
  const { module, isPremium, requestModuleSwitch } = useApp();

  return (
    <AppShell title="Configurações">
      <div className="mx-auto max-w-2xl space-y-5 px-6 py-8">
        <Section icon={User} title="Conta">
          <Row label="Alterar e-mail" action={<Button variant="ghost" size="sm">Editar <ChevronRight className="h-4 w-4" /></Button>} />
          <Row label="Alterar senha" action={<Button variant="ghost" size="sm">Editar <ChevronRight className="h-4 w-4" /></Button>} />
          <Row label="Excluir conta" action={<Button variant="ghost" size="sm" className="text-destructive">Excluir</Button>} />
        </Section>

        <Section icon={UserCog} title="Perfil">
          <Row
            label={`Módulo atual: ${module === "minerva" ? "Minerva" : "Jano"}`}
            action={
              <Button variant="outline" size="sm" onClick={() => requestModuleSwitch(module === "jano" ? "minerva" : "jano")}>
                Trocar para {module === "jano" ? "Minerva" : "Jano"}
              </Button>
            }
          />
        </Section>

        <Section icon={CreditCard} title="Plano">
          <div className="flex items-center justify-between rounded-lg bg-muted/40 p-4">
            <div>
              <p className="font-semibold">{isPremium ? "Premium" : "Gratuito"}</p>
              <p className="text-sm text-muted-foreground">
                {isPremium ? "R$19,90/mês — renovação ativa" : "Recursos básicos disponíveis"}
              </p>
            </div>
            {isPremium ? <PremiumBadge /> : <Button size="sm">Assinar Premium</Button>}
          </div>
        </Section>

        <Section icon={Type} title="Preferências de leitura">
          <Row label="Fonte padrão" action={<span className="text-muted-foreground">DM Sans</span>} />
          <Row label="Tamanho padrão" action={<span className="text-muted-foreground">20px</span>} />
          <Row label="Modo escuro" action={<Switch aria-label="Modo escuro" />} />
        </Section>

        <Section icon={ShieldCheck} title="Privacidade">
          <Row label="Permitir acesso à câmera" action={<Switch defaultChecked aria-label="Câmera" />} />
          <Row label="Salvar histórico de leitura" action={<Switch defaultChecked aria-label="Histórico" />} />
          <Row label="Sincronizar dados na nuvem" action={<Switch aria-label="Nuvem" />} />
        </Section>

        <Section icon={Info} title="Sobre o Lire">
          <Row label="Versão" action={<span className="text-muted-foreground">1.0.0</span>} />
          <Row label="Créditos" action={<Button variant="ghost" size="sm">Ver</Button>} />
          <Row label="Política de privacidade" action={<Button variant="ghost" size="sm">Abrir</Button>} />
        </Section>
      </div>
    </AppShell>
  );
}
