import "server-only";

import { cloudinary, safeDestroy } from "@/lib/cloudinary";
import { cloudinaryEnv } from "@/lib/env";
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
 *  1) Retenta destruir os OrphanImage pendentes (destroys que falharam).
 *  2) Varre a pasta do Cloudinary e remove assets que NÃO têm mais
 *     referência na tabela Image.
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
    const ok = await safeDestroy(orphan.publicId, "retry limpeza");
    if (ok) {
      await prisma.orphanImage.update({
        where: { id: orphan.id },
        data: { resolvedAt: new Date() },
      });
      report.orphansResolved++;
    }
  }

  // 2) Varredura de não-referenciados na pasta
  const { folder } = cloudinaryEnv();
  const referenced = new Set(
    (await prisma.image.findMany({ select: { publicId: true } })).map(
      (i) => i.publicId,
    ),
  );

  let nextCursor: string | undefined;
  do {
    const res = await cloudinary.api.resources({
      type: "upload",
      prefix: folder,
      max_results: 200,
      next_cursor: nextCursor,
    });
    for (const asset of res.resources ?? []) {
      report.unreferencedScanned++;
      if (!referenced.has(asset.public_id)) {
        const ok = await safeDestroy(asset.public_id, "não referenciado");
        if (ok) report.unreferencedRemoved++;
      }
    }
    nextCursor = res.next_cursor;
  } while (nextCursor);

  return report;
}
