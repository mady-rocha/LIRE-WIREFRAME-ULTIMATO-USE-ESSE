import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Esqueci minha senha — Lire" },
      { name: "description", content: "Recupere o acesso à sua conta Lire." },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={48} />
          <h1 className="mt-4 font-display text-2xl font-bold">Esqueci minha senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Informe seu e-mail para receber as instruções de recuperação.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-xl border bg-card p-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-accent" />
            <h2 className="mt-4 font-display text-lg font-bold">Verifique seu e-mail</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Se existir uma conta com esse endereço, enviaremos um link para criar uma nova senha.
            </p>
            <Button className="mt-6 w-full" onClick={() => navigate({ to: "/auth", search: { mode: "login" } })}>
              Voltar para entrar
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="recovery-email">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="recovery-email" name="email" type="email" autoComplete="email" placeholder="voce@email.com" className="pl-9" required />
              </div>
            </div>
            <Button type="submit" className="h-11 w-full text-base">
              Enviar instruções
              <KeyRound className="h-4 w-4" />
            </Button>
          </form>
        )}

        {!submitted && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/auth" search={{ mode: "login" }} className="inline-flex items-center gap-2 font-semibold text-accent hover:underline">
              <ArrowLeft className="h-4 w-4" /> Voltar para entrar
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}