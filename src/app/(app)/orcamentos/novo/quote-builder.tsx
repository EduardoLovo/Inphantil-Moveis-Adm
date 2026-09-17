"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Save, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatBRL, parseNum } from "@/lib/calc";
import { MEASURE_LABEL, type MeasureType } from "@/lib/quote";
import {
  quotePreview,
  SELLER_MAX_DISCOUNT_FIXED,
  SELLER_MAX_DISCOUNT_PERCENT,
} from "@/lib/quote-pricing";
import { createQuote } from "./actions";

export type ProductOption = {
  id: number;
  name: string;
  sku: string | null;
  price: number | null;
  isPriceEditable: boolean;
  measureType: MeasureType;
  dimensions: string | null;
};

type Item = {
  key: string;
  product: ProductOption;
  quantity: string;
  measure: string;
  unitPrice: string;
  note: string;
};

const isMetro = (p: ProductOption) => p.measureType !== "UNIDADE";

function unitPriceOf(it: Item): number {
  return it.product.isPriceEditable
    ? parseNum(it.unitPrice)
    : Number(it.product.price ?? 0);
}
function lineTotalOf(it: Item): number {
  const up = unitPriceOf(it);
  const qty = isMetro(it.product) ? parseNum(it.measure) : parseNum(it.quantity);
  if (!up || !qty || up <= 0 || qty <= 0) return 0;
  return up * qty;
}

let counter = 0;

