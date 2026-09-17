"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { UFS } from "@/lib/shipping";
import { createShippingQuote } from "../actions";

type FormValues = {
  quoteDetails: string;
  customerName: string;
  customerCpf: string;
  customerZipCode: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
};

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function NovaFreteForm() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const { register, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: {
      quoteDetails: "",
      customerName: "",
      customerCpf: "",
      customerZipCode: "",
      customerAddress: "",
      customerCity: "",
      customerState: "",
    },
  });

  async function onSubmit(v: FormValues) {
    setPending(true);
    const res = await createShippingQuote(v);
    setPending(false);
    if (res.ok) {
      toast.success(`Solicitação ${res.number} criada.`);
      router.push(`/frete/${res.id}`);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label>O que precisa cotar</Label>
            <Textarea
              {...register("quoteDetails")}
              placeholder="Ex.: Cama Casinha Solteiro + Colchão + Protetor de parede"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome do cliente</Label>
              <Input {...register("customerName")} />
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input {...register("customerCpf")} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-2">
              <Label>
                CEP <span className="text-destructive">*</span>
              </Label>
              <Input {...register("customerZipCode", { required: true })} placeholder="00000-000" />
              {formState.errors.customerZipCode && (
                <p className="text-xs text-destructive">Informe o CEP.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input {...register("customerAddress")} placeholder="Rua, número, bairro" />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input {...register("customerCity")} />
            </div>
            <div className="space-y-2">
              <Label>UF</Label>
              <select className={selectClass} {...register("customerState")}>
                <option value="">—</option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Enviar solicitação
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
