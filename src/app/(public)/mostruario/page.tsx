import type { Metadata } from "next";
import { Store } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Mostruário" };

export default function MostruarioPage() {
  return (
    <ComingSoon
      icon={<Store className="size-9" />}
      title="Mostruário"
      description="Em breve nossa vitrine de produtos aparece aqui — sem carrinho, só para inspirar."
    />
  );
}
