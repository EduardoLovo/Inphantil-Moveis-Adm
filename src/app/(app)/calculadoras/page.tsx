import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { CalculadorasHub } from "./calculadoras-hub";

export const metadata: Metadata = { title: "Calculadoras" };

export default function CalculadorasPage() {
  return (
    <div>
      <PageHeader
        title="Calculadoras"
        description="Ferramentas de cálculo do dia a dia da produção e das vendas."
      />
      <CalculadorasHub />
    </div>
  );
}
