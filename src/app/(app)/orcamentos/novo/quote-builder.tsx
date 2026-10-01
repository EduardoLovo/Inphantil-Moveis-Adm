"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, animate, motion } from "framer-motion";
import {
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  MessageSquarePlus,
  Minus,
  PackageSearch,
  Percent,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShoppingBag,
  Trash2,
  Truck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatBRL, formatCentsInput, parseNum } from "@/lib/calc";
import { MEASURE_LABEL, type MeasureType, type QuoteFull } from "@/lib/quote";
import {
  MAX_INSTALLMENTS,
  ONE_INSTALLMENT_DISCOUNT_PERCENT,
  quotePreview,
  SELLER_MAX_DISCOUNT_FIXED,
  SELLER_MAX_DISCOUNT_PERCENT,
} from "@/lib/quote-pricing";
import { fuzzyFilter } from "@/lib/search";
import { trackLoading } from "@/components/feedback/global-loading";
import { updateQuote } from "../actions";
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
  /** Item já salvo no orçamento (modo edição). */
  existingItemId?: number;
  product: ProductOption;
  quantity: string;
  measure: string;
  unitPrice: string;
  note: string;
  showNote: boolean;
};

type FormState = {
  customerName: string;
  items: Item[];
  discountPercent: string;
  discountFixed: string;
  oneInstallmentDiscount: boolean;
  installments: number;
  shippingZip: string;
  shippingValue: string;
};

const isMetro = (p: ProductOption) => p.measureType !== "UNIDADE";
const measureUnit = (p: ProductOption) => (p.measureType === "METRO_QUADRADO" ? "m²" : "m");

/** 1234.5 → "1234,50" (formato dos campos de dinheiro). */
const moneyInput = (n: number) => (n > 0 ? n.toFixed(2).replace(".", ",") : "");
/** 2.06 → "2,06" (campos decimais livres). */
const decimalInput = (n: number) => (n > 0 ? String(n).replace(".", ",") : "");
/** Mantém só dígitos e uma vírgula. */
const sanitizeDecimal = (v: string) =>
  v.replace(/\./g, ",").replace(/[^\d,]/g, "").replace(/(,.*?),/g, "$1");
const maskCep = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

function unitPriceOf(it: Item): number {
  return it.product.isPriceEditable ? parseNum(it.unitPrice) : Number(it.product.price ?? 0);
}
function lineTotalOf(it: Item): number {
  const up = unitPriceOf(it);
  const qty = isMetro(it.product) ? parseNum(it.measure) : parseNum(it.quantity);
  if (!up || !qty || up <= 0 || qty <= 0) return 0;
  return up * qty;
}

let counter = 0;
const newKey = () => `it-${++counter}`;

function emptyForm(): FormState {
  return {
    customerName: "",
    items: [],
    discountPercent: "",
    discountFixed: "",
    oneInstallmentDiscount: false,
    installments: 10,
    shippingZip: "",
    shippingValue: "",
  };
}

/** Converte um orçamento salvo no estado do formulário. */
function formFromQuote(q: QuoteFull, editableIds: Set<number>): FormState {
  return {
    customerName: q.customerName,
    items: q.items.map((it) => {
      const isPriceEditable = it.quoteProductId != null && editableIds.has(it.quoteProductId);
      return {
        key: newKey(),
        existingItemId: it.id,
        product: {
          id: it.quoteProductId ?? -it.id,
          name: it.name,
          sku: it.sku || null,
          price: it.unitPrice,
          isPriceEditable,
          measureType: it.measureType,
          dimensions: it.dimensions,
        },
        quantity: it.quantity != null ? String(it.quantity) : "1",
        measure: it.measure != null ? decimalInput(it.measure) : "",
        unitPrice: isPriceEditable ? moneyInput(it.unitPrice) : "",
        note: it.note ?? "",
        showNote: !!it.note,
      };
    }),
    discountPercent: q.discountPercent > 0 ? decimalInput(q.discountPercent) : "",
    discountFixed: moneyInput(q.discountFixed),
    oneInstallmentDiscount: q.oneInstallmentDiscount,
    installments: q.installments ?? 10,
    shippingZip: q.shippingZipCode ? maskCep(q.shippingZipCode) : "",
    shippingValue: moneyInput(q.shippingValue),
  };
}

