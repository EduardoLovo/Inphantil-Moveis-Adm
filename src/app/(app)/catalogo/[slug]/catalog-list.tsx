"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageOff, Loader2, Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUploader } from "@/components/upload/image-uploader";
import { StaggerContainer, StaggerItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import {
  CATEGORY_META,
  PRONTA_KINDS,
  PRONTA_KIND_LABEL,
  type CategoryMeta,
  type CatalogItemFull,
  type Collection,
  type ProntaKind,
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
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="size-4" /> Novo {meta.singular}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Nenhum item nesta coleção ainda.
        </div>
      ) : (
        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <StaggerItem key={item.id}>
              <ItemCard
                item={item}
                meta={meta}
                busy={busyId === item.id}
                onEdit={() => { setEditing(item); setDialogOpen(true); }}
                onToggle={() => toggle(item)}
                onDelete={() => remove(item)}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      <ItemDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        collection={collection}
        meta={meta}
        onSaved={() => { setDialogOpen(false); router.refresh(); }}
      />
    </div>
  );
}

function ItemCard({
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
    <div className={cn("overflow-hidden rounded-xl border bg-card", !item.available && "opacity-70")}>
      <div className="relative aspect-square bg-muted">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.code} fill sizes="220px" className="object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">
            <ImageOff className="size-8" />
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-background/60">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        )}
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-bold">{item.code}</p>
          <Badge variant={item.available ? "success" : "muted"}>
            {item.available ? "Disponível" : "Indisponível"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{item.color}</p>
        <div className="flex flex-wrap gap-1.5">
          {meta.hasQuantity && item.quantity != null && (
            <Badge variant="secondary">Qtd: {item.quantity}</Badge>
          )}
          {meta.hasFazExterno && (
            <Badge variant="secondary">{item.fazExterno ? "Interno + Externo" : "Interno"}</Badge>
          )}
          {meta.hasCabana && item.cabana && <Badge variant="default">Cabana</Badge>}
          {meta.hasTapete && item.tapete && <Badge variant="default">Tapete</Badge>}
          {meta.hasProntaKind && item.prontaKind && (
            <Badge variant="secondary">{PRONTA_KIND_LABEL[item.prontaKind]}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1 pt-1">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Editar">
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggle} aria-label="Disponibilidade">
            <Power className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label="Excluir"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
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
  const [quantity, setQuantity] = React.useState(editing?.quantity != null ? String(editing.quantity) : "");
  const [fazExterno, setFazExterno] = React.useState(editing?.fazExterno ?? false);
  // Ao criar dentro de uma coleção filtrada, já marca a flag.
  const [cabana, setCabana] = React.useState(editing?.cabana ?? collection.flag === "cabana");
  const [tapete, setTapete] = React.useState(editing?.tapete ?? collection.flag === "tapete");
  const [prontaKind, setProntaKind] = React.useState<ProntaKind | "">(editing?.prontaKind ?? "");
  const [image, setImage] = React.useState<{ url: string; key: string } | null>(
    editing?.imageUrl && editing?.imageKey ? { url: editing.imageUrl, key: editing.imageKey } : null,
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
      quantity: meta.hasQuantity ? (quantity.trim() === "" ? null : parseInt(quantity, 10)) : null,
      fazExterno: meta.hasFazExterno ? fazExterno : false,
      cabana: meta.hasCabana ? cabana : false,
      tapete: meta.hasTapete ? tapete : false,
      prontaKind: meta.hasProntaKind ? (prontaKind || null) : null,
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
          <DialogTitle>{isEdit ? "Editar" : "Novo"} {meta.singular}</DialogTitle>
          <DialogDescription>{collection.label}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Imagem */}
          <div className="space-y-2">
            <Label>Imagem</Label>
            {image ? (
              <div className="relative w-full overflow-hidden rounded-xl border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="Prévia" className="max-h-56 w-full object-contain" />
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
              <ImageUploader onUploaded={(r) => setImage({ url: r.url, key: r.key })} />
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
                <Input inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
            )}

            {meta.hasProntaKind && (
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select className={selectClass} value={prontaKind} onChange={(e) => setProntaKind(e.target.value as ProntaKind | "")}>
                  <option value="">Selecione…</option>
                  {PRONTA_KINDS.map((k) => (
                    <option key={k} value={k}>{PRONTA_KIND_LABEL[k]}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {meta.hasFazExterno && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={fazExterno} onChange={(e) => setFazExterno(e.target.checked)} />
                Também faz <strong>externo</strong> (interno todos fazem)
              </label>
            )}
            {meta.hasTapete && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={tapete} onChange={(e) => setTapete(e.target.checked)} />
                Aparece também no catálogo de <strong>Tapetes</strong>
              </label>
            )}
            {meta.hasCabana && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={cabana} onChange={(e) => setCabana(e.target.checked)} />
                Aparece também em <strong>Apliques para cabana</strong>
              </label>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
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
