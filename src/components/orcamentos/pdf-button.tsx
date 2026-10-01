"use client";

import * as React from "react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";
import type { QuoteFull } from "@/lib/quote";
import { getQuotePdfData } from "@/app/(app)/orcamentos/actions";
import { trackLoading } from "@/components/feedback/global-loading";

/** Gera o PDF do orçamento. Aceita os dados completos ou apenas o id
 *  (nesse caso busca via Server Action antes de gerar). */
export function PdfButton({
  quote,
  quoteId,
  label = "PDF",
  variant = "outline",
  size = "sm",
  iconOnly = false,
}: {
  quote?: QuoteFull;
  quoteId?: number;
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  /** Só o ícone (ex.: coluna de ações da lista). */
  iconOnly?: boolean;
}) {
  const [loading, setLoading] = React.useState(false);

  async function go() {
    setLoading(true);
    try {
      let data = quote;
      if (!data && quoteId != null) {
        const res = await getQuotePdfData(quoteId);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        data = res.quote;
      }
      if (!data) return;
      const { generateQuotePdf } = await import("@/lib/quote-pdf");
      await trackLoading(generateQuotePdf(data));
    } catch {
      toast.error("Não foi possível gerar o PDF.");
    } finally {
      setLoading(false);
    }
  }

  const icon = loading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />;

  if (iconOnly) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={go}
        disabled={loading}
        aria-label="Baixar PDF"
        title="Baixar PDF"
        className="size-9 text-muted-foreground"
      >
        {icon}
      </Button>
    );
  }

  return (
    <Button variant={variant} size={size} onClick={go} disabled={loading}>
      {icon}
      {label}
    </Button>
  );
}
