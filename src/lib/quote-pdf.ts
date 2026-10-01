import { jsPDF } from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";

import type { MeasureType, QuoteFull } from "@/lib/quote";
import {
  maxInstallmentsFor,
  creditTotalFor,
  installmentValueFor,
  hasInterest,
  ONE_INSTALLMENT_DISCOUNT_PERCENT,
} from "@/lib/quote-pricing";

// Identidade Inphantil
type RGB = [number, number, number];
const DARK_SOFT: RGB = [58, 58, 62]; // #3a3a3e
const PANEL: RGB = [92, 92, 92]; // #5c5c5c — fundo do cabeçalho da tabela e do TOTAL
type GradientStop = [offset: number, color: RGB];
// linear-gradient(90deg, #5c5c5c 0%, #707070 49%, #b3b3b3 100%)
const HEADER_GRADIENT: GradientStop[] = [
  [0, [92, 92, 92]],
  [0.49, [112, 112, 112]],
  [1, [179, 179, 179]],
];
const YELLOW: RGB = [254, 254, 133]; // #fefe85 (mesma cor da logo)
const GRAY: RGB = [120, 120, 120];

/** Cor do degradê na posição t (0–1), interpolando entre as paradas. */
function colorAt(stops: GradientStop[], t: number): RGB {
  const i = Math.max(1, stops.findIndex(([o]) => o >= t));
  const [o0, c0] = stops[i - 1];
  const [o1, c1] = stops[i];
  const k = o1 === o0 ? 0 : (t - o0) / (o1 - o0);
  return [0, 1, 2].map((j) => Math.round(c0[j] + (c1[j] - c0[j]) * k)) as RGB;
}

/** Degradê horizontal (jsPDF não tem gradiente simples: faixas finas interpoladas). */
function gradientRect(doc: jsPDF, x: number, y: number, w: number, h: number, stops: GradientStop[]) {
  const steps = 120;
  const stepW = w / steps;
  for (let i = 0; i < steps; i++) {
    doc.setFillColor(...colorAt(stops, i / (steps - 1)));
    // +0.2 de sobreposição evita frestas entre as faixas
    doc.rect(x + i * stepW, y, stepW + 0.2, h, "F");
  }
}

