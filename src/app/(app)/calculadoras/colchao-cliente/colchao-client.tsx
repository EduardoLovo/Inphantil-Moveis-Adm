"use client";

import * as React from "react";
import { Ruler, Calculator, BedDouble } from "lucide-react";

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
  calcColchao,
  formatMeasure,
  parseNum,
  type Acessorio,
  type MedidasColchao,
} from "@/lib/calc";

const selectClass =
  "h-11 w-full cursor-pointer rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const m = formatMeasure;
const dim2 = (a: number, b: number) => `${m(a)} × ${m(b)}`;
const dim3 = (a: number, b: number, c: number) => `${m(a)} × ${m(b)} × ${m(c)}`;

export function ColchaoClienteClient() {
  const [largura, setLargura] = React.useState("");
  const [comprimento, setComprimento] = React.useState("");
  const [altura, setAltura] = React.useState("");
  const [acessorio, setAcessorio] = React.useState<Acessorio>("");
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<MedidasColchao | null>(null);

  function calcular(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const l = parseNum(largura);
    const c = parseNum(comprimento);
    const a = parseNum(altura);

    if (isNaN(l) || isNaN(c) || isNaN(a) || l <= 0 || c <= 0 || a <= 0) {
      setError("Digite medidas válidas (largura, comprimento e altura do colchão).");
      return;
    }

    setResult(calcColchao(l, c, a, acessorio));
  }

  return (
    <div>
      <CalcHeader
        icon={Ruler}
        title="Colchão do cliente"
        description="Defina as medidas da cama a partir do colchão existente."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-fit p-6">
          <form onSubmit={calcular} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <CentsField
                label="Largura do colchão"
                suffix="m"
                value={largura}
                onChange={setLargura}
              />
              <CentsField
                label="Comprimento do colchão"
                suffix="m"
                value={comprimento}
                onChange={setComprimento}
              />
              <CentsField
                label="Altura do colchão"
                suffix="m"
                value={altura}
                onChange={setAltura}
                className="sm:col-span-2"
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
          <ResultPanel title="Ficha técnica" icon={BedDouble}>
            <ResultItem>
              <ResultRow
                label="Tamanho do colchão"
                value={dim3(
                  result.larguraOriginal,
                  result.comprimentoOriginal,
                  result.alturaOriginal,
                )}
              />
            </ResultItem>
            <ResultItem>
              <ResultRow
                label="Medida externa da cama"
                value={dim3(
                  result.larguraExterno,
                  result.comprimentoExterno,
                  result.alturaExterno,
                )}
              />
            </ResultItem>
            <ResultItem>
              <ResultRow
                label="Medida interna da cama"
                value={dim3(
                  result.larguraInterno,
                  result.comprimentoInterno,
                  result.alturaInterno,
                )}
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
                    <>
                      <ResultRow
                        label="Corte do tecido (lençol)"
                        value={dim2(
                          result.larguraLencol!,
                          result.comprimentoLencol!,
                        )}
                        tone="primary"
                      />
                      <ResultRow
                        label="Corte do quadrado (canto)"
                        value={dim2(result.alturaQuadrado!, result.alturaQuadrado!)}
                        tone="primary"
                      />
                    </>
                  )}
                  {result.acessorio === "virol" && (
                    <ResultRow
                      label="Corte do virol"
                      value={dim2(result.larguraVirol!, result.comprimentoVirol!)}
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
