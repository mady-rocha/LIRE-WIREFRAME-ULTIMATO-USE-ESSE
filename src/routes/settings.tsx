import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import { User, UserCog, CreditCard, Type, ShieldCheck, Info, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useApp, type AppFont } from "@/lib/app-context";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações — Lire" }] }),
  component: SettingsScreen,
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
  const { module, isPremium, subscriptionPlan, requestModuleSwitch, darkMode, setDarkMode, appFont, setAppFont } = useApp();
  const navigate = useNavigate();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);

  const resetAccountFeedback = () => {
    setAccountMessage(null);
    setAccountError(null);
  };

  const changeEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetAccountFeedback();
    const nextEmail = email.trim().toLowerCase();
    if (!nextEmail) {
      setAccountError("Digite o novo e-mail.");
      return;
    }
    if (currentEmail && nextEmail === currentEmail.toLowerCase()) {
      setAccountError("Digite um e-mail diferente do endereço atual.");
      return;
    }
    setSavingAccount(true);
    const { error } = await supabase.functions.invoke("change-email", {
      body: { email: nextEmail },
    });
    setSavingAccount(false);
    if (error) {
      setAccountError(error.message);
      return;
    }
    setEmailDialogOpen(false);
    setEmail("");
    setCurrentEmail(nextEmail);
    setAccountMessage("E-mail alterado com sucesso.");
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetAccountFeedback();
    if (password.length < 6) {
      setAccountError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== passwordConfirmation) {
      setAccountError("As senhas não coincidem.");
      return;
    }
    setSavingAccount(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingAccount(false);
    if (error) {
      setAccountError(error.message);
      return;
    }
    setPasswordDialogOpen(false);
    setPassword("");
    setPasswordConfirmation("");
    setAccountMessage("Senha alterada com sucesso.");
  };

  const signOut = async () => {
    resetAccountFeedback();
    setSavingAccount(true);
    const { error } = await supabase.auth.signOut();
    setSavingAccount(false);
    if (error) {
      setAccountError(error.message);
      return;
    }
    navigate({ to: "/auth" });
  };

  const deleteAccount = async () => {
    resetAccountFeedback();
    setSavingAccount(true);
    const { error } = await supabase.functions.invoke("delete-account", { body: {} });
    setSavingAccount(false);
    if (error) {
      let message = error.message;
      const response = (error as { context?: Response }).context;
      if (response) {
        try {
          const body = (await response.clone().json()) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          // Keep the SDK error when the function did not return JSON.
        }
      }
      setAccountError(message);
      return;
    }
    setDeleteDialogOpen(false);
    navigate({ to: "/auth" });
  };

  return (
    <AppShell title="Configurações">
      <div className="mx-auto max-w-2xl space-y-5 px-6 py-8">
        <Section icon={User} title="Conta">
          {accountMessage && <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{accountMessage}</p>}
          {accountError && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{accountError}</p>}
          <Row label="Alterar e-mail" action={<Button variant="ghost" size="sm" onClick={() => {
            resetAccountFeedback();
            void supabase.auth.getUser().then(({ data }) => setCurrentEmail(data.user?.email ?? null));
            setEmail("");
            setEmailDialogOpen(true);
          }}>Editar <ChevronRight className="h-4 w-4" /></Button>} />
          <Row label="Alterar senha" action={<Button variant="ghost" size="sm" onClick={() => { resetAccountFeedback(); setPasswordDialogOpen(true); }}>Editar <ChevronRight className="h-4 w-4" /></Button>} />
          <Row label="Sessão" action={<Button variant="ghost" size="sm" className="text-destructive" onClick={() => void signOut()} disabled={savingAccount}>{savingAccount ? "Saindo..." : "Deslogar"}</Button>} />
          <Row label="Conta" action={<Button variant="ghost" size="sm" className="text-destructive" onClick={() => { resetAccountFeedback(); setDeleteDialogOpen(true); }} disabled={savingAccount}>Apagar conta</Button>} />
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
                {subscriptionPlan === "annual" ? "R$199,90/ano — renovação ativa" : subscriptionPlan === "monthly" ? "R$19,90/mês — renovação ativa" : "Recursos básicos disponíveis"}
              </p>
            </div>
            {isPremium ? <Button variant="outline" size="sm" onClick={() => navigate({ to: "/plans" })}>Alterar plano</Button> : <Button size="sm" onClick={() => navigate({ to: "/plans" })}>Assinar Premium</Button>}
          </div>
        </Section>

        <Section icon={Type} title="Preferências de leitura">
          <Row
            label="Fonte padrão"
            action={
              <select
                value={appFont}
                onChange={(event) => setAppFont(event.target.value as AppFont)}
                className="rounded-md border bg-background px-2 py-1.5 text-sm"
                aria-label="Fonte padrão"
              >
                <option value="DM Sans">DM Sans</option>
                <option value="OpenDyslexic">OpenDyslexic</option>
                <option value="OpenDyslexicAlta">OpenDyslexic Alta</option>
                <option value="OpenDyslexicMono">OpenDyslexic Mono</option>
              </select>
            }
          />
          <Row label="Tamanho padrão" action={<span className="text-muted-foreground">20px</span>} />
          <Row label="Modo escuro" action={<Switch checked={darkMode} onCheckedChange={setDarkMode} aria-label="Modo escuro" />} />
        </Section>

        <Section icon={ShieldCheck} title="Privacidade">
          <Row label="Permitir acesso à câmera" action={<Switch defaultChecked aria-label="Câmera" />} />
          <Row label="Salvar histórico de leitura" action={<Switch defaultChecked aria-label="Histórico" />} />
          <Row label="Sincronizar dados na nuvem" action={<Switch aria-label="Nuvem" />} />
        </Section>

        <Section icon={Info} title="Sobre o Lire">
          <Row label="Versão" action={<span className="text-muted-foreground">1.0.0</span>} />
          <Row label="Créditos" action={<Button variant="ghost" size="sm" onClick={() => navigate({ to: "/credits" })}>Ver</Button>} />
          <Row label="Política de privacidade" action={<Button variant="ghost" size="sm" onClick={() => navigate({ to: "/privacy" })}>Abrir</Button>} />
        </Section>
      </div>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <form onSubmit={changeEmail}>
            <DialogHeader>
              <DialogTitle>Alterar e-mail</DialogTitle>
              <DialogDescription>Você receberá um e-mail para confirmar o novo endereço.</DialogDescription>
            </DialogHeader>
            <div className="py-5">
              {currentEmail && <p className="mb-4 text-sm text-muted-foreground">E-mail atual: {currentEmail}</p>}
              <Label htmlFor="new-email">Novo e-mail</Label>
              <Input id="new-email" name="new-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2" required autoComplete="off" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={savingAccount}>{savingAccount ? "Salvando..." : "Salvar e-mail"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <form onSubmit={changePassword}>
            <DialogHeader>
              <DialogTitle>Alterar senha</DialogTitle>
              <DialogDescription>Escolha uma nova senha para entrar na sua conta.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-5">
              <div>
                <Label htmlFor="new-password">Nova senha</Label>
                <Input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2" required minLength={6} autoComplete="new-password" />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <Input id="confirm-password" type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} className="mt-2" required minLength={6} autoComplete="new-password" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={savingAccount}>{savingAccount ? "Salvando..." : "Salvar senha"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar conta permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove sua conta do Auth, seu perfil, seus documentos e suas preferências. Não será possível desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingAccount}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void deleteAccount();
              }}
              disabled={savingAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {savingAccount ? "Apagando..." : "Sim, apagar conta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
