"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CalendarRange,
  Download,
  FileText,
  Loader2,
  Package,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isoToBR = (iso: string) => iso.split("-").reverse().join("/");

/** "2026-02" → primeiro e último dia do mês, conforme o calendário. */
function monthRange(month: string): { from: string; to: string } | null {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return null;
  const lastDay = new Date(y, m, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${pad(lastDay)}` };
}

/** Baixa o arquivo via fetch para poder mostrar erros e carregamento. */
async function download(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Não foi possível gerar o relatório.");
  }
  const blob = await res.blob();
  const name =
    /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? "relatorio.xlsx";
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
  URL.revokeObjectURL(href);
}

export function ReportsClient() {
  const today = new Date();
  const [mode, setMode] = React.useState<"mes" | "periodo">("mes");
  const [month, setMonth] = React.useState(`${today.getFullYear()}-${pad(today.getMonth() + 1)}`);
  const [from, setFrom] = React.useState(isoDate(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [to, setTo] = React.useState(isoDate(today));
  const [busy, setBusy] = React.useState<string | null>(null);

  const range = mode === "mes" ? monthRange(month) : from && to ? { from, to } : null;
  const rangeError = !range
    ? "Escolha o período."
    : range.from > range.to
      ? "A data inicial é maior que a final."
      : null;

  async function run(key: string, url: string) {
    setBusy(key);
    try {
      await download(url);
      toast.success("Relatório gerado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível gerar o relatório.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {/* Orçamentos — ocupa a largura toda */}
      <ReportCard
        index={0}
        className="md:col-span-2"
        icon={FileText}
        title="Orçamentos por vendedora"
        description="Uma aba de resumo com os totais de cada vendedora e uma aba por vendedora com os orçamentos do período."
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Filtrar por
            </p>
            <div className="inline-flex rounded-xl border bg-muted/50 p-1">
              {(
                [
                  ["mes", "Mês", CalendarDays],
                  ["periodo", "Período", CalendarRange],
                ] as const
              ).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={cn(
                    "relative flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-colors",
                    mode === value ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {mode === value && (
                    <motion.span
                      layoutId="report-mode"
                      className="absolute inset-0 rounded-lg bg-primary shadow-sm"
                      transition={{ type: "spring", stiffness: 500, damping: 36 }}
                    />
                  )}
                  <Icon className="relative size-4" />
                  <span className="relative">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {mode === "mes" ? (
            <DateField label="Mês">
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="h-11 w-48" />
            </DateField>
          ) : (
            <div className="flex flex-wrap gap-3">
              <DateField label="De">
                <Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="h-11 w-44" />
              </DateField>
              <DateField label="Até">
                <Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="h-11 w-44" />
              </DateField>
            </div>
          )}

          <Button
            className="h-11 lg:ml-auto"
            disabled={!!rangeError || busy !== null}
            onClick={() =>
              range && run("orcamentos", `/api/relatorios/orcamentos?from=${range.from}&to=${range.to}`)
            }
          >
            {busy === "orcamentos" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Baixar .xlsx
          </Button>
        </div>
        <p className={cn("mt-3 text-sm", rangeError ? "text-destructive" : "text-muted-foreground")}>
          {rangeError ?? `De ${isoToBR(range!.from)} até ${isoToBR(range!.to)}.`}
        </p>
      </ReportCard>

      <ReportCard
        index={1}
        icon={Truck}
        title="Fretes"
        description="Todas as solicitações de frete, com cliente, transportadora, valores, prazos e status."
      >
        <DownloadButton busy={busy === "fretes"} disabled={busy !== null} onClick={() => run("fretes", "/api/relatorios/fretes")} />
      </ReportCard>

      <ReportCard
        index={2}
        icon={Package}
        title="Produtos cadastrados"
        description="Produtos usados nos orçamentos: SKU, preço, tipo de medida, status e quantas vezes foram orçados."
      >
        <DownloadButton busy={busy === "produtos"} disabled={busy !== null} onClick={() => run("produtos", "/api/relatorios/produtos")} />
      </ReportCard>
    </div>
  );
}

function ReportCard({
  index,
  icon: Icon,
  title,
  description,
  className,
  children,
}: {
  index: number;
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: "easeOut" }}
      className={cn("flex flex-col rounded-2xl border bg-card p-5 shadow-sm", className)}
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Icon className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-auto">{children}</div>
    </motion.section>
  );
}

function DateField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function DownloadButton({
  busy,
  disabled,
  onClick,
}: {
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant="outline" className="h-11 w-full" disabled={disabled} onClick={onClick}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      Baixar .xlsx
    </Button>
  );
}
