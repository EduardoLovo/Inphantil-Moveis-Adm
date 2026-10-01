import "server-only";
import ExcelJS from "exceljs";

import { prisma } from "@/lib/prisma";
import { formatQuoteNumber, MEASURE_LABEL, type MeasureType } from "@/lib/quote";
import type { ShippingQuoteFull } from "@/lib/shipping";
import { fmtDate, sheetName, TZ, writeTable, type XlsxColumn, type XlsxRow } from "@/lib/xlsx-server";

const yn = (b: boolean) => (b ? "Sim" : "Não");
const sum = (rows: XlsxRow[], key: string) =>
  Math.round(rows.reduce((s, r) => s + (Number(r[key]) || 0), 0) * 100) / 100;

function newWorkbook() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Inphantil Móveis";
  wb.created = new Date();
  return wb;
}

// ─────────────────────────────────────────────────────────────
// Fretes
// ─────────────────────────────────────────────────────────────

const FRETE_COLUMNS: XlsxColumn[] = [
  { header: "Nº", key: "number", width: 12 },
  { header: "Data", key: "createdAt", width: 12, align: "center" },
  { header: "Solicitante", key: "createdByName", width: 20 },
  { header: "Cliente", key: "customerName", width: 22 },
  { header: "CPF", key: "customerCpf", width: 16 },
  { header: "CEP", key: "customerZipCode", width: 12 },
  { header: "Cidade", key: "customerCity", width: 18 },
  { header: "UF", key: "customerState", width: 6, align: "center" },
  { header: "Detalhes", key: "quoteDetails", width: 30 },
  { header: "Transportadora", key: "carrierName", width: 20 },
  { header: "Volumes", key: "volumeQuantity", width: 10, align: "center" },
  { header: "Peso", key: "weight", width: 10 },
  { header: "Valor frete", key: "shippingValue", width: 14, money: true },
  { header: "Valor pedido", key: "orderValue", width: 14, money: true },
  { header: "Prazo", key: "deliveryDeadline", width: 14 },
  { header: "Protetor", key: "wallProtector", width: 18 },
  { header: "Tapete", key: "rug", width: 16 },
  { header: "Acessórios", key: "accessories", width: 12 },
  { header: "Cama", key: "bedSize", width: 16 },
  { header: "Solicitado", key: "isRequested", width: 11, align: "center" },
  { header: "Concluído", key: "isConcluded", width: 11, align: "center" },
  { header: "Observações", key: "adminNotes", width: 30 },
];

export function buildFretesWorkbook(rows: ShippingQuoteFull[], subtitle?: string) {
  const wb = newWorkbook();
  const data: XlsxRow[] = rows.map((r) => ({
    number: r.number,
    createdAt: fmtDate(r.createdAt),
    createdByName: r.createdByName,
    customerName: r.customerName,
    customerCpf: r.customerCpf,
    customerZipCode: r.customerZipCode,
    customerCity: r.customerCity,
    customerState: r.customerState,
    quoteDetails: r.quoteDetails,
    carrierName: r.carrierName,
    volumeQuantity: r.volumeQuantity,
    weight: r.weight,
    shippingValue: r.shippingValue,
    orderValue: r.orderValue,
    deliveryDeadline: r.deliveryDeadline,
    wallProtector: r.hasWallProtector ? `Sim ${r.wallProtectorSize ?? ""}`.trim() : "Não",
    rug: r.hasRug ? `Sim ${r.rugSize ?? ""}`.trim() : "Não",
    accessories: r.hasAccessories ? `${r.accessoryQuantity ?? ""}`.trim() || "Sim" : "Não",
    bedSize: r.bedSize,
    isRequested: yn(r.isRequested),
    isConcluded: yn(r.isConcluded),
    adminNotes: r.adminNotes,
  }));

  writeTable(wb.addWorksheet("Fretes"), {
    title: `Fretes (${rows.length})`,
    subtitle,
    columns: FRETE_COLUMNS,
    rows: data,
    totals: { number: "TOTAL", shippingValue: sum(data, "shippingValue"), orderValue: sum(data, "orderValue") },
    emptyMessage: "Nenhum frete encontrado.",
  });
  return wb;
}

// ─────────────────────────────────────────────────────────────
// Produtos de orçamento
// ─────────────────────────────────────────────────────────────

export async function buildProdutosWorkbook() {
  const products = await prisma.quoteProduct.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: { _count: { select: { quoteItems: true } } },
  });

  const wb = newWorkbook();
  writeTable(wb.addWorksheet("Produtos"), {
    title: `Produtos de orçamento (${products.length})`,
    columns: [
      { header: "SKU", key: "sku", width: 14 },
      { header: "Produto", key: "name", width: 44 },
      { header: "Tipo de medida", key: "measure", width: 16 },
      { header: "Preço", key: "price", width: 14, money: true },
      { header: "Valor editável", key: "editable", width: 14, align: "center" },
      { header: "Medidas", key: "dimensions", width: 18 },
      { header: "Ativo", key: "active", width: 9, align: "center" },
      { header: "Usado em orçamentos", key: "uses", width: 20, align: "center" },
      { header: "Cadastrado em", key: "createdAt", width: 15, align: "center" },
    ],
    rows: products.map((p) => ({
      sku: p.sku,
      name: p.name,
      measure: MEASURE_LABEL[p.measureType as MeasureType],
      price: p.isPriceEditable || p.price == null ? null : Number(p.price),
      editable: yn(p.isPriceEditable),
      dimensions: p.dimensions,
      active: yn(p.isActive),
      uses: p._count.quoteItems,
      createdAt: fmtDate(p.createdAt),
    })),
    emptyMessage: "Nenhum produto cadastrado.",
  });
  return wb;
}

