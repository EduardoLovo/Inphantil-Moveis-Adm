/**
 * Lógica pura das calculadoras (replicada 1:1 do site legado da Inphantil).
 * Mantida separada da UI para ficar testável e sem surpresas.
 */

/** Formata entrada estilo "centavos": dígitos → divide por 100 → "1,50". */
export function formatCentsInput(value: string): string {
  const raw = value.replace(/\D/g, "");
  if (!raw) return "";
  return (parseInt(raw, 10) / 100).toFixed(2).replace(".", ",");
}

/** Converte "1,50" → 1.5 (NaN se inválido). */
export function parseNum(value: string): number {
  return parseFloat(value.replace(",", "."));
}

/** Saída de medida: 1.5 → "1,50". */
export function formatMeasure(v: number): string {
  return v.toFixed(2).replace(".", ",");
}

/** Saída monetária em BRL. */
export function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─────────────────────────────────────────────────────────────
// 1) Pagamento 60/40 — dedução de 6% sobre a entrada
// ─────────────────────────────────────────────────────────────
export type Pagamento6040 = {
  valorEntrada: number;
  valorTotal: number;
  descontoEntrada: number;
  valorAPrazo: number;
};

export function calc6040(ve: number, vt: number): Pagamento6040 {
  const descontoEntrada = ve * 0.06;
  return {
    valorEntrada: ve,
    valorTotal: vt,
    descontoEntrada,
    valorAPrazo: vt - ve - descontoEntrada,
  };
}

// ─────────────────────────────────────────────────────────────
// 2) Cama sob medida (montessoriana)
// ─────────────────────────────────────────────────────────────
export type Acessorio = "" | "lençol" | "virol";

export type MedidasCama = {
  larguraOriginal: number;
  comprimentoOriginal: number;
  larguraExterno: number;
  comprimentoExterno: number;
  larguraInterno: number;
  comprimentoInterno: number;
  larguraColchao: number;
  comprimentoColchao: number;
  larguraLencol?: number;
  comprimentoLencol?: number;
  larguraVirol?: number;
  comprimentoVirol?: number;
  acessorio: Acessorio;
};

export function calcCamaSobMedida(
  largura: number,
  comprimento: number,
  acessorio: Acessorio,
): MedidasCama {
  const larguraExterno = largura + 0.03;
  const comprimentoExterno = comprimento + 0.03;
  const larguraInterno = larguraExterno - 0.16;
  const comprimentoInterno = comprimentoExterno - 0.16;
  const larguraColchao = larguraInterno - 0.04;
  const comprimentoColchao = comprimentoInterno - 0.02;

  const r: MedidasCama = {
    larguraOriginal: largura,
    comprimentoOriginal: comprimento,
    larguraExterno,
    comprimentoExterno,
    larguraInterno,
    comprimentoInterno,
    larguraColchao,
    comprimentoColchao,
    acessorio,
  };

  if (acessorio === "lençol") {
    r.larguraLencol = larguraColchao + 0.48;
    r.comprimentoLencol = comprimentoColchao + 0.46;
  } else if (acessorio === "virol") {
    r.larguraVirol = largura + 0.4;
    r.comprimentoVirol = comprimento + 0.7;
  }

  return r;
}

// ─────────────────────────────────────────────────────────────
// 3) Colchão do cliente
// ─────────────────────────────────────────────────────────────
export type MedidasColchao = {
  larguraOriginal: number;
  comprimentoOriginal: number;
  alturaOriginal: number;
  larguraExterno: number;
  comprimentoExterno: number;
  alturaExterno: number;
  larguraInterno: number;
  comprimentoInterno: number;
  alturaInterno: number;
  larguraLencol?: number;
  comprimentoLencol?: number;
  alturaQuadrado?: number;
  larguraVirol?: number;
  comprimentoVirol?: number;
  acessorio: Acessorio;
};

export function calcColchao(
  largura: number,
  comprimento: number,
  altura: number,
  acessorio: Acessorio,
): MedidasColchao {
  const larguraInterno = largura + 0.04;
  const comprimentoInterno = comprimento + 0.02;
  const larguraExterno = larguraInterno + 0.16;
  const comprimentoExterno = comprimentoInterno + 0.16;
  const diferenca = altura - 0.1;
  const alturaExterno = diferenca + 0.23;
  const alturaInterno = diferenca + 0.21;

  const r: MedidasColchao = {
    larguraOriginal: largura,
    comprimentoOriginal: comprimento,
    alturaOriginal: altura,
    larguraExterno,
    comprimentoExterno,
    alturaExterno,
    larguraInterno,
    comprimentoInterno,
    alturaInterno,
    acessorio,
  };

  if (acessorio === "lençol") {
    r.larguraLencol = largura + (altura + 0.13) * 2;
    r.comprimentoLencol = comprimento + (altura + 0.13) * 2;
    r.alturaQuadrado = altura + 0.12;
  } else if (acessorio === "virol") {
    r.larguraVirol = largura + 0.4;
    r.comprimentoVirol = comprimento + 0.7;
  }

  return r;
}
