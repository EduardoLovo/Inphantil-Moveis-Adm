import type { Metadata } from "next";

import { collectionBySlug } from "@/lib/catalog";
import { listPublicCollection } from "@/lib/catalog-server";
import { CamaComposer } from "@/components/cama/cama-composer";

export const metadata: Metadata = { title: "Cama" };
export const dynamic = "force-dynamic";

export default async function CamaPage() {
  // Tecidos = sintéticos de "cama" disponíveis (com imagem).
  const collection = collectionBySlug("sinteticos")!;
  const items = await listPublicCollection(collection);
  const fabrics = items
    .filter((i) => i.imageUrl)
    .map((i) => ({
      id: i.id,
      code: i.code,
      color: i.color,
      imageUrl: i.imageUrl as string,
    }));

  return <CamaComposer fabrics={fabrics} />;
}
