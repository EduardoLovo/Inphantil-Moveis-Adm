import "server-only";

import { listKeys, safeDestroy } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

export type CleanupReport = {
  orphansRetried: number;
  orphansResolved: number;
  unreferencedScanned: number;
  unreferencedRemoved: number;
};

/**
 * Rotina administrativa de limpeza (mesmo conceito do media-cleanup da
 * Inphantil). Duas frentes:
 *  1) Retenta apagar os OrphanImage pendentes (deletes que falharam).
 *  2) Varre o bucket do R2 e remove objetos que NÃO têm mais referência
 *     na tabela Image.
 */
export async function runMediaCleanup(): Promise<CleanupReport> {
  const report: CleanupReport = {
    orphansRetried: 0,
    orphansResolved: 0,
    unreferencedScanned: 0,
    unreferencedRemoved: 0,
  };

  // 1) Retry dos pendentes
  const pending = await prisma.orphanImage.findMany({
    where: { resolvedAt: null },
    take: 500,
  });
  for (const orphan of pending) {
    report.orphansRetried++;
    const ok = await safeDestroy(orphan.key, "retry limpeza");
    if (ok) {
      await prisma.orphanImage.update({
        where: { id: orphan.id },
        data: { resolvedAt: new Date() },
      });
      report.orphansResolved++;
    }
  }

  // 2) Varredura de não-referenciados no bucket
  const referenced = new Set(
    (await prisma.image.findMany({ select: { key: true } })).map((i) => i.key),
  );

  const keys = await listKeys();
  for (const key of keys) {
    report.unreferencedScanned++;
    if (!referenced.has(key)) {
      const ok = await safeDestroy(key, "não referenciado");
      if (ok) report.unreferencedRemoved++;
    }
  }

  return report;
}
