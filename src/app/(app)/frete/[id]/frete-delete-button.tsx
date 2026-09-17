"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteShippingQuote } from "../actions";

export function FreteDeleteButton({ id, number }: { id: number; number: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function confirmar() {
    setBusy(true);
    const res = await deleteShippingQuote(id);
    setBusy(false);
    if (res.ok) {
      toast.success(`${number} excluído.`);
      router.push("/frete/lista");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-destructive hover:text-destructive">
          <Trash2 className="size-4" /> Excluir
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Excluir {number}?</DialogTitle>
          <DialogDescription>Ação irreversível.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancelar</Button>
          <Button variant="destructive" onClick={confirmar} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
