import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ModuleId } from "@/lib/app-context";

interface Props {
  open: boolean;
  target: ModuleId | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ModuleSwitchModal({ open, target, onCancel, onConfirm }: Props) {
  const name = target === "jano" ? "Jano" : target === "minerva" ? "Minerva" : "";
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Trocar de módulo?</DialogTitle>
          <DialogDescription>
            Deseja trocar para o Módulo {name}? Suas configurações atuais serão mantidas, mas a
            interface será alterada.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>Confirmar troca</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
