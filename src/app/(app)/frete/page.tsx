import type { Metadata } from "next";
import { Truck } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Frete" };

export default function FretePage() {
  return (
    <ComingSoon
      icon={<Truck className="size-9" />}
      title="Frete"
      description="Solicitação, cotações e pesquisa de frete chegam a esta seção."
    />
  );
}
