"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Calculator, Loader2, Package, Truck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL, parseNum } from "@/lib/calc";
import type { ShippingOption } from "@/lib/shipping";
import { calcularFreteCorreios } from "./actions";

export function CorreiosCalculator() {
  const [cep, setCep] = React.useState("");
  const [peso, setPeso] = React.useState("1");
  const [c, setC] = React.useState("40");
  const [l, setL] = React.useState("30");
  const [a, setA] = React.useState("20");
  const [pending, setPending] = React.useState(false);
  const [options, setOptions] = React.useState<ShippingOption[] | null>(null);

  async function calcular(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setOptions(null);
    const res = await calcularFreteCorreios({
      cep,
      weightKg: parseNum(peso),
      comprimento: parseNum(c),
      largura: parseNum(l),
      altura: parseNum(a),
    });
    setPending(false);
    if (res.ok) setOptions(res.options);
    else toast.error(res.error);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="h-fit">
        <CardContent className="p-6">
          <form onSubmit={calcular} className="space-y-4">
            <div className="space-y-2">
              <Label>CEP de destino</Label>
              <Input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" inputMode="numeric" />
            </div>
            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              <Input value={peso} onChange={(e) => setPeso(e.target.value)} inputMode="decimal" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Compr. (cm)</Label>
                <Input value={c} onChange={(e) => setC(e.target.value)} inputMode="numeric" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Larg. (cm)</Label>
                <Input value={l} onChange={(e) => setL(e.target.value)} inputMode="numeric" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Alt. (cm)</Label>
                <Input value={a} onChange={(e) => setA(e.target.value)} inputMode="numeric" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Calculator className="size-4" />}
              Calcular frete
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Origem e credenciais configuradas no servidor (Correios).
            </p>
          </form>
        </CardContent>
      </Card>

      <div>
        {!options ? (
          <div className="grid h-full min-h-40 place-items-center rounded-xl border border-dashed text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Package className="size-4" /> Informe os dados e calcule.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {options.map((o, i) => (
              <motion.div
                key={o.code}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
              >
                <Card className={o.error ? "opacity-70" : undefined}>
                  <CardContent className="flex items-center justify-between gap-4 p-5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary">
                        <Truck className="size-5" />
                      </span>
                      <div>
                        <p className="font-bold">{o.name}</p>
                        {o.error ? (
                          <p className="text-xs text-destructive">{o.error}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Entrega em {o.deadline} dia(s) útil(eis)
                          </p>
                        )}
                      </div>
                    </div>
                    {!o.error && (
                      <span className="text-xl font-black tabular-nums">{formatBRL(o.price)}</span>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
