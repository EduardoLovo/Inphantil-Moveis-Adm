import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { FreteHub } from "./frete-hub";

export const metadata: Metadata = { title: "Frete" };

export default function FretePage() {
  return (
    <div>
      <PageHeader
        title="Frete"
        description="Solicite cotações de frete, acompanhe e exporte o relatório."
      />
      <FreteHub />
    </div>
  );
}
