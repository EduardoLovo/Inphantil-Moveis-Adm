import type { Metadata } from "next";
import { TapeteComposer } from "@/components/tapete/tapete-composer";

export const metadata: Metadata = { title: "Tapete" };

export default function TapetePage() {
  return <TapeteComposer />;
}