/** Representação estável do que importa salvar (para detectar alterações). */
function snapshotOf(f: FormState): string {
  return JSON.stringify({
    ...f,
    items: f.items.map((it) => [
      it.existingItemId ?? null,
      it.product.id,
      it.quantity,
      it.measure,
      it.unitPrice,
      it.note.trim(),
    ]),
  });
}

export function QuoteBuilder({
  products,
  isManager,
  sellerName,
  quote,
  editableProductIds = [],
}: {
  products: ProductOption[];
  isManager: boolean;
  sellerName: string;
  /** Quando informado, o builder edita este orçamento. */
  quote?: QuoteFull;
  /** Produtos de valor editável (para reconstruir os itens salvos). */
  editableProductIds?: number[];
}) {
  const router = useRouter();
  const isEdit = !!quote;

  const editableIds = React.useMemo(() => new Set(editableProductIds), [editableProductIds]);
  const [form, setForm] = React.useState<FormState>(() =>
    quote ? formFromQuote(quote, editableIds) : emptyForm(),
  );
  const [baseline, setBaseline] = React.useState(() => snapshotOf(form));
  const [saved, setSaved] = React.useState<QuoteFull | undefined>(quote);
  const [pending, setPending] = React.useState(false);
  const [pdfLoading, setPdfLoading] = React.useState(false);

  const dirty = snapshotOf(form) !== baseline;
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  function addProduct(product: ProductOption) {
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        { key: newKey(), product, quantity: "1", measure: "", unitPrice: "", note: "", showNote: false },
      ],
    }));
  }
  function updateItem(key: string, patch: Partial<Item>) {
    setForm((f) => ({
      ...f,
      items: f.items.map((it) => (it.key === key ? { ...it, ...patch } : it)),
    }));
  }
  function removeItem(key: string) {
    setForm((f) => ({ ...f, items: f.items.filter((it) => it.key !== key) }));
  }

  const subtotal = form.items.reduce((s, it) => s + lineTotalOf(it), 0);
  const preview = quotePreview({
    subtotal,
    shippingValue: parseNum(form.shippingValue) || 0,
    discountPercent: parseNum(form.discountPercent) || 0,
    discountFixed: parseNum(form.discountFixed) || 0,
    oneInstallmentDiscount: form.oneInstallmentDiscount,
    maxInstallments: form.installments,
  });

  // Vendedora pode manter um desconto acima do teto que já estava salvo (dado por admin).
  const pct = parseNum(form.discountPercent) || 0;
  const fix = parseNum(form.discountFixed) || 0;
  const overCap =
    !isManager &&
    ((pct > SELLER_MAX_DISCOUNT_PERCENT && pct !== saved?.discountPercent) ||
      (fix > SELLER_MAX_DISCOUNT_FIXED && fix !== saved?.discountFixed));

  /** Salva (cria ou atualiza). Retorna o orçamento salvo no modo edição. */
  async function salvar(): Promise<QuoteFull | null> {
    if (!form.customerName.trim()) {
      toast.error("Informe o nome do cliente.");
      return null;
    }
    if (form.items.length === 0) {
      toast.error("Adicione ao menos um produto.");
      return null;
    }

    const sent = form;
    const payload = {
      customerName: sent.customerName,
      items: sent.items.map((it) => ({
        existingItemId: it.existingItemId,
        quoteProductId: it.existingItemId ? undefined : it.product.id,
        quantity: isMetro(it.product) ? undefined : parseNum(it.quantity) || undefined,
        measure: isMetro(it.product) ? parseNum(it.measure) || undefined : undefined,
        unitPrice: it.product.isPriceEditable ? parseNum(it.unitPrice) || undefined : undefined,
        note: it.note.trim() || undefined,
      })),
      discountPercent: pct || undefined,
      discountFixed: fix || undefined,
      oneInstallmentDiscount: sent.oneInstallmentDiscount,
      installments: sent.installments,
      shippingZipCode: sent.shippingZip || undefined,
      shippingValue: parseNum(sent.shippingValue) || undefined,
    };

    setPending(true);
    try {
      if (!quote) {
        const res = await createQuote(payload);
        if (!res.ok) {
          toast.error(res.error);
          return null;
        }
        toast.success(`Orçamento ${res.number} criado.`);
        setBaseline(snapshotOf(sent));
        router.push(`/orcamentos/${res.id}`);
        return null;
      }

      const res = await updateQuote(quote.id, payload);
      if (!res.ok) {
        toast.error(res.error);
        return null;
      }
      // Os itens são regravados: liga cada linha ao novo id salvo.
      const newIds = new Map(sent.items.map((it, i) => [it.key, res.quote.items[i]?.id]));
      const withIds = (items: Item[]) =>
        items.map((it) => (newIds.has(it.key) ? { ...it, existingItemId: newIds.get(it.key) } : it));
      setForm((f) => ({ ...f, items: withIds(f.items) }));
      setBaseline(snapshotOf({ ...sent, items: withIds(sent.items) }));
      setSaved(res.quote);
      toast.success(`${res.quote.number} atualizado.`);
      router.refresh();
      return res.quote;
    } finally {
      setPending(false);
    }
  }

  function descartar() {
    if (!saved) return;
    const f = formFromQuote(saved, editableIds);
    setForm(f);
    setBaseline(snapshotOf(f));
  }

  async function baixarPdf() {
    let data = saved;
    if (dirty || !data) {
      data = (await salvar()) ?? undefined;
      if (!data) return;
    }
    setPdfLoading(true);
    try {
      await trackLoading(import("@/lib/quote-pdf").then((m) => m.generateQuotePdf(data)));
    } catch {
      toast.error("Não foi possível gerar o PDF.");
    } finally {
      setPdfLoading(false);
    }
  }

  // Ctrl/Cmd + S salva.
  const onSaveShortcut = React.useEffectEvent(() => {
    if (!pending && !overCap && (!isEdit || dirty)) void salvar();
  });
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSaveShortcut();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Avisa antes de sair com alterações não salvas.
  React.useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const itemsCount = form.items.length;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,23rem)]">
        {/* Coluna do formulário */}
        <div className="space-y-5">
          <Section icon={UserRound} step={1} title="Cliente">
            <Input
              value={form.customerName}
              onChange={(e) => set({ customerName: e.target.value })}
              placeholder="Nome completo do cliente"
              className="h-12 rounded-xl text-base font-semibold"
            />
            <p className="mt-2 text-xs text-muted-foreground">Vendedor(a): {sellerName}</p>
          </Section>

          <Section
            icon={ShoppingBag}
            step={2}
            title="Produtos"
            aside={
              itemsCount > 0 && (
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-accent-foreground">
                  {itemsCount} {itemsCount === 1 ? "item" : "itens"}
                </span>
              )
            }
          >
            <ProductSearch products={products} onSelect={addProduct} />

            <div className="mt-4">
              {itemsCount === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed py-10 text-center text-sm text-muted-foreground">
                  <PackageSearch className="size-8 opacity-60" />
                  Busque acima e adicione produtos ao orçamento.
                </div>
              ) : (
                <ul className="space-y-3">
                  <AnimatePresence initial={false}>
                    {form.items.map((it) => (
                      <motion.li
                        key={it.key}
                        layout
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 40, transition: { duration: 0.18 } }}
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      >
                        <ItemCard
                          item={it}
                          onChange={(patch) => updateItem(it.key, patch)}
                          onRemove={() => removeItem(it.key)}
                        />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </Section>

          <Section icon={Percent} step={3} title="Desconto à vista">
            <div className="grid gap-3 sm:grid-cols-2">
              <AffixInput
                label="Desconto (%)"
                suffix="%"
                value={form.discountPercent}
                onChange={(v) => set({ discountPercent: sanitizeDecimal(v) })}
                placeholder="0"
              />
              <AffixInput
                label="Desconto (R$)"
                prefix="R$"
                value={form.discountFixed}
                onChange={(v) => set({ discountFixed: formatCentsInput(v) })}
                placeholder="0,00"
              />
            </div>
            {!isManager && (
              <p className={cn("mt-2 text-xs", overCap ? "font-semibold text-destructive" : "text-muted-foreground")}>
                Vendedoras: máx. {SELLER_MAX_DISCOUNT_PERCENT}% e {formatBRL(SELLER_MAX_DISCOUNT_FIXED)}.
              </p>
            )}
            <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-muted/40 px-4 py-3 transition-colors hover:bg-muted/70">
              <span className="text-sm">
                <span className="font-semibold">−{ONE_INSTALLMENT_DISCOUNT_PERCENT}% no crédito 1x</span>
                <span className="block text-xs text-muted-foreground">Aplicado só sobre os produtos.</span>
              </span>
              <Switch
                checked={form.oneInstallmentDiscount}
                onCheckedChange={(v) => set({ oneInstallmentDiscount: v })}
              />
            </label>
          </Section>

          <Section icon={Truck} step={4} title="Frete e parcelamento">
            <div className="grid gap-3 sm:grid-cols-2">
              <AffixInput
                label="CEP (opcional)"
                value={form.shippingZip}
                onChange={(v) => set({ shippingZip: maskCep(v) })}
                placeholder="00000-000"
              />
              <AffixInput
                label="Valor do frete"
                prefix="R$"
                value={form.shippingValue}
                onChange={(v) => set({ shippingValue: formatCentsInput(v) })}
                placeholder="0,00"
              />
            </div>
            <div className="mt-4">
              <FieldLabel>Parcelar em até</FieldLabel>
              <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
                {Array.from({ length: MAX_INSTALLMENTS }, (_, i) => i + 1).map((n) => {
                  const active = form.installments === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => set({ installments: n })}
                      className={cn(
                        "relative h-10 rounded-lg border text-sm font-bold tabular-nums transition-colors",
                        active
                          ? "border-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:border-primary/60 hover:text-foreground",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="installments-pill"
                          className="absolute inset-0 rounded-[7px] bg-primary"
                          transition={{ type: "spring", stiffness: 500, damping: 36 }}
                        />
                      )}
                      <span className="relative">{n}x</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>
        </div>

        {/* Coluna do resumo (sticky) */}
        <div className="lg:sticky lg:top-20 lg:h-fit">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <p className="flex items-center gap-2 font-bold">
                <CreditCard className="size-4 text-primary" /> Resumo
              </p>
              {isEdit && <SaveStatus dirty={dirty} pending={pending} />}
            </div>

            <div className="space-y-4 p-5">
              <div className="space-y-1.5 text-sm">
                <Row label="Subtotal" value={<AnimatedBRL value={preview.subtotal} />} />
                <AnimatePresence initial={false}>
                  {preview.discountValue > 0 && (
                    <Collapse key="disc">
                      <Row
                        label="Desconto à vista"
                        value={<span className="text-[color:var(--success)]">− <AnimatedBRL value={preview.discountValue} /></span>}
                      />
                    </Collapse>
                  )}
                  {preview.shippingValue > 0 && (
                    <Collapse key="ship">
                      <Row label="Frete" value={<>+ <AnimatedBRL value={preview.shippingValue} /></>} />
                    </Collapse>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-amber-400 px-4 py-3.5 text-primary-foreground shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider opacity-80">À vista</p>
                <p className="text-3xl font-black tabular-nums">
                  <AnimatedBRL value={preview.totalVista} />
                </p>
                {preview.discountValue > 0 && (
                  <p className="mt-0.5 text-xs font-semibold opacity-80">
                    Economia de {formatBRL(preview.discountValue)}
                  </p>
                )}
                <ShoppingBag className="absolute -bottom-3 -right-3 size-20 opacity-10" />
              </div>

              <div>
                <p className="mb-2 text-sm font-bold">No crédito</p>
                <ul className="divide-y rounded-xl border text-sm">
                  {preview.installments.map((line) => (
                    <li
                      key={line.n}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 transition-colors hover:bg-muted/50"
                    >
                      <span className="flex items-center gap-1.5 font-semibold">
                        <span className="w-7 tabular-nums">{line.n}x</span>
                        {line.n === 1 ? (
                          line.desconto1x && (
                            <Tag tone="success">−{ONE_INSTALLMENT_DISCOUNT_PERCENT}%</Tag>
                          )
                        ) : (
                          <Tag tone={line.comJuros ? "warn" : "success"}>
                            {line.comJuros ? "c/ juros" : "s/ juros"}
                          </Tag>
                        )}
                      </span>
                      <span className="text-right font-semibold tabular-nums">
                        {formatBRL(line.parcela)}
                        {line.comJuros && (
                          <span className="block text-[11px] font-normal text-muted-foreground">
                            total {formatBRL(line.total)}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  Juros só quando a parcela fica abaixo de {formatBRL(100)}.
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  className="h-11 w-full text-base font-bold"
                  onClick={() => void salvar()}
                  disabled={pending || overCap || (isEdit && !dirty)}
                >
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {isEdit ? "Salvar alterações" : "Salvar orçamento"}
                </Button>
                {isEdit && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => void baixarPdf()}
                    disabled={pending || pdfLoading || (dirty && overCap)}
                  >
                    {pdfLoading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
                    {dirty ? "Salvar e baixar PDF" : "Baixar PDF"}
                  </Button>
                )}
                <p className="text-center text-[11px] text-muted-foreground">
                  Atalho: <kbd className="rounded border bg-muted px-1 font-mono">Ctrl</kbd> +{" "}
                  <kbd className="rounded border bg-muted px-1 font-mono">S</kbd>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra flutuante de alterações pendentes (edição) */}
      <AnimatePresence>
        {isEdit && dirty && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
          >
            <div className="flex w-full max-w-lg items-center gap-3 rounded-2xl border bg-popover/95 px-4 py-3 shadow-xl backdrop-blur">
              <span className="relative flex size-2.5 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500 opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-amber-500" />
              </span>
              <p className="flex-1 text-sm font-semibold">Alterações não salvas</p>
              <Button variant="ghost" size="sm" onClick={descartar} disabled={pending}>
                <RotateCcw className="size-4" /> Descartar
              </Button>
              <Button size="sm" onClick={() => void salvar()} disabled={pending || overCap}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Salvar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Card de um produto do orçamento com quantidade/medida, preço e observação. */
function ItemCard({
  item: it,
  onChange,
  onRemove,
}: {
  item: Item;
  onChange: (patch: Partial<Item>) => void;
  onRemove: () => void;
}) {
  const qty = parseInt(it.quantity, 10) || 0;
  const total = lineTotalOf(it);

  return (
    <div className="group relative rounded-xl border bg-background p-4 shadow-xs transition-shadow hover:shadow-md">
      <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-primary" />
      <div className="flex items-start justify-between gap-3 pl-1">
        <div className="min-w-0">
          <p className="font-bold leading-snug">{it.product.name}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {it.product.sku && <Tag>{it.product.sku}</Tag>}
            <Tag>{MEASURE_LABEL[it.product.measureType]}</Tag>
            {it.product.dimensions && <Tag>{it.product.dimensions}</Tag>}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={onRemove}
          aria-label="Remover produto"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="mt-4 grid items-end gap-3 pl-1 sm:grid-cols-3">
        {isMetro(it.product) ? (
          <AffixInput
            label={`Medida (${measureUnit(it.product)})`}
            suffix={measureUnit(it.product)}
            value={it.measure}
            onChange={(v) => onChange({ measure: sanitizeDecimal(v) })}
            placeholder="0,00"
          />
        ) : (
          <div>
            <FieldLabel>Quantidade</FieldLabel>
            <div className="flex h-10 items-center rounded-md border border-input bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring">
              <button
                type="button"
                onClick={() => onChange({ quantity: String(Math.max(1, qty - 1)) })}
                className="grid h-full w-9 place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                disabled={qty <= 1}
                aria-label="Diminuir"
              >
                <Minus className="size-4" />
              </button>
              <input
                inputMode="numeric"
                value={it.quantity}
                onChange={(e) => onChange({ quantity: e.target.value.replace(/\D/g, "") })}
                onBlur={() => !qty && onChange({ quantity: "1" })}
                className="h-full w-full min-w-0 bg-transparent text-center text-sm font-bold tabular-nums outline-none"
              />
              <button
                type="button"
                onClick={() => onChange({ quantity: String(qty + 1) })}
                className="grid h-full w-9 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Aumentar"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        )}

        {it.product.isPriceEditable ? (
          <AffixInput
            label="Valor unitário"
            prefix="R$"
            value={it.unitPrice}
            onChange={(v) => onChange({ unitPrice: formatCentsInput(v) })}
            placeholder="0,00"
          />
        ) : (
          <div>
            <FieldLabel>Valor unitário</FieldLabel>
            <div className="flex h-10 items-center text-sm font-semibold tabular-nums">
              {it.product.price != null ? formatBRL(it.product.price) : "—"}
              {isMetro(it.product) && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">/{measureUnit(it.product)}</span>
              )}
            </div>
          </div>
        )}

        <div className="sm:text-right">
          <FieldLabel>Subtotal</FieldLabel>
          <div className="flex h-10 items-center text-lg font-black tabular-nums sm:justify-end">
            <AnimatedBRL value={total} />
          </div>
        </div>
      </div>

      <div className="mt-3 pl-1">
        {it.showNote ? (
          <Input
            autoFocus={!it.note}
            value={it.note}
            onChange={(e) => onChange({ note: e.target.value })}
            onBlur={() => !it.note.trim() && onChange({ showNote: false, note: "" })}
            placeholder="Observação (ex.: cor, acabamento…)"
            className="h-9 text-sm"
          />
        ) : (
          <button
            type="button"
            onClick={() => onChange({ showNote: true })}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <MessageSquarePlus className="size-3.5" /> Adicionar observação
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Campo de busca com sugestões: filtra por palavras soltas (ex.: "cama queen")
 * e adiciona o produto ao clicar ou ao apertar Enter.
 */
function ProductSearch({
  products,
  onSelect,
}: {
  products: ProductOption[];
  onSelect: (p: ProductOption) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const listRef = React.useRef<HTMLUListElement>(null);

  const results = React.useMemo(
    () => fuzzyFilter(products, query, (p) => `${p.name} ${p.sku ?? ""}`),
    [products, query],
  );

  React.useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function choose(p: ProductOption) {
    onSelect(p);
    setQuery("");
    setActive(0);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && results[active]) choose(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        placeholder="Buscar produto para adicionar (ex.: cama queen)…"
        className="h-12 rounded-xl pl-10 text-base"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-20 mt-1.5 max-h-72 w-full overflow-auto rounded-xl border bg-popover p-1 text-sm shadow-xl"
          >
            {results.length === 0 ? (
              <li className="px-3 py-2 text-muted-foreground">Nenhum produto encontrado.</li>
            ) : (
              results.map((p, i) => (
                <li
                  key={p.id}
                  data-index={i}
                  role="option"
                  aria-selected={i === active}
                  // onMouseDown para escolher antes do onBlur fechar a lista
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(p);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2",
                    i === active && "bg-accent text-accent-foreground",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Plus className="size-3.5 shrink-0 opacity-60" />
                    {p.name}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums opacity-70">
                    {p.isPriceEditable ? "valor editável" : p.price != null ? formatBRL(p.price) : ""}
                  </span>
                </li>
              ))
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({
  icon: Icon,
  step,
  title,
  aside,
  children,
}: {
  icon: LucideIcon;
  step: number;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Icon className="size-[18px]" />
          <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border-2 border-card bg-foreground text-[10px] font-black text-background">
            {step}
          </span>
        </span>
        <h2 className="flex-1 text-lg font-extrabold tracking-tight">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function SaveStatus({ dirty, pending }: { dirty: boolean; pending: boolean }) {
  if (pending) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" /> Salvando…
      </span>
    );
  }
  return dirty ? (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
      <span className="size-2 rounded-full bg-amber-500" /> Não salvo
    </span>
  ) : (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--success)]">
      <CheckCircle2 className="size-3.5" /> Salvo
    </span>
  );
}

function AffixInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn("font-semibold tabular-nums", prefix && "pl-10", suffix && "pr-10")}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{children}</p>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: "success" | "warn" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
        tone === "success" && "bg-[color-mix(in_srgb,var(--success)_15%,transparent)] text-[color:var(--success)]",
        tone === "warn" && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
        !tone && "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function Collapse({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      className="overflow-hidden"
    >
      {children}
    </motion.div>
  );
}

/** Valor em R$ que anima suavemente ao mudar. */
function AnimatedBRL({ value }: { value: number }) {
  const [shown, setShown] = React.useState(value);
  const current = React.useRef(value);

  React.useEffect(() => {
    if (current.current === value) return;
    const controls = animate(current.current, value, {
      duration: 0.45,
      ease: "easeOut",
      onUpdate: (v) => {
        current.current = v;
        setShown(v);
      },
    });
    return () => controls.stop();
  }, [value]);

  return <span>{formatBRL(shown)}</span>;
}
