"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { HandCoins, Calculator, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CalcHeader,
  CentsField,
  CalcError,
  ResultPanel,
  ResultItem,
  ResultRow,
} from "@/components/calculadoras/calc-parts";
import {
  calc6040,
  formatBRL,
  parseNum,
  type Pagamento6040,
} from "@/lib/calc";

export function Pagamento6040Client() {
  const [valorEntrada, setValorEntrada] = React.useState("");
  const [valorTotal, setValorTotal] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<Pagamento6040 | null>(null);

  function calcular(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const ve = parseNum(valorEntrada);
    const vt = parseNum(valorTotal);

    if (isNaN(ve) || isNaN(vt) || ve <= 0 || vt <= 0) {
      setError("Digite valores válidos e maiores que zero.");
      return;
    }
    if (ve >= vt) {
      setError("O valor da entrada deve ser menor que o valor total.");
      return;
    }

    setResult(calc6040(ve, vt));
  }

  return (
    <div>
      <CalcHeader
        icon={HandCoins}
        title="Calculadora 60/40"
        description="Simule o saldo restante após a entrada, com dedução de 6%."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-fit p-6">
          <form onSubmit={calcular} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <CentsField
                label="Valor da entrada"
                prefix="R$"
                value={valorEntrada}
                onChange={setValorEntrada}
              />
              <CentsField
                label="Valor total (sem frete)"
                prefix="R$"
                value={valorTotal}
                onChange={setValorTotal}
              />
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
              <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-foreground" />
              <p className="text-xs font-medium leading-relaxed text-foreground">
                A dedução de <strong>6%</strong> é aplicada sobre o{" "}
                <strong>valor da entrada</strong>. O restante corresponde ao
                saldo a parcelar ou pagar na entrega.
              </p>
            </div>

            <CalcError message={error} />

            <Button type="submit" size="lg" className="w-full font-bold">
              <Calculator className="size-4" /> Simular pagamento
            </Button>
          </form>
        </Card>

        {result && (
          <ResultPanel title="Resultado da simulação" icon={ArrowRight}>
            <ResultItem>
              <ResultRow
                label="Valor total (100%)"
                value={formatBRL(result.valorTotal)}
              />
            </ResultItem>
            <ResultItem>
              <ResultRow
                label="Valor da entrada (pago)"
                value={formatBRL(result.valorEntrada)}
              />
            </ResultItem>
            <ResultItem>
              <ResultRow
                label="Dedução da entrada (6%)"
                value={`− ${formatBRL(result.descontoEntrada)}`}
              />
            </ResultItem>
            <ResultItem>
              <motion.div className="mt-2 flex items-center justify-between rounded-xl bg-primary px-5 py-4 text-primary-foreground">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">
                    Resta a pagar
                  </p>
                  <p className="mt-0.5 text-[11px] opacity-70">
                    Parcelado ou pago na entrega
                  </p>
                </div>
                <strong className="text-2xl font-black tabular-nums">
                  {formatBRL(result.valorAPrazo)}
                </strong>
              </motion.div>
            </ResultItem>
          </ResultPanel>
        )}
      </div>
    </div>
  );
}
