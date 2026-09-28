"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Modal de confirmação de exclusão. Fica aberto enquanto `onConfirm` roda
 * e fecha sozinho quando ele termina.
 */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description = "Ação irreversível.",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = React.useState(false);

  async function confirmar() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirmar} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
