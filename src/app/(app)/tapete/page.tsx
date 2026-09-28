import type { Metadata } from "next";
import { TapeteComposer } from "@/components/tapete/tapete-composer";
import { listPaletaComposicao } from "@/lib/cores-server";

export const metadata: Metadata = { title: "Tapete" };
export const dynamic = "force-dynamic";

export default async function TapetePage() {
  const cores = await listPaletaComposicao();
  return <TapeteComposer cores={cores} />;
}