export function QuoteBuilder({
  products,
  isManager,
  sellerName,
}: {
  products: ProductOption[];
  isManager: boolean;
  sellerName: string;
}) {
  const router = useRouter();
  const [customerName, setCustomerName] = React.useState("");
  const [items, setItems] = React.useState<Item[]>([]);
  const [addId, setAddId] = React.useState("");
  const [discountPercent, setDiscountPercent] = React.useState("");
  const [discountFixed, setDiscountFixed] = React.useState("");
  const [oneInstallmentDiscount, setOneInstallmentDiscount] = React.useState(false);
  const [installments, setInstallments] = React.useState(10);
  const [shippingZip, setShippingZip] = React.useState("");
  const [shippingValue, setShippingValue] = React.useState("");
  const [pending, setPending] = React.useState(false);

  function addProduct() {
    const id = Number(addId);
    const product = products.find((p) => p.id === id);
    if (!product) return;
    setItems((prev) => [
      ...prev,
      {
        key: `it-${++counter}`,
        product,
        quantity: "1",
        measure: "",
        unitPrice: "",
        note: "",
      },
    ]);
    setAddId("");
  }

  function updateItem(key: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }
  function removeItem(key: string) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  const subtotal = items.reduce((s, it) => s + lineTotalOf(it), 0);
  const preview = quotePreview({
    subtotal,
    shippingValue: parseNum(shippingValue) || 0,
    discountPercent: parseNum(discountPercent) || 0,
    discountFixed: parseNum(discountFixed) || 0,
    oneInstallmentDiscount,
    maxInstallments: installments,
  });

  const overCap =
    !isManager &&
    ((parseNum(discountPercent) || 0) > SELLER_MAX_DISCOUNT_PERCENT ||
      (parseNum(discountFixed) || 0) > SELLER_MAX_DISCOUNT_FIXED);

  async function salvar() {
    if (!customerName.trim()) return toast.error("Informe o nome do cliente.");
    if (items.length === 0) return toast.error("Adicione ao menos um produto.");

    const payloadItems = items.map((it) => ({
      quoteProductId: it.product.id,
      quantity: isMetro(it.product) ? undefined : parseNum(it.quantity) || undefined,
      measure: isMetro(it.product) ? parseNum(it.measure) || undefined : undefined,
      unitPrice: it.product.isPriceEditable ? parseNum(it.unitPrice) || undefined : undefined,
      note: it.note.trim() || undefined,
    }));

    setPending(true);
    const res = await createQuote({
      customerName,
      items: payloadItems,
      discountPercent: parseNum(discountPercent) || undefined,
      discountFixed: parseNum(discountFixed) || undefined,
      oneInstallmentDiscount,
      installments,
      shippingZipCode: shippingZip || undefined,
      shippingValue: parseNum(shippingValue) || undefined,
    });
    setPending(false);

    if (res.ok) {
      toast.success(`Orçamento ${res.number} criado.`);
      router.push("/orcamentos");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
      {/* Coluna do formulário */}
      <div className="space-y-6">
        {/* Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Nome do cliente</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <p className="text-xs text-muted-foreground">Vendedor(a): {sellerName}</p>
          </CardContent>
        </Card>

        {/* Itens */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <select
                value={addId}
                onChange={(e) => setAddId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecione um produto para adicionar…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.isPriceEditable ? " (valor editável)" : p.price != null ? ` — ${formatBRL(p.price)}` : ""}
                  </option>
                ))}
              </select>
              <Button type="button" onClick={addProduct} disabled={!addId}>
                <Plus className="size-4" /> Adicionar
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum produto adicionado ainda.
              </p>
            ) : (
              <ul className="space-y-3">
                {items.map((it) => (
                  <li key={it.key} className="rounded-xl border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{it.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {MEASURE_LABEL[it.product.measureType]}
                          {it.product.dimensions ? ` · ${it.product.dimensions}` : ""}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeItem(it.key)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {isMetro(it.product) ? (
                        <Field label="Medida (m)">
                          <Input
                            inputMode="decimal"
                            value={it.measure}
                            onChange={(e) => updateItem(it.key, { measure: e.target.value })}
                            placeholder="0,00"
                          />
                        </Field>
                      ) : (
                        <Field label="Quantidade">
                          <Input
                            inputMode="numeric"
                            value={it.quantity}
                            onChange={(e) => updateItem(it.key, { quantity: e.target.value })}
                            placeholder="1"
                          />
                        </Field>
                      )}

                      {it.product.isPriceEditable ? (
                        <Field label="Valor unitário (R$)">
                          <Input
                            inputMode="decimal"
                            value={it.unitPrice}
                            onChange={(e) => updateItem(it.key, { unitPrice: e.target.value })}
                            placeholder="0,00"
                          />
                        </Field>
                      ) : (
                        <Field label="Valor unitário">
                          <div className="flex h-10 items-center text-sm font-semibold tabular-nums">
                            {it.product.price != null ? formatBRL(it.product.price) : "—"}
                          </div>
                        </Field>
                      )}

                      <Field label="Subtotal">
                        <div className="flex h-10 items-center text-sm font-bold tabular-nums text-primary">
                          {formatBRL(lineTotalOf(it))}
                        </div>
                      </Field>
                    </div>

                    <div className="mt-2">
                      <Input
                        value={it.note}
                        onChange={(e) => updateItem(it.key, { note: e.target.value })}
                        placeholder="Observação (opcional)"
                        className="h-9 text-sm"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Desconto à vista */}
        <Card>
          <CardHeader>
            <CardTitle>Desconto à vista</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Desconto (%)">
                <Input
                  inputMode="decimal"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="0"
                />
              </Field>
              <Field label="Desconto (R$)">
                <Input
                  inputMode="decimal"
                  value={discountFixed}
                  onChange={(e) => setDiscountFixed(e.target.value)}
                  placeholder="0,00"
                />
              </Field>
            </div>
            {!isManager && (
              <p className={cn("text-xs", overCap ? "text-destructive" : "text-muted-foreground")}>
                Vendedoras: máx. {SELLER_MAX_DISCOUNT_PERCENT}% e {formatBRL(SELLER_MAX_DISCOUNT_FIXED)}.
              </p>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={oneInstallmentDiscount}
                onChange={(e) => setOneInstallmentDiscount(e.target.checked)}
              />
              Aplicar −4% no à prazo 1x (só nos produtos)
            </label>
          </CardContent>
        </Card>

        {/* Frete + parcelas */}
        <Card>
          <CardHeader>
            <CardTitle>Frete e parcelamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="CEP (opcional)">
                <Input value={shippingZip} onChange={(e) => setShippingZip(e.target.value)} placeholder="00000-000" />
              </Field>
              <Field label="Valor do frete (R$)">
                <Input inputMode="decimal" value={shippingValue} onChange={(e) => setShippingValue(e.target.value)} placeholder="0,00" />
              </Field>
              <Field label="Máx. de parcelas">
                <select
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}x</option>
                  ))}
                </select>
              </Field>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coluna do resumo (sticky) */}
      <div className="lg:sticky lg:top-20 lg:h-fit">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="size-4 text-primary" /> Resumo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatBRL(preview.subtotal)} />
              {preview.discountValue > 0 && (
                <Row label="Desconto à vista" value={`− ${formatBRL(preview.discountValue)}`} />
              )}
              {preview.shippingValue > 0 && (
                <Row label="Frete" value={`+ ${formatBRL(preview.shippingValue)}`} />
              )}
            </div>

            {/* À vista */}
            <div className="rounded-xl bg-primary px-4 py-3 text-primary-foreground">
              <p className="text-xs font-bold uppercase tracking-wider">À vista</p>
              <p className="text-2xl font-black tabular-nums">{formatBRL(preview.totalVista)}</p>
            </div>

            {/* No crédito */}
            <div>
              <p className="mb-1.5 text-sm font-bold">No crédito</p>
              <ul className="space-y-1 text-sm">
                {preview.installments.map((line) => (
                  <li key={line.n} className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-muted-foreground">
                      {line.n}x{" "}
                      {line.n === 1 ? (
                        line.desconto1x && (
                          <span className="text-[color:var(--success)]">(−4%)</span>
                        )
                      ) : (
                        <span className={line.comJuros ? "text-amber-600" : "text-[color:var(--success)]"}>
                          {line.comJuros ? "c/ juros" : "s/ juros"}
                        </span>
                      )}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatBRL(line.parcela)}
                      {line.comJuros && (
                        <span className="font-normal text-muted-foreground"> (tot. {formatBRL(line.total)})</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <Button className="w-full" onClick={salvar} disabled={pending || overCap}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar orçamento
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Juros só quando a parcela fica abaixo de {formatBRL(100)}.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
