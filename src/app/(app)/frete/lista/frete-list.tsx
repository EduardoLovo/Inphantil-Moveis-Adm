"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, FileSpreadsheet, Loader2, RotateCcw, Search, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { formatBRL } from "@/lib/calc";
import { UFS, type ShippingStatus } from "@/lib/shipping";
import type { ShippingListRow } from "@/lib/shipping-server";
import { deleteShippingQuote, setShippingConcluded } from "../actions";

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Filters = { carrier: string; city: string; state: string; status: ShippingStatus };

export function FreteList({
  rows,
  isStaff,
  initialFilters,
}: {
  rows: ShippingListRow[];
  isStaff: boolean;
  initialFilters: Filters;
}) {
  const router = useRouter();
  const [f, setF] = React.useState<Filters>(initialFilters);

  function aplicar() {
    const qs = new URLSearchParams();
    if (f.carrier) qs.set("carrier", f.carrier);
    if (f.city) qs.set("city", f.city);
    if (f.state) qs.set("state", f.state);
    if (f.status && f.status !== "todos") qs.set("status", f.status);
    router.push(`/frete/lista${qs.toString() ? `?${qs}` : ""}`);
  }
  function limpar() {
    setF({ carrier: "", city: "", state: "", status: "todos" });
    router.push("/frete/lista");
  }

  const exportHref = (() => {
    const qs = new URLSearchParams();
    if (f.carrier) qs.set("carrier", f.carrier);
    if (f.city) qs.set("city", f.city);
    if (f.state) qs.set("state", f.state);
    if (f.status && f.status !== "todos") qs.set("status", f.status);
    return `/api/frete/export${qs.toString() ? `?${qs}` : ""}`;
  })();

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label className="text-xs">Transportadora</Label>
            <Input value={f.carrier} onChange={(e) => setF({ ...f, carrier: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cidade</Label>
            <Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">UF</Label>
            <select className={selectClass} value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })}>
              <option value="">Todas</option>
              {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <select
              className={selectClass}
              value={f.status}
              onChange={(e) => setF({ ...f, status: e.target.value as ShippingStatus })}
            >
              <option value="todos">Todos</option>
              <option value="abertos">Abertos</option>
              <option value="concluidos">Concluídos</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={aplicar} className="flex-1">
              <Search className="size-4" /> Filtrar
            </Button>
            <Button variant="ghost" size="icon" onClick={limpar} aria-label="Limpar">
              <RotateCcw className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rows.length} solicitação(ões)</p>
        {isStaff && (
          <Button variant="outline" size="sm" asChild>
            <a href={exportHref}>
              <FileSpreadsheet className="size-4" /> Exportar Excel
            </a>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="px-0 sm:px-6">
          {rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma solicitação encontrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Transportadora</TableHead>
                  <TableHead>Frete</TableHead>
                  {isStaff && <TableHead>Solicitante</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-semibold">{r.number}</TableCell>
                    <TableCell>{r.customerName ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {[r.customerCity, r.customerState].filter(Boolean).join(" / ") || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.carrierName ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">
                      {r.shippingValue != null ? formatBRL(r.shippingValue) : "—"}
                    </TableCell>
                    {isStaff && (
                      <TableCell className="text-muted-foreground">{r.createdByName}</TableCell>
                    )}
                    <TableCell>
                      <Badge variant={r.isConcluded ? "success" : "muted"}>
                        {r.isConcluded ? "Concluído" : "Aberto"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/frete/${r.id}`} aria-label="Ver">
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                        {isStaff && <ConcluirButton id={r.id} concluded={r.isConcluded} />}
                        <DeleteButton id={r.id} number={r.number} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ConcluirButton({ id, concluded }: { id: number; concluded: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  async function toggle() {
    setBusy(true);
    const res = await setShippingConcluded(id, !concluded);
    setBusy(false);
    if (res.ok) {
      toast.success(concluded ? "Reaberto." : "Concluído.");
      router.refresh();
    } else toast.error(res.error);
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      disabled={busy}
      aria-label={concluded ? "Reabrir" : "Concluir"}
      title={concluded ? "Reabrir" : "Concluir"}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : concluded ? (
        <Undo2 className="size-4" />
      ) : (
        <Check className="size-4 text-[color:var(--success)]" />
      )}
    </Button>
  );
}

function DeleteButton({ id, number }: { id: number; number: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  async function confirmar() {
    setBusy(true);
    const res = await deleteShippingQuote(id);
    setBusy(false);
    if (res.ok) {
      toast.success(`${number} excluído.`);
      setOpen(false);
      router.refresh();
    } else toast.error(res.error);
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
