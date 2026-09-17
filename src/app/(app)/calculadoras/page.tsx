import type { Metadata } from "next";
import { Calculator } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Calculadoras" };

export default function CalculadorasPage() {
  return (
    <ComingSoon
      icon={<Calculator className="size-9" />}
      title="Calculadoras"
      description="Ferramentas de cálculo para o dia a dia da equipe chegam em breve."
    />
  );
}
