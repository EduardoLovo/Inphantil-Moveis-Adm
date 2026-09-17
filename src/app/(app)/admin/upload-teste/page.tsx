import type { Metadata } from "next";
import { Role } from "@prisma/client";

import { PageHeader } from "@/components/page-header";
import { guardPage } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { UploadTesteClient, type ImageRow } from "./upload-teste-client";

export const metadata: Metadata = { title: "Teste de upload" };
export const dynamic = "force-dynamic";

export default async function UploadTestePage() {
  await guardPage([Role.DEV, Role.ADMIN]);

  const images = await prisma.image.findMany({
    orderBy: { createdAt: "desc" },
  });

  const rows: ImageRow[] = images.map((i) => ({
    id: i.id,
    url: i.url,
    publicId: i.publicId,
    createdAt: i.createdAt.toISOString(),
  }));

  return (
    <div>
      <PageHeader
        title="Teste de upload"
        description="Comprova o ciclo de vida: enviar → substituir (a antiga some do Cloudinary) → excluir (some do Cloudinary)."
      />
      <UploadTesteClient images={rows} />
    </div>
  );
}
