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
const GREEN: [number, number, number] = [28, 36, 25]; // #1c2419
const GREEN_SOFT: [number, number, number] = [49, 59, 47]; // #313b2f
const YELLOW: [number, number, number] = [255, 214, 57]; // #ffd639
const GRAY: [number, number, number] = [120, 120, 120];

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
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageW, 40, "F");

  const logo = await loadImageAsDataURL("/logo2.png");
  if (logo) {
    try {
      doc.addImage(logo, "PNG", marginX, 8, 18, 18);
    } catch {
      /* ignora logo inválida */
    }
  }

  const textX = logo ? marginX + 24 : marginX;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("INPHANTIL MÓVEIS", textX, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 214, 57);
  doc.text("CNPJ 03.761.683/0001-98", textX, 21);
  doc.setTextColor(220, 220, 220);
  doc.text("WhatsApp (61) 98238-8828  ·  sac@inphantil.com.br", textX, 26);
  doc.setFontSize(8);
  doc.text("Rua Armando da Silva 515 - Jardim Rebouças", textX, 30.5);

  const dataStr = new Date(quote.createdAt).toLocaleDateString("pt-BR");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(quote.number, pageW - marginX, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(220, 220, 220);
  doc.text(`Data: ${dataStr}`, pageW - marginX, 20, { align: "right" });

  // ---------- Título ----------
  let y = 50;
  doc.setTextColor(...GREEN_SOFT);
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
      fillColor: GREEN_SOFT,
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
  doc.setFillColor(...GREEN);
  doc.rect(boxX, ly - 1, boxW, 11, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TOTAL", boxX + 4, ly + 6.5);
  doc.setTextColor(...YELLOW);
  doc.text(brl(totalPrazo), boxX + boxW - 4, ly + 6.5, { align: "right" });

  // Formas de pagamento (esquerda)
  doc.setTextColor(...GREEN_SOFT);
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
  doc.setTextColor(...GREEN_SOFT);
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
  doc.setTextColor(...GREEN_SOFT);
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
    doc.setTextColor(...GREEN_SOFT);
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
    doc.setTextColor(...GREEN_SOFT);
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
