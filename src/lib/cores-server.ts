import "server-only";

import { prisma } from "@/lib/prisma";
import type { Cor, CorDigitalFull } from "@/lib/cores-composicao";

const SELECT = { id: true, codigo: true, cor: true, hex: true, ativa: true };

// Ordem alfabética por código, com números na ordem natural
// (ex.: AZ1 < AZ3 < AZ10), como nas demais coleções do catálogo.
function porCodigo<T extends { codigo: string }>(rows: T[]): T[] {
  return rows.sort((a, b) =>
    a.codigo.localeCompare(b.codigo, "pt-BR", {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

/** Todas as cores (gestão do catálogo). */
export async function listCoresDigitais(): Promise<CorDigitalFull[]> {
  return porCodigo(await prisma.corDigital.findMany({ select: SELECT }));
}

/** Cores ativas (mostruário público). */
export async function listCoresDigitaisAtivas(): Promise<CorDigitalFull[]> {
  return porCodigo(
    await prisma.corDigital.findMany({ where: { ativa: true }, select: SELECT }),
  );
}

/** Paleta das composições (Protetor, Tapete, Cama): só as ativas. */
export async function listPaletaComposicao(): Promise<Cor[]> {
  return porCodigo(
    await prisma.corDigital.findMany({
      where: { ativa: true },
      select: { codigo: true, hex: true },
    }),
  );
}

export async function countCoresDigitais(scope: "manage" | "public"): Promise<number> {
  return prisma.corDigital.count({
    where: scope === "public" ? { ativa: true } : undefined,
  });
}
