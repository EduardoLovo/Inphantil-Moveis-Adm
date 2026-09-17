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
import { PdfButton } from "@/components/orcamentos/pdf-button";
import type { QuoteFull } from "@/lib/quote";
import { deleteQuote } from "../actions";

export function QuoteActions({ quote }: { quote: QuoteFull }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function confirmar() {
    setBusy(true);
    const res = await deleteQuote(quote.id);
    setBusy(false);
    if (res.ok) {
      toast.success(`${quote.number} excluído.`);
      router.push("/orcamentos/lista");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <PdfButton quote={quote} label="Gerar PDF" variant="default" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="text-destructive hover:text-destructive">
            <Trash2 className="size-4" /> Excluir
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir {quote.number}?</DialogTitle>
            <DialogDescription>Ação irreversível.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmar} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
