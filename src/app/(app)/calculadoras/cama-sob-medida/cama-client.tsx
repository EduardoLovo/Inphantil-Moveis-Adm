"use client";

import * as React from "react";
import { BedDouble, Calculator, Ruler } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  CalcHeader,
  CentsField,
  CalcError,
  ResultPanel,
  ResultItem,
  ResultRow,
} from "@/components/calculadoras/calc-parts";
import {
  calcCamaSobMedida,
  formatMeasure,
  parseNum,
  type Acessorio,
  type MedidasCama,
} from "@/lib/calc";

const selectClass =
  "h-11 w-full cursor-pointer rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const dim = (a: number, b: number) => `${formatMeasure(a)} × ${formatMeasure(b)}`;

export function CamaSobMedidaClient() {
  const [largura, setLargura] = React.useState("");
  const [comprimento, setComprimento] = React.useState("");
  const [acessorio, setAcessorio] = React.useState<Acessorio>("");
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<MedidasCama | null>(null);

  function calcular(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const l = parseNum(largura);
    const c = parseNum(comprimento);

    if (isNaN(l) || isNaN(c) || l <= 0 || c <= 0) {
      setError("Digite medidas válidas e maiores que zero.");
      return;
    }

    setResult(calcCamaSobMedida(l, c, acessorio));
  }

  return (
    <div>
      <CalcHeader
        icon={BedDouble}
        title="Cama sob medida"
        description="Defina as medidas da cama montessoriana."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-fit p-6">
          <form onSubmit={calcular} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <CentsField
                label="Largura — cabeceira"
                suffix="m"
                value={largura}
                onChange={setLargura}
              />
              <CentsField
                label="Comprimento — lateral"
                suffix="m"
                value={comprimento}
                onChange={setComprimento}
              />
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">
                Calcular acessório (opcional)
              </Label>
              <select
                value={acessorio}
                onChange={(e) => setAcessorio(e.target.value as Acessorio)}
                className={selectClass}
              >
                <option value="">Nenhum</option>
                <option value="lençol">Lençol</option>
                <option value="virol">Virol</option>
              </select>
            </div>

            <CalcError message={error} />

            <Button type="submit" size="lg" className="w-full font-bold">
              <Calculator className="size-4" /> Calcular medidas
            </Button>
          </form>
        </Card>

        {result && (
          <ResultPanel title="Ficha técnica" icon={Ruler}>
            <ResultItem>
              <ResultRow
                label="Tamanho da cama"
                value={dim(result.larguraOriginal, result.comprimentoOriginal)}
              />
            </ResultItem>
            <ResultItem>
              <ResultRow
                label="Medida externa"
                value={dim(result.larguraExterno, result.comprimentoExterno)}
              />
            </ResultItem>
            <ResultItem>
              <ResultRow
                label="Medida interna"
                value={dim(result.larguraInterno, result.comprimentoInterno)}
              />
            </ResultItem>
            <ResultItem>
              <ResultRow
                label="Medida do colchão"
                value={dim(result.larguraColchao, result.comprimentoColchao)}
                tone="primary"
              />
            </ResultItem>

            {result.acessorio && (
              <ResultItem>
                <div className="space-y-2 border-t border-dashed pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Acessório — {result.acessorio}
                  </p>
                  {result.acessorio === "lençol" && (
                    <ResultRow
                      label="Corte do lençol"
                      value={dim(result.larguraLencol!, result.comprimentoLencol!)}
                      tone="primary"
                    />
                  )}
                  {result.acessorio === "virol" && (
                    <ResultRow
                      label="Corte do virol"
                      value={dim(result.larguraVirol!, result.comprimentoVirol!)}
                      tone="primary"
                    />
                  )}
                </div>
              </ResultItem>
            )}
          </ResultPanel>
        )}
      </div>
    </div>
  );
}
