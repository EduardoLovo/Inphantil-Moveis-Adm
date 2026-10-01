import "server-only";
import { NextResponse } from "next/server";
import type ExcelJS from "exceljs";

// Helpers de planilha (.xlsx) com o visual padrão dos relatórios.

export const TZ = "America/Sao_Paulo";

const HEADER_FILL = "FF5C5C5C"; // mesmo cinza do PDF
const MONEY_FMT = '"R$" #,##0.00';

export type XlsxColumn = {
  header: string;
  key: string;
  width: number;
  money?: boolean;
  align?: "left" | "center" | "right";
};

export type XlsxRow = Record<string, string | number | null | undefined>;

/** Data no fuso de Brasília (dd/mm/aaaa). */
export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("pt-BR", { timeZone: TZ });

/** Data e hora no fuso de Brasília (dd/mm/aaaa hh:mm). */
export const fmtDateTime = (d: Date | string) =>
  new Date(d).toLocaleString("pt-BR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" });

/** Nome de aba válido no Excel (máx. 31, sem []:*?/\) e único no arquivo. */
export function sheetName(wb: ExcelJS.Workbook, raw: string): string {
  const base = (raw.replace(/[[\]:*?/\\]/g, " ").trim() || "Planilha").slice(0, 31);
  let name = base;
  for (let i = 2; wb.getWorksheet(name); i++) {
    const suffix = ` (${i})`;
    name = base.slice(0, 31 - suffix.length) + suffix;
  }
  return name;
}

/**
 * Escreve uma tabela com título, subtítulo, cabeçalho estilizado, filtros,
 * cabeçalho congelado e, opcionalmente, uma linha de totais.
 */
export function writeTable(
  ws: ExcelJS.Worksheet,
  opts: {
    title: string;
    subtitle?: string;
    columns: XlsxColumn[];
    rows: XlsxRow[];
    totals?: XlsxRow;
    emptyMessage?: string;
  },
) {
  const { columns, rows } = opts;

  ws.getCell(1, 1).value = opts.title;
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  ws.getCell(2, 1).value = opts.subtitle ?? `Gerado em ${fmtDateTime(new Date())}`;
  ws.getCell(2, 1).font = { color: { argb: "FF777777" }, size: 10 };

  const headerRow = 4;
  columns.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.width;
    const cell = ws.getCell(headerRow, i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: "middle", horizontal: c.align ?? (c.money ? "right" : "left") };
  });
  ws.getRow(headerRow).height = 22;

  const addRow = (data: XlsxRow) => {
    const row = ws.addRow(columns.map((c) => data[c.key] ?? ""));
    columns.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      if (c.money) cell.numFmt = MONEY_FMT;
      if (c.align) cell.alignment = { horizontal: c.align };
    });
    return row;
  };

  if (rows.length === 0) {
    ws.getCell(headerRow + 1, 1).value = opts.emptyMessage ?? "Nenhum registro.";
    ws.getCell(headerRow + 1, 1).font = { italic: true, color: { argb: "FF777777" } };
  } else {
    rows.forEach(addRow);
    ws.autoFilter = {
      from: { row: headerRow, column: 1 },
      to: { row: headerRow + rows.length, column: columns.length },
    };
    if (opts.totals) {
      const row = addRow(opts.totals);
      row.font = { bold: true };
      row.eachCell((cell) => {
        cell.border = { top: { style: "thin", color: { argb: "FF5C5C5C" } } };
      });
    }
  }

  ws.views = [{ state: "frozen", ySplit: headerRow }];
}

/** Resposta HTTP de download do arquivo .xlsx. */
export async function xlsxResponse(wb: ExcelJS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
