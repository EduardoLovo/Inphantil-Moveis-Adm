import type { Metadata } from "next";
import { ShieldHalf } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Protetor de parede" };

export default function ProtetorParedePage() {
  return (
    <ComingSoon
      icon={<ShieldHalf className="size-9" />}
      title="Protetor de parede"
      description="A composição de protetores de parede será construída neste espaço."
    />
  );
}
