import type { Metadata } from "next";
import { Rows3 } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Tapete" };

export default function TapetePage() {
  return (
    <ComingSoon
      icon={<Rows3 className="size-9" />}
      title="Tapete"
      description="A composição de tapetes ganhará vida aqui em breve."
    />
  );
}
