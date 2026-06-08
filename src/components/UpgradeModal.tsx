import { Lock, ScanText, Hand, Lightbulb, Volume2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  featureName: string;
  onClose: () => void;
  onSubscribe: () => void;
}

const benefits = [
  { icon: ScanText, label: "OCR de imagens e documentos" },
  { icon: Hand, label: "Reconhecimento de gestos por câmera" },
  { icon: Lightbulb, label: "Sugestão de novos sinais" },
  { icon: Volume2, label: "Narração por voz (TTS)" },
];

export function UpgradeModal({ open, featureName, onClose, onSubscribe }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-accent">
            <Lock className="h-5 w-5" />
          </div>
          <DialogTitle>Recurso exclusivo Premium</DialogTitle>
          <DialogDescription>
            {featureName
              ? `“${featureName}” faz parte do plano Premium do Lire.`
              : "Esta funcionalidade é exclusiva do plano Premium."}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">Plano Premium</p>
          <p className="font-display text-3xl font-extrabold text-accent">
            R$19,90<span className="text-base font-medium text-muted-foreground">/mês</span>
          </p>
          <ul className="mt-3 space-y-2">
            {benefits.map((b) => (
              <li key={b.label} className="flex items-center gap-2 text-sm text-foreground">
                <b.icon className="h-4 w-4 text-accent" />
                {b.label}
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose}>
            Agora não
          </Button>
          <Button onClick={onSubscribe}>Assinar agora</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
