import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Orçamentos" };

export default function OrcamentosPage() {
  return (
    <ComingSoon
      icon={<FileText className="size-9" />}
      title="Orçamentos"
      description="A geração e o acompanhamento de orçamentos entram em breve."
    />
  );
}
