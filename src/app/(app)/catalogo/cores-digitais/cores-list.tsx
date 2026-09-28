"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Power, Trash2 } from "lucide-react";
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
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { cn } from "@/lib/utils";
import {
  FAMILIAS,
  familiaDoCodigo,
  type CorDigitalFull,
} from "@/lib/cores-composicao";
import {
  createCorDigital,
  deleteCorDigital,
  setCorDigitalAtiva,
  updateCorDigital,
} from "./actions";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function CoresList({ cores }: { cores: CorDigitalFull[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CorDigitalFull | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  // Cor mantida após fechar o modal, para o título não piscar na animação.
  const [excluindo, setExcluindo] = React.useState<CorDigitalFull | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  // Muda a cada "Nova" para recriar o formulário zerado.
  const [newNonce, setNewNonce] = React.useState(0);

  async function toggle(cor: CorDigitalFull) {
    setBusyId(cor.id);
    const res = await setCorDigitalAtiva(cor.id, !cor.ativa);
    setBusyId(null);
    if (res.ok) router.refresh();
    else toast.error(res.error);
  }

  async function remove(cor: CorDigitalFull) {
    setBusyId(cor.id);
    const res = await deleteCorDigital(cor.id);
    setBusyId(null);
    if (res.ok) {
      toast.success("Cor excluída.");
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setNewNonce((n) => n + 1);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" /> Nova cor
        </Button>
      </div>

      {cores.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma cor cadastrada ainda.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="px-0 sm:px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[64px]">Amostra</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Hex</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cores.map((cor) => (
                  <TableRow key={cor.id} className={cn(!cor.ativa && "opacity-60")}>
                    <TableCell>
                      <div
                        className="relative size-10 rounded-md border shadow-sm"
                        style={{ backgroundColor: cor.hex }}
                      >
                        {busyId === cor.id && (
                          <div className="absolute inset-0 grid place-items-center rounded-md bg-background/60">
                            <Loader2 className="size-4 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{cor.codigo}</TableCell>
                    <TableCell className="text-muted-foreground">{cor.cor}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {cor.hex}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cor.ativa ? "success" : "muted"}>
                        {cor.ativa ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(cor);
                            setDialogOpen(true);
                          }}
                          aria-label="Editar"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggle(cor)}
                          aria-label={cor.ativa ? "Desativar" : "Ativar"}
                        >
                          <Power className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setExcluindo(cor);
                            setConfirmOpen(true);
                          }}
                          aria-label="Excluir"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CorDialog
        key={editing ? editing.id : `new-${newNonce}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={() => {
          setDialogOpen(false);
          router.refresh();
        }}
      />

      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Excluir a cor ${excluindo?.codigo ?? ""}?`}
        description="Ela some das composições e do mostruário. Ação irreversível — para só esconder, use desativar."
        onConfirm={() => remove(excluindo!)}
      />
    </div>
  );
}

function CorDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: CorDigitalFull | null;
  onSaved: () => void;
}) {
  const isEdit = !!editing;
  const [codigo, setCodigo] = React.useState(editing?.codigo ?? "");
  const [cor, setCor] = React.useState(editing?.cor ?? "");
  // Enquanto o usuário não mexer no campo "Cor", ele segue o prefixo do código.
  const [corTocada, setCorTocada] = React.useState(isEdit);
  const [hex, setHex] = React.useState(editing?.hex ?? "#");
  const [ativa, setAtiva] = React.useState(editing?.ativa ?? true);
  const [pending, setPending] = React.useState(false);

  const hexValido = HEX_RE.test(hex);

  function alterarCodigo(v: string) {
    setCodigo(v);
    if (!corTocada) setCor(familiaDoCodigo(v) ?? "");
  }

  async function salvar() {
    const payload = { codigo, cor, hex, ativa };
    setPending(true);
    const res = isEdit
      ? await updateCorDigital({ id: editing!.id, ...payload })
      : await createCorDigital(payload);
    setPending(false);
    if (res.ok) {
      toast.success(isEdit ? "Cor salva." : "Cor criada.");
      onSaved();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar cor" : "Nova cor"}</DialogTitle>
          <DialogDescription>Cores digitais</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Prévia */}
          <div
            className="grid h-20 place-items-center rounded-xl border text-sm font-bold text-[#0c0c0c] shadow-sm"
            style={{ backgroundColor: hexValido ? hex : "transparent" }}
          >
            {hexValido ? codigo.toUpperCase() || "Prévia" : "Informe um hex válido"}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Código</Label>
              <Input
                value={codigo}
                placeholder="AM1"
                onChange={(e) => alterarCodigo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <Input
                value={cor}
                placeholder="Amarelo"
                list="familias-cor"
                onChange={(e) => {
                  setCorTocada(true);
                  setCor(e.target.value);
                }}
              />
              <datalist id="familias-cor">
                {FAMILIAS.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label>Hex</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  aria-label="Escolher cor"
                  value={hexValido ? hex.toLowerCase() : "#ffffff"}
                  onChange={(e) => setHex(e.target.value)}
                  className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1"
                />
                <Input
                  value={hex}
                  placeholder="#ffd653"
                  className="font-mono"
                  onChange={(e) => setHex(e.target.value.trim())}
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={ativa}
              onChange={(e) => setAtiva(e.target.checked)}
            />
            Ativa (aparece nas composições e no mostruário)
          </label>
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
