"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PdfButton } from "@/components/orcamentos/pdf-button";
import { formatBRL } from "@/lib/calc";
import type { QuoteListRow } from "@/lib/quotes-server";
import { deleteQuote } from "../actions";

export function QuotesList({
  rows,
  isStaff,
}: {
  rows: QuoteListRow[];
  isStaff: boolean;
}) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Nenhum orçamento ainda. Crie o primeiro em “Novo orçamento”.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="px-0 sm:px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              {isStaff && <TableHead>Vendedor(a)</TableHead>}
              <TableHead>Itens</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-semibold">{q.number}</TableCell>
                <TableCell>{q.customerName}</TableCell>
                {isStaff && (
                  <TableCell className="text-muted-foreground">{q.sellerName}</TableCell>
                )}
                <TableCell className="text-muted-foreground">{q.itemsCount}</TableCell>
                <TableCell className="font-semibold tabular-nums">
                  {formatBRL(q.total)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(q.createdAt).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1.5">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/orcamentos/${q.id}`} aria-label="Ver">
                        <Eye className="size-4" />
                      </Link>
                    </Button>
                    <PdfButton quoteId={q.id} />
                    <DeleteButton id={q.id} number={q.number} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function DeleteButton({ id, number }: { id: number; number: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function confirmar() {
    setBusy(true);
    const res = await deleteQuote(id);
    setBusy(false);
    if (res.ok) {
      toast.success(`${number} excluído.`);
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Excluir {number}?</DialogTitle>
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
  );
}
