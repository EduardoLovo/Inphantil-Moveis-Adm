import type { Metadata } from "next";

import { CamaComposer } from "@/components/cama/cama-composer";
import { listPaletaComposicao } from "@/lib/cores-server";

export const metadata: Metadata = { title: "Cama" };
export const dynamic = "force-dynamic";

export default async function CamaPage() {
  const cores = await listPaletaComposicao();
  return <CamaComposer cores={cores} />;
}
