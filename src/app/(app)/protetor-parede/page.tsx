import type { Metadata } from "next";
import { ProtetorComposer } from "@/components/protetor-parede/protetor-composer";

export const metadata: Metadata = { title: "Protetor de parede" };

export default function ProtetorParedePage() {
  return <ProtetorComposer />;
}