// ─────────────────────────────────────────────────────────────
// Orçamentos por vendedora
// ─────────────────────────────────────────────────────────────

/** "2026-10-01" → início do dia em Brasília (UTC−3, sem horário de verão). */
const startOfDayBR = (iso: string) => new Date(`${iso}T00:00:00.000-03:00`);
const endOfDayBR = (iso: string) => new Date(`${iso}T23:59:59.999-03:00`);
const isoToBR = (iso: string) => iso.split("-").reverse().join("/");

const ORCAMENTO_COLUMNS: XlsxColumn[] = [
  { header: "Nº", key: "number", width: 12 },
  { header: "Data", key: "createdAt", width: 12, align: "center" },
  { header: "Cliente", key: "customerName", width: 26 },
  { header: "Itens", key: "itemsCount", width: 7, align: "center" },
  { header: "Produtos", key: "products", width: 60 },
  { header: "Valor produtos", key: "subtotal", width: 15, money: true },
  { header: "Desconto à vista", key: "discount", width: 16, money: true },
  { header: "Frete", key: "shipping", width: 13, money: true },
  { header: "Total (crédito)", key: "total", width: 15, money: true },
  { header: "Total à vista", key: "totalVista", width: 15, money: true },
  { header: "Parcelas (máx.)", key: "installments", width: 15, align: "center" },
];

const MONEY_KEYS = ["subtotal", "discount", "shipping", "total", "totalVista"] as const;

export async function buildOrcamentosWorkbook(from: string, to: string) {
  const quotes = await prisma.quote.findMany({
    where: { createdAt: { gte: startOfDayBR(from), lte: endOfDayBR(to) } },
    orderBy: { createdAt: "asc" },
    include: {
      seller: { select: { name: true } },
      items: { orderBy: { id: "asc" }, select: { name: true, quantity: true, measure: true, measureType: true } },
    },
  });

  // Agrupa por vendedora (ordem alfabética).
  const bySeller = new Map<string, { name: string; rows: XlsxRow[] }>();
  for (const q of quotes) {
    const group = bySeller.get(q.sellerId) ?? { name: q.seller.name, rows: [] };
    const total = Number(q.total);
    const discount = Number(q.discountValue);
    group.rows.push({
      number: formatQuoteNumber(q.id),
      createdAt: fmtDate(q.createdAt),
      customerName: q.customerName,
      itemsCount: q.items.length,
      products: q.items
        .map((i) => {
          const qty =
            i.measureType === "UNIDADE"
              ? `${i.quantity ?? 0}x`
              : `${Number(i.measure ?? 0).toLocaleString("pt-BR")} ${i.measureType === "METRO_QUADRADO" ? "m²" : "m"}`;
          return `${qty} ${i.name}`;
        })
        .join("; "),
      subtotal: Number(q.subtotal),
      discount,
      shipping: Number(q.shippingValue),
      total,
      totalVista: Math.round((total - discount) * 100) / 100,
      installments: q.installments ? `${q.installments}x` : "",
    });
    bySeller.set(q.sellerId, group);
  }
  const groups = [...bySeller.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const period = `Período: ${isoToBR(from)} a ${isoToBR(to)}`;
  const wb = newWorkbook();

  // Aba de resumo por vendedora.
  const resumoRows: XlsxRow[] = groups.map((g) => {
    const total = sum(g.rows, "total");
    return {
      seller: g.name,
      count: g.rows.length,
      subtotal: sum(g.rows, "subtotal"),
      discount: sum(g.rows, "discount"),
      shipping: sum(g.rows, "shipping"),
      total,
      totalVista: sum(g.rows, "totalVista"),
      ticket: g.rows.length ? Math.round((total / g.rows.length) * 100) / 100 : 0,
    };
  });
  const totalCount = quotes.length;
  const grandTotal = sum(resumoRows, "total");
  writeTable(wb.addWorksheet("Resumo"), {
    title: `Orçamentos por vendedora (${totalCount})`,
    subtitle: period,
    columns: [
      { header: "Vendedora", key: "seller", width: 28 },
      { header: "Orçamentos", key: "count", width: 12, align: "center" },
      { header: "Valor produtos", key: "subtotal", width: 16, money: true },
      { header: "Descontos à vista", key: "discount", width: 17, money: true },
      { header: "Frete", key: "shipping", width: 14, money: true },
      { header: "Total (crédito)", key: "total", width: 16, money: true },
      { header: "Total à vista", key: "totalVista", width: 16, money: true },
      { header: "Ticket médio", key: "ticket", width: 15, money: true },
    ],
    rows: resumoRows,
    totals: {
      seller: "TOTAL",
      count: totalCount,
      subtotal: sum(resumoRows, "subtotal"),
      discount: sum(resumoRows, "discount"),
      shipping: sum(resumoRows, "shipping"),
      total: grandTotal,
      totalVista: sum(resumoRows, "totalVista"),
      ticket: totalCount ? Math.round((grandTotal / totalCount) * 100) / 100 : 0,
    },
    emptyMessage: "Nenhum orçamento no período.",
  });

  // Uma aba por vendedora.
  for (const g of groups) {
    const totals: XlsxRow = { number: "TOTAL", itemsCount: sum(g.rows, "itemsCount") };
    for (const k of MONEY_KEYS) totals[k] = sum(g.rows, k);
    writeTable(wb.addWorksheet(sheetName(wb, g.name)), {
      title: `${g.name} — ${g.rows.length} orçamento(s)`,
      subtitle: period,
      columns: ORCAMENTO_COLUMNS,
      rows: g.rows,
      totals,
    });
  }

  return wb;
}

/** Data de hoje (aaaa-mm-dd) no fuso de Brasília, para nomes de arquivo. */
export const todayStamp = () => new Date().toLocaleDateString("sv-SE", { timeZone: TZ });
