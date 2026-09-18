"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ImageOff,
  Loader2,
  Pencil,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUploader } from "@/components/upload/image-uploader";
import { cn } from "@/lib/utils";
import {
  CATEGORY_META,
  PRONTA_KINDS,
  PRONTA_KIND_LABEL,
  PRONTA_TAMANHOS,
  PRONTA_TAMANHO_LABEL,
  type CategoryMeta,
  type CatalogItemFull,
  type Collection,
  type ProntaKind,
  type ProntaTamanho,
} from "@/lib/catalog";
import {
  createCatalogItem,
  deleteCatalogItem,
  setCatalogItemAvailable,
  updateCatalogItem,
} from "../actions";

const selectClass =
  "h-10 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function CatalogList({
  items,
  collection,
}: {
  items: CatalogItemFull[];
  collection: Collection;
}) {
  const router = useRouter();
  const meta = CATEGORY_META[collection.category];
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CatalogItemFull | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function toggle(item: CatalogItemFull) {
    setBusyId(item.id);
    const res = await setCatalogItemAvailable(item.id, !item.available);
    setBusyId(null);
    if (res.ok) router.refresh();
    else toast.error(res.error);
  }

  async function remove(item: CatalogItemFull) {
    setBusyId(item.id);
    const res = await deleteCatalogItem(item.id);
    setBusyId(null);
    if (res.ok) {
      toast.success("Item excluído.");
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" /> Novo {meta.singular}
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum item nesta coleção ainda.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="px-0 sm:px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[64px]">Imagem</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Características</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    meta={meta}
                    busy={busyId === item.id}
                    onEdit={() => {
                      setEditing(item);
                      setDialogOpen(true);
                    }}
                    onToggle={() => toggle(item)}
                    onDelete={() => remove(item)}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ItemDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        collection={collection}
        meta={meta}
        onSaved={() => {
          setDialogOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}

function ItemRow({
  item,
  meta,
  busy,
  onEdit,
  onToggle,
  onDelete,
}: {
  item: CatalogItemFull;
  meta: CategoryMeta;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow className={cn(!item.available && "opacity-60")}>
      <TableCell>
        <div className="relative size-12 overflow-hidden rounded-md border bg-muted">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.code}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-muted-foreground">
              <ImageOff className="size-4" />
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 grid place-items-center bg-background/60">
              <Loader2 className="size-4 animate-spin text-primary" />
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="font-semibold">{item.code}</TableCell>
      <TableCell className="text-muted-foreground">{item.color}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1.5">
          {meta.hasQuantity && item.quantity != null && (
            <Badge variant="secondary">Qtd: {item.quantity}</Badge>
          )}
          {meta.hasFazExterno && (
            <Badge variant="secondary">
              {item.fazExterno ? "Interno + Externo" : "Interno"}
            </Badge>
          )}
          {meta.hasCabana && item.cabana && (
            <Badge variant="default">Cabana</Badge>
          )}
          {meta.hasApenasTapete && item.apenasTapete && (
            <Badge variant="default">Apenas Tapete</Badge>
          )}
          {meta.hasProntaKind && item.prontaKind && (
            <Badge variant="secondary">
              {PRONTA_KIND_LABEL[item.prontaKind]}
            </Badge>
          )}
          {meta.hasTamanho && item.tamanho && (
            <Badge variant="default">{PRONTA_TAMANHO_LABEL[item.tamanho]}</Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={item.available ? "success" : "muted"}>
          {item.available ? "Disponível" : "Indisponível"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label="Editar"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            aria-label="Disponibilidade"
          >
            <Power className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label="Excluir"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function ItemDialog({
  open,
  onOpenChange,
  editing,
  collection,
  meta,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: CatalogItemFull | null;
  collection: Collection;
  meta: CategoryMeta;
  onSaved: () => void;
}) {
  const isEdit = !!editing;
  const [code, setCode] = React.useState(editing?.code ?? "");
  const [color, setColor] = React.useState(editing?.color ?? "");
  const [available, setAvailable] = React.useState(editing?.available ?? true);
  const [quantity, setQuantity] = React.useState(
    editing?.quantity != null ? String(editing.quantity) : "",
  );
  const [fazExterno, setFazExterno] = React.useState(
    editing?.fazExterno ?? false,
  );
  // Ao criar dentro de uma coleção filtrada, já marca a flag.
  const [cabana, setCabana] = React.useState(
    editing?.cabana ?? collection.filter?.cabana === true,
  );
  const [apenasTapete, setApenasTapete] = React.useState(
    editing?.apenasTapete ?? false,
  );
  const [prontaKind, setProntaKind] = React.useState<ProntaKind | "">(
    editing?.prontaKind ?? "",
  );
  const [tamanho, setTamanho] = React.useState<ProntaTamanho | "">(
    editing?.tamanho ?? "",
  );
  const [image, setImage] = React.useState<{ url: string; key: string } | null>(
    editing?.imageUrl && editing?.imageKey
      ? { url: editing.imageUrl, key: editing.imageKey }
      : null,
  );
  const [pending, setPending] = React.useState(false);

  async function salvar() {
    const payload = {
      category: collection.category,
      code,
      color,
      available,
      imageUrl: image?.url ?? null,
      imageKey: image?.key ?? null,
      quantity: meta.hasQuantity
        ? quantity.trim() === ""
          ? null
          : parseInt(quantity, 10)
        : null,
      fazExterno: meta.hasFazExterno ? fazExterno : false,
      cabana: meta.hasCabana ? cabana : false,
      apenasTapete: meta.hasApenasTapete ? apenasTapete : false,
      prontaKind: meta.hasProntaKind ? prontaKind || null : null,
      tamanho: meta.hasTamanho ? tamanho || null : null,
    };
    setPending(true);
    const res = isEdit
      ? await updateCatalogItem({ id: editing!.id, ...payload })
      : await createCatalogItem(payload);
    setPending(false);
    if (res.ok) {
      toast.success(isEdit ? "Item salvo." : "Item criado.");
      onSaved();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar" : "Novo"} {meta.singular}
          </DialogTitle>
          <DialogDescription>{collection.label}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Imagem */}
          <div className="space-y-2">
            <Label>Imagem</Label>
            {image ? (
              <div className="relative w-full overflow-hidden rounded-xl border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt="Prévia"
                  className="max-h-56 w-full object-contain"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => setImage(null)}
                >
                  <X className="size-4" /> Trocar
                </Button>
              </div>
            ) : (
              <ImageUploader
                onUploaded={(r) => setImage({ url: r.url, key: r.key })}
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Código</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <Input value={color} onChange={(e) => setColor(e.target.value)} />
            </div>

            {meta.hasQuantity && (
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  inputMode="numeric"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            )}

            {meta.hasProntaKind && (
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select
                  className={selectClass}
                  value={prontaKind}
                  onChange={(e) =>
                    setProntaKind(e.target.value as ProntaKind | "")
                  }
                >
                  <option value="">Selecione…</option>
                  {PRONTA_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {PRONTA_KIND_LABEL[k]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {meta.hasTamanho && (
              <div className="space-y-2">
                <Label>Tamanho</Label>
                <select
                  className={selectClass}
                  value={tamanho}
                  onChange={(e) =>
                    setTamanho(e.target.value as ProntaTamanho | "")
                  }
                >
                  <option value="">Selecione…</option>
                  {PRONTA_TAMANHOS.map((t) => (
                    <option key={t} value={t}>
                      {PRONTA_TAMANHO_LABEL[t]}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {meta.hasFazExterno && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={fazExterno}
                  onChange={(e) => setFazExterno(e.target.checked)}
                />
                Também faz <strong>externo</strong> (interno todos fazem)
              </label>
            )}
            {meta.hasApenasTapete && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={apenasTapete}
                  onChange={(e) => setApenasTapete(e.target.checked)}
                />
                <strong>Apenas Tapete</strong> (some do mostruário de cama)
              </label>
            )}
            {meta.hasCabana && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={cabana}
                  onChange={(e) => setCabana(e.target.checked)}
                />
                Aparece também em <strong>Apliques para cabana</strong>
              </label>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
              />
              Disponível
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={salvar} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
