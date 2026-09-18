import type { Metadata } from "next";
import { BedDouble } from "lucide-react";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Cama" };

export default function CamaPage() {
  return (
    <ComingSoon
      title="Composição de cama"
      description="Em breve você poderá montar a composição de camas por aqui."
      icon={<BedDouble />}
    />
  );
}
