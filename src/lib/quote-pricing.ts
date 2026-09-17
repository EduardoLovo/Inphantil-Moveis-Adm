// =========================================================
// Preço/juros dos orçamentos — regras portadas 1:1 do site legado.
// (creditInterest.ts + a lógica de totais do backend)
// =========================================================

/** Arredonda para 2 casas evitando erros de ponto flutuante. */
export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// Desconto aplicado APENAS no à prazo 1x quando a opção estiver marcada.
export const ONE_INSTALLMENT_DISCOUNT_PERCENT = 4;

// Tetos de desconto à vista para vendedoras (SELLER). ADMIN/DEV não têm limite.
export const SELLER_MAX_DISCOUNT_PERCENT = 10;
export const SELLER_MAX_DISCOUNT_FIXED = 5;

export const MAX_INSTALLMENTS = 10;
// Parcela a partir da qual NÃO há juros (parcela >= R$100 → sem juros).
export const MIN_INSTALLMENT_NO_INTEREST = 100;

// Juros do cartão (e.Rede). ⚠️ Espelhado do legado — manter idêntico.
export const CREDIT_INTEREST_RATES: Record<number, number> = {
  2: 0.0401,
  3: 0.046,
  4: 0.0519,
  5: 0.0578,
  6: 0.0637,
  7: 0.0719,
  8: 0.0778,
  9: 0.0837,
  10: 0.0896,
};

/** Todos os valores podem parcelar em até 10x. */
export function maxInstallmentsFor(): number {
  return MAX_INSTALLMENTS;
}

/** Taxa efetiva: 0 se a parcela sem juros (base/n) já for >= R$100. */
export function effectiveRateFor(base: number, n: number): number {
  if (n <= 1) return 0;
  if (base / n >= MIN_INSTALLMENT_NO_INTEREST - 1e-9) return 0;
  return CREDIT_INTEREST_RATES[n] ?? 0;
}

export function hasInterest(base: number, n: number): boolean {
  return effectiveRateFor(base, n) > 0;
}

/** Total cobrado (base + juros, quando houver) para n parcelas. */
export function creditTotalFor(base: number, n: number): number {
  return base * (1 + effectiveRateFor(base, n));
}

/** Valor de cada parcela para n parcelas. */
export function installmentValueFor(base: number, n: number): number {
  return creditTotalFor(base, n) / n;
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export type InstallmentLine = {
  n: number;
  comJuros: boolean;
  parcela: number;
  total: number;
  /** true no 1x quando o desconto de 1x está aplicado. */
  desconto1x?: boolean;
};

export type QuotePreview = {
  subtotal: number;
  shippingValue: number;
  discountValue: number;
  totalPrazo: number; // preço cheio (subtotal + frete) — base do parcelamento
  totalPrazo1x: number; // cheio com o eventual -4% no 1x
  totalVista: number; // cheio - desconto à vista
  installments: InstallmentLine[];
};

/**
 * Núcleo de exibição: à vista + parcelamento no crédito de 1x até o máximo.
 * Usado tanto na prévia do builder quanto no PDF.
 */
export function quotePreview(input: {
  subtotal: number;
  shippingValue?: number;
  discountPercent?: number;
  discountFixed?: number;
  oneInstallmentDiscount?: boolean;
  maxInstallments?: number;
}): QuotePreview {
  const subtotal = round2(input.subtotal || 0);
  const shippingValue = round2(input.shippingValue || 0);

  const discPct = (subtotal * (input.discountPercent || 0)) / 100;
  const discFix = input.discountFixed || 0;
  const discountValue = Math.min(round2(discPct + discFix), subtotal);

  const totalPrazo = round2(subtotal + shippingValue);
  const totalPrazo1x = input.oneInstallmentDiscount
    ? round2(totalPrazo - subtotal * (ONE_INSTALLMENT_DISCOUNT_PERCENT / 100))
    : totalPrazo;
  const totalVista = round2(totalPrazo - discountValue);

  const nMax = Math.min(
    clamp(input.maxInstallments ?? MAX_INSTALLMENTS, 1, MAX_INSTALLMENTS),
    maxInstallmentsFor(),
  );

  const installments: InstallmentLine[] = [
    {
      n: 1,
      comJuros: false,
      parcela: round2(totalPrazo1x),
      total: round2(totalPrazo1x),
      desconto1x: !!input.oneInstallmentDiscount,
    },
  ];
  for (let n = 2; n <= nMax; n++) {
    installments.push({
      n,
      comJuros: hasInterest(totalPrazo, n),
      parcela: round2(installmentValueFor(totalPrazo, n)),
      total: round2(creditTotalFor(totalPrazo, n)),
    });
  }

  return {
    subtotal,
    shippingValue,
    discountValue,
    totalPrazo,
    totalPrazo1x,
    totalVista,
    installments,
  };
}

/** Totais persistidos do orçamento (autoritativo no servidor). */
export function computeQuoteMoney(input: {
  subtotal: number;
  shippingValue?: number;
  discountPercent?: number;
  discountFixed?: number;
}) {
  const subtotal = round2(input.subtotal || 0);
  const shippingValue = round2(input.shippingValue || 0);
  const discountValue = Math.min(
    round2((subtotal * (input.discountPercent || 0)) / 100 + (input.discountFixed || 0)),
    subtotal,
  );
  const total = round2(subtotal + shippingValue);
  return { subtotal, shippingValue, discountValue, total };
}
