import type { Metadata } from "next";

import { CamaComposer } from "@/components/cama/cama-composer";

export const metadata: Metadata = { title: "Cama" };

export default function CamaPage() {
  return <CamaComposer />;
}
