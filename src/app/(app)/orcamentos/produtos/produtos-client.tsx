"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Loader2, MoreHorizontal, Pencil, Plus, Power } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { MEASURE_LABEL, MEASURE_TYPES, type MeasureType } from "@/lib/quote";
import { formatBRL, parseNum } from "@/lib/calc";
import {
  createQuoteProduct,
  setQuoteProductActive,
  updateQuoteProduct,
} from "./actions";

export type ProductRow = {
  id: number;
  name: string;
  sku: string | null;
  price: number | null;
  isPriceEditable: boolean;
  measureType: MeasureType;
  dimensions: string | null;
  isActive: boolean;
};

const selectClass =
  "h-10 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ProdutosClient({ products }: { products: ProductRow[] }) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ProductRow | null>(null);
  const [busyId, setBusyId] = React.useState<number | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(p: ProductRow) {
    setEditing(p);
    setDialogOpen(true);
  }

  async function toggleActive(p: ProductRow) {
    setBusyId(p.id);
    const res = await setQuoteProductActive(p.id, !p.isActive);
    setBusyId(null);
    if (res.ok) toast.success(p.isActive ? "Produto desativado." : "Produto ativado.");
    else toast.error(res.error);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Produtos de orçamento ({products.length})</CardTitle>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" /> Novo produto
        </Button>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        {products.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            Nenhum produto cadastrado. Crie o primeiro para montar orçamentos.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Medida</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.name}
                    {p.dimensions && (
                      <span className="block text-xs font-normal text-muted-foreground">
                        {p.dimensions}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.sku ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {MEASURE_LABEL[p.measureType]}
                  </TableCell>
                  <TableCell>
                    {p.isPriceEditable ? (
                      <Badge variant="secondary">Editável</Badge>
                    ) : (
                      <span className="font-semibold tabular-nums">
                        {p.price != null ? formatBRL(p.price) : "—"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? "success" : "muted"}>
                      {p.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={busyId === p.id}>
                          {busyId === p.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="size-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(p)}>
                          <Pencil className="size-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleActive(p)}
                          className={cn(p.isActive && "text-destructive focus:text-destructive")}
                        >
                          <Power className="size-4" /> {p.isActive ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ProductDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />
    </Card>
  );
}

type FormValues = {
  name: string;
  sku: string;
  measureType: MeasureType;
  isPriceEditable: boolean;
  price: string;
  dimensions: string;
  isActive: boolean;
};

function ProductDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: ProductRow | null;
}) {
  const isEdit = !!editing;
  const [pending, setPending] = React.useState(false);

  const [editable, setEditable] = React.useState(
    editing?.isPriceEditable ?? false,
  );
  const { register, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: {
      name: editing?.name ?? "",
      sku: editing?.sku ?? "",
      measureType: editing?.measureType ?? "UNIDADE",
      isPriceEditable: editing?.isPriceEditable ?? false,
      price: editing?.price != null ? String(editing.price).replace(".", ",") : "",
      dimensions: editing?.dimensions ?? "",
      isActive: editing?.isActive ?? true,
    },
  });

  async function onSubmit(v: FormValues) {
    const payload = {
      name: v.name,
      sku: v.sku,
      measureType: v.measureType,
      isPriceEditable: v.isPriceEditable,
      price: v.isPriceEditable || v.price.trim() === "" ? null : parseNum(v.price),
      dimensions: v.dimensions,
      isActive: v.isActive,
    };

    setPending(true);
    const res = isEdit
      ? await updateQuoteProduct({ id: editing!.id, ...payload })
      : await createQuoteProduct(payload);
    setPending(false);

    if (res.ok) {
      toast.success(isEdit ? "Produto salvo." : "Produto criado.");
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>
            Produtos usados para montar orçamentos (catálogo próprio).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input {...register("name", { required: true })} />
            {formState.errors.name && (
              <p className="text-xs text-destructive">Informe o nome.</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>SKU (opcional)</Label>
              <Input {...register("sku")} placeholder="ex.: PROT-001" />
            </div>
            <div className="space-y-2">
              <Label>Tipo de medida</Label>
              <select className={selectClass} {...register("measureType")}>
                {MEASURE_TYPES.map((m) => (
                  <option key={m} value={m}>
                    {MEASURE_LABEL[m]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...register("isPriceEditable", {
                onChange: (e) => setEditable(e.target.checked),
              })}
            />
            Valor editável (a vendedora digita o preço no orçamento)
          </label>

          {!editable && (
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input {...register("price")} placeholder="0,00" inputMode="decimal" />
            </div>
          )}

          <div className="space-y-2">
            <Label>Medidas da cama (opcional)</Label>
            <Input {...register("dimensions")} placeholder='ex.: 1,88 x 0,88 m' />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("isActive")} />
            Produto ativo
          </label>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
