"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseNum } from "@/lib/calc";
import { UFS, type ShippingQuoteFull } from "@/lib/shipping";
import { updateShippingQuote } from "../actions";

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type FormValues = {
  quoteDetails: string;
  customerName: string;
  customerCpf: string;
  customerZipCode: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  carrierName: string;
  volumeQuantity: string;
  weight: string;
  shippingValue: string;
  orderValue: string;
  deliveryDeadline: string;
  hasWallProtector: boolean;
  wallProtectorSize: string;
  hasRug: boolean;
  rugSize: string;
  hasAccessories: boolean;
  accessoryQuantity: string;
  bedSize: string;
  adminNotes: string;
  isRequested: boolean;
  isConcluded: boolean;
};

const str = (v: string | null) => v ?? "";
const numStr = (v: number | null) => (v != null ? String(v).replace(".", ",") : "");

export function CotacaoForm({ quote }: { quote: ShippingQuoteFull }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      quoteDetails: str(quote.quoteDetails),
      customerName: str(quote.customerName),
      customerCpf: str(quote.customerCpf),
      customerZipCode: str(quote.customerZipCode),
      customerAddress: str(quote.customerAddress),
      customerCity: str(quote.customerCity),
      customerState: str(quote.customerState),
      carrierName: str(quote.carrierName),
      volumeQuantity: quote.volumeQuantity != null ? String(quote.volumeQuantity) : "",
      weight: str(quote.weight),
      shippingValue: numStr(quote.shippingValue),
      orderValue: numStr(quote.orderValue),
      deliveryDeadline: str(quote.deliveryDeadline),
      hasWallProtector: quote.hasWallProtector,
      wallProtectorSize: str(quote.wallProtectorSize),
      hasRug: quote.hasRug,
      rugSize: str(quote.rugSize),
      hasAccessories: quote.hasAccessories,
      accessoryQuantity: quote.accessoryQuantity != null ? String(quote.accessoryQuantity) : "",
      bedSize: str(quote.bedSize),
      adminNotes: str(quote.adminNotes),
      isRequested: quote.isRequested,
      isConcluded: quote.isConcluded,
    },
  });

  async function onSubmit(v: FormValues) {
    setPending(true);
    const res = await updateShippingQuote({
      id: quote.id,
      quoteDetails: v.quoteDetails,
      customerName: v.customerName,
      customerCpf: v.customerCpf,
      customerZipCode: v.customerZipCode,
      customerAddress: v.customerAddress,
      customerCity: v.customerCity,
      customerState: v.customerState,
      carrierName: v.carrierName,
      volumeQuantity: v.volumeQuantity.trim() === "" ? null : Math.trunc(parseNum(v.volumeQuantity)),
      weight: v.weight,
      shippingValue: v.shippingValue.trim() === "" ? null : parseNum(v.shippingValue),
      orderValue: v.orderValue.trim() === "" ? null : parseNum(v.orderValue),
      deliveryDeadline: v.deliveryDeadline,
      hasWallProtector: v.hasWallProtector,
      wallProtectorSize: v.wallProtectorSize,
      hasRug: v.hasRug,
      rugSize: v.rugSize,
      hasAccessories: v.hasAccessories,
      accessoryQuantity: v.accessoryQuantity.trim() === "" ? null : Math.trunc(parseNum(v.accessoryQuantity)),
      bedSize: v.bedSize,
      adminNotes: v.adminNotes,
      isRequested: v.isRequested,
      isConcluded: v.isConcluded,
    });
    setPending(false);
    if (res.ok) {
      toast.success("Cotação salva.");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Solicitação</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <F label="O que cotar" full><Textarea {...register("quoteDetails")} /></F>
          <F label="Cliente"><Input {...register("customerName")} /></F>
          <F label="CPF"><Input {...register("customerCpf")} /></F>
          <F label="CEP"><Input {...register("customerZipCode")} /></F>
          <F label="Endereço"><Input {...register("customerAddress")} /></F>
          <F label="Cidade"><Input {...register("customerCity")} /></F>
          <F label="UF">
            <select className={selectClass} {...register("customerState")}>
              <option value="">—</option>
              {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </F>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cotação</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <F label="Transportadora"><Input {...register("carrierName")} /></F>
          <F label="Prazo de entrega"><Input {...register("deliveryDeadline")} placeholder="ex.: 5 a 8 dias úteis" /></F>
          <F label="Valor do frete (R$)"><Input inputMode="decimal" {...register("shippingValue")} placeholder="0,00" /></F>
          <F label="Valor do pedido (R$)"><Input inputMode="decimal" {...register("orderValue")} placeholder="0,00" /></F>
          <F label="Volumes"><Input inputMode="numeric" {...register("volumeQuantity")} /></F>
          <F label="Peso"><Input {...register("weight")} placeholder="ex.: 12 kg" /></F>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Conteúdo do pacote</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("hasWallProtector")} /> Protetor de parede
          </label>
          <F label="Tamanho do protetor"><Input {...register("wallProtectorSize")} /></F>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("hasRug")} /> Tapete
          </label>
          <F label="Tamanho do tapete"><Input {...register("rugSize")} /></F>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("hasAccessories")} /> Acessórios
          </label>
          <F label="Qtd. de acessórios"><Input inputMode="numeric" {...register("accessoryQuantity")} /></F>
          <F label="Tamanho da cama"><Input {...register("bedSize")} /></F>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Observações e status</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <F label="Observações internas" full><Textarea {...register("adminNotes")} /></F>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("isRequested")} /> Frete solicitado à transportadora
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("isConcluded")} /> Concluído
          </label>
        </CardContent>
      </Card>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Salvar cotação
      </Button>
    </form>
  );
}

function F({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
