import type { Metadata } from "next";
import { ProtetorComposer } from "@/components/protetor-parede/protetor-composer";
import { listPaletaComposicao } from "@/lib/cores-server";

export const metadata: Metadata = { title: "Protetor de parede" };
export const dynamic = "force-dynamic";

export default async function ProtetorParedePage() {
  const cores = await listPaletaComposicao();
  return <ProtetorComposer cores={cores} />;
}
