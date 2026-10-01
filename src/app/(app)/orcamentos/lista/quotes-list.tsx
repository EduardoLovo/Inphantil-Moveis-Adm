"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";
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
import { fuzzyFilter } from "@/lib/search";
import { SearchInput } from "@/components/ui/search-input";
import type { QuoteListRow } from "@/lib/quotes-server";
import { deleteQuote } from "../actions";

export function QuotesList({
  rows,
  isStaff,
}: {
  rows: QuoteListRow[];
  isStaff: boolean;
}) {
  const [query, setQuery] = React.useState("");

  // As linhas já chegam filtradas por perfil (vendedora só recebe as dela);
  // a busca só refina o que ela já pode ver.
  const filtered = React.useMemo(
    () =>
      fuzzyFilter(rows, query, (q) =>
        [
          q.number,
          q.customerName,
          isStaff ? q.sellerName : "",
          new Date(q.createdAt).toLocaleDateString("pt-BR"),
          formatBRL(q.total),
        ].join(" "),
      ),
    [rows, query, isStaff],
  );

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
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={
            isStaff
              ? "Buscar por número, cliente, vendedora, data ou valor…"
              : "Buscar por número, cliente, data ou valor…"
          }
          label="Buscar orçamentos"
          count={filtered.length}
          total={rows.length}
          className="px-4 pb-2 pt-6 sm:px-0"
        />

        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhum orçamento encontrado para “{query}”.
          </p>
        ) : (
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
              {filtered.map((q) => (
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
                    <div className="flex items-center justify-end gap-0.5">
                      <PdfButton quoteId={q.id} iconOnly />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 text-muted-foreground"
                        asChild
                      >
                        <Link href={`/orcamentos/${q.id}`} aria-label="Editar" title="Editar">
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      {isStaff && <DeleteButton id={q.id} number={q.number} />}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
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
        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label="Excluir"
          title="Excluir"
        >
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