const num = (v: unknown) => Number(v ?? 0) || 0;
const brl = (v: unknown) =>
  num(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const measureUnit = (t: MeasureType) =>
  t === "METRO_QUADRADO" ? "m²" : t === "METRO_LINEAR" ? "m" : "un";

const qtyLabel = (item: {
  measureType: MeasureType;
  quantity: number | null;
  measure: number | null;
}) => {
  if (item.measureType === "UNIDADE") return `${num(item.quantity)} un`;
  const m = num(item.measure).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${m} ${measureUnit(item.measureType)}`;
};

/** Carrega uma imagem pública (ex.: /logo2.png) como dataURL para o PDF. */
async function loadImageAsDataURL(src: string): Promise<string | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Gera e baixa um PDF profissional do orçamento. */
export async function generateQuotePdf(quote: QuoteFull) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 14;

  // ---------- Cabeçalho ----------
  const HEADER_H = 40;
  gradientRect(doc, 0, 0, pageW, HEADER_H, HEADER_GRADIENT);
  // filete na cor da marca fechando o cabeçalho
  doc.setFillColor(...YELLOW);
  doc.rect(0, HEADER_H, pageW, 1.2, "F");

  // Logo (elefantes + "INPHANTIL") à esquerda.
  const LOGO_H = 27;
  const LOGO_W = LOGO_H * (989 / 866); // proporção de /public/logopdf.png
  const logo = await loadImageAsDataURL("/logopdf.png");
  let hasLogo = false;
  if (logo) {
    try {
      doc.addImage(logo, "PNG", marginX, (HEADER_H - LOGO_H) / 2, LOGO_W, LOGO_H, "logo", "FAST");
      hasLogo = true;
    } catch {
      /* ignora logo inválida */
    }
  }

  const textX = hasLogo ? marginX + LOGO_W + 7 : marginX;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("INPHANTIL MÓVEIS", textX, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...YELLOW);
  doc.text("CNPJ 03.761.683/0001-98", textX, 21);
  doc.setTextColor(220, 220, 220);
  doc.text("WhatsApp (61) 98238-8828  ·  sac@inphantil.com.br", textX, 26);
  doc.setFontSize(8);
  doc.text("Rua Armando da Silva 515 - Jardim Rebouças", textX, 30.5);

  const dataStr = new Date(quote.createdAt).toLocaleDateString("pt-BR");
  // lado direito do degradê é claro: texto escuro para manter o contraste
  doc.setTextColor(33, 33, 35);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(quote.number, pageW - marginX, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 52);
  doc.text(`Data: ${dataStr}`, pageW - marginX, 20, { align: "right" });
  const updatedStr = new Date(quote.updatedAt).toLocaleDateString("pt-BR");
  if (updatedStr !== dataStr) {
    doc.text(`Atualizado: ${updatedStr}`, pageW - marginX, 25, { align: "right" });
  }

  // ---------- Título ----------
  let y = 50;
  doc.setTextColor(...DARK_SOFT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("ORÇAMENTO", marginX, y);

  // ---------- Cliente / vendedora ----------
  y += 5;
  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(marginX, y, pageW - marginX * 2, 20, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GRAY);
  doc.text("CLIENTE", marginX + 4, y + 7);
  doc.text("VENDEDOR(A)", pageW / 2 + 4, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11);
  const customerLabel = (quote.customerName || "-").toUpperCase();
  const sellerFirstName = (quote.sellerName || "-")
    .trim()
    .split(/\s+/)[0]
    .toUpperCase();
  doc.text(customerLabel, marginX + 4, y + 14);
  doc.text(sellerFirstName, pageW / 2 + 4, y + 14);

  // ---------- Tabela de itens ----------
  y += 26;
  const isMetroUnit = (t: MeasureType) => t !== "UNIDADE";
  const body: RowInput[] = [];
  quote.items.forEach((it) => {
    body.push([
      it.name,
      it.sku,
      qtyLabel(it),
      isMetroUnit(it.measureType)
        ? `${brl(it.unitPrice)}/${measureUnit(it.measureType)}`
        : brl(it.unitPrice),
      brl(it.lineTotal),
    ]);
    const dims = (it.dimensions || "").trim();
    if (dims) {
      body.push([
        {
          content: `Medidas: ${dims}`,
          colSpan: 5,
          styles: {
            fontSize: 8,
            textColor: GRAY,
            fillColor: [255, 255, 255],
            cellPadding: { top: 1, bottom: 1, left: 6, right: 4 },
          },
        },
      ]);
    }
    const note = (it.note || "").trim();
    if (note) {
      body.push([
        {
          content: `Obs.: ${note}`,
          colSpan: 5,
          styles: {
            fontStyle: "italic",
            fontSize: 8,
            textColor: GRAY,
            fillColor: [255, 255, 255],
            cellPadding: { top: 1, bottom: 2, left: 6, right: 4 },
          },
        },
      ]);
    }
  });

  autoTable(doc, {
    startY: y,
    head: [["Produto", "SKU", "Qtd / Medida", "Valor unit.", "Subtotal"]],
    body,
    theme: "grid",
    headStyles: {
      fillColor: PANEL,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
    columnStyles: {
      1: { halign: "center", cellWidth: 24 },
      2: { halign: "center", cellWidth: 28 },
      3: { halign: "right", cellWidth: 32 },
      4: { halign: "right", cellWidth: 30 },
    },
    margin: { left: marginX, right: marginX },
  });

  // ---------- Totais + formas de pagamento ----------
  const lastTable = (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable;
  let finalY = lastTable.finalY + 8;
  if (finalY > pageH - 105) {
    doc.addPage();
    finalY = 20;
  }

  const subtotal = num(quote.subtotal);
  const discountValue = num(quote.discountValue);
  const discountPercent = num(quote.discountPercent);
  const shippingValue = num(quote.shippingValue);
  const totalPrazo = subtotal + shippingValue;
  const totalVista = totalPrazo - discountValue;

  // Resumo (caixa à direita)
  const boxW = 74;
  const boxX = pageW - marginX - boxW;
  const summary: Array<[string, string]> = [
    ["Valor dos produtos", brl(subtotal)],
    [
      quote.shippingZipCode ? `Frete (CEP ${quote.shippingZipCode})` : "Frete",
      brl(shippingValue),
    ],
  ];
  const boxH = 8 + summary.length * 6 + 12;
  doc.setDrawColor(230, 230, 230);
  doc.roundedRect(boxX, finalY, boxW, boxH, 2, 2, "S");
  let ly = finalY + 8;
  doc.setFontSize(9.5);
  summary.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(label, boxX + 4, ly);
    doc.setTextColor(40, 40, 40);
    doc.text(value, boxX + boxW - 4, ly, { align: "right" });
    ly += 6;
  });
  doc.setFillColor(...PANEL);
  doc.rect(boxX, ly - 1, boxW, 11, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TOTAL", boxX + 4, ly + 6.5);
  doc.setTextColor(...YELLOW);
  doc.text(brl(totalPrazo), boxX + boxW - 4, ly + 6.5, { align: "right" });

  // Formas de pagamento (esquerda)
  doc.setTextColor(...DARK_SOFT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Formas de pagamento", marginX, finalY + 4);

  const chosenInstallments =
    quote.installments && quote.installments > 0 ? quote.installments : 10;
  const maxInstallments = Math.min(chosenInstallments, maxInstallmentsFor());
  const oneInstallmentDiscount = !!quote.oneInstallmentDiscount;
  const base1x = oneInstallmentDiscount
    ? totalPrazo - subtotal * (ONE_INSTALLMENT_DISCOUNT_PERCENT / 100)
    : totalPrazo;
  const totalPrazo1x = creditTotalFor(base1x, 1);

  // 1) À vista
  let py = finalY + 13;
  doc.setFontSize(10);
  doc.setTextColor(...DARK_SOFT);
  doc.text("À vista", marginX, py);
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  doc.text(brl(totalVista), marginX + 24, py);
  py += 5.5;
  if (discountValue > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    const pctLabel = discountPercent.toLocaleString("pt-BR", {
      maximumFractionDigits: 2,
    });
    const economiaLabel =
      discountPercent > 0
        ? `Desconto de ${pctLabel}%, economia de ${brl(discountValue)}`
        : `Economia de ${brl(discountValue)}`;
    doc.text(economiaLabel, marginX, py);
    py += 4;
  }

  // 2) No crédito — 1x
  py += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK_SOFT);
  doc.text("No crédito — 1x", marginX, py);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  doc.text(brl(totalPrazo1x), marginX + 28, py);
  if (oneInstallmentDiscount) {
    py += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(
      `Desconto de ${ONE_INSTALLMENT_DISCOUNT_PERCENT}%, economia de ${brl(
        totalPrazo - base1x,
      )}`,
      marginX,
      py,
    );
  }

  // 3) No crédito — 2x até o máximo
  if (maxInstallments >= 2) {
    py += 9;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DARK_SOFT);
    const rangeLabel = maxInstallments >= 3 ? `2x a ${maxInstallments}x` : "2x";
    doc.text(`No crédito — ${rangeLabel}`, marginX, py);
    py += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const parcelaStartY = py;
    for (let n = 2; n <= maxInstallments; n++) {
      const yy = parcelaStartY + (n - 2) * 5.6;
      doc.setTextColor(...GRAY);
      doc.text(`${n}x`, marginX, yy);
      doc.setTextColor(40, 40, 40);
      doc.text(brl(installmentValueFor(totalPrazo, n)), marginX + 11, yy);
      const comJuros = hasInterest(totalPrazo, n);
      doc.setFontSize(8);
      if (comJuros) doc.setTextColor(180, 110, 20);
      else doc.setTextColor(30, 130, 70);
      const tag = comJuros
        ? `com juros (total ${brl(creditTotalFor(totalPrazo, n))})`
        : "sem juros";
      doc.text(tag, marginX + 40, yy);
      doc.setFontSize(9.5);
    }
  }

  // ---------- Rodapé ----------
  const freightNote =
    "O frete é um serviço terceirizado, realizado por transportadora, que tem como " +
    "protocolo de segurança a entrega na portaria do prédio e condomínio " +
    "ou no portão de sua casa, não realizando entregas na porta ou dentro de sua residência.";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  const freightLines = doc.splitTextToSize(freightNote, pageW - marginX * 2);
  const freightLineH = 3;
  const freightHeight = freightLines.length * freightLineH;

  const validityY = pageH - 8;
  const freightTop = validityY - 5 - freightHeight;
  const dividerY = freightTop - 3.5;

  const drawFooter = () => {
    doc.setDrawColor(230, 230, 230);
    doc.line(marginX, dividerY, pageW - marginX, dividerY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(freightLines, marginX, freightTop);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DARK_SOFT);
    doc.text("Validade do orçamento: 3 dias úteis.", marginX, validityY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text("Inphantil Móveis  ·  inphantil.com.br", pageW - marginX, validityY, {
      align: "right",
    });
  };

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter();
  }

  doc.save(`orcamento-${quote.number}.pdf`);
}
