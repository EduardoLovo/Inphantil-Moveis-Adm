"use client";

import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TriangleAlert, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatCentsInput } from "@/lib/calc";

/** Cabeçalho branded de cada calculadora. */
export function CalcHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 flex items-center gap-4 rounded-2xl border bg-card px-5 py-4 shadow-sm">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Icon className="size-5" />
      </span>
      <div>
        <h1 className="text-lg font-extrabold tracking-tight">{title}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

/** Campo numérico estilo "centavos" (dígitos → 1,50) com prefixo/sufixo. */
export function CentsField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  placeholder = "0,00",
  className,
}: {
  label: string;
  value: string;
  onChange: (formatted: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex h-full flex-col", className)}>
      <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">
        {label}
      </Label>
      <div className="relative mt-auto">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(formatCentsInput(e.target.value))}
          placeholder={placeholder}
          required
          className={cn(
            "h-12 w-full rounded-xl border border-input bg-background text-lg font-bold text-foreground shadow-sm transition-all placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            prefix ? "pl-10" : "pl-4",
            suffix ? "pr-10" : "pr-4",
          )}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export type RowTone = "default" | "primary";

/** Linha de resultado (label + valor). */
export function ResultRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: RowTone;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border px-4 py-3",
        tone === "primary"
          ? "border-primary/30 bg-primary/10"
          : "border-border bg-muted/40",
      )}
    >
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <strong
        className={cn(
          "text-sm font-black tabular-nums",
          tone === "primary" ? "text-foreground" : "text-foreground",
        )}
      >
        {value}
      </strong>
    </div>
  );
}

/** Mensagem de erro de validação. */
export function CalcError({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-3 overflow-hidden rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
        >
          <TriangleAlert className="size-4 shrink-0" /> {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Painel de resultado com animação de entrada + stagger dos filhos. */
export function ResultPanel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="space-y-4 p-6">
        <div className="flex items-center gap-2 border-b pb-4">
          <Icon className="size-4 text-primary" />
          <h3 className="font-extrabold tracking-tight">{title}</h3>
        </div>
        <motion.div
          className="space-y-2"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {children}
        </motion.div>
      </Card>
    </motion.div>
  );
}

/** Item animável dentro do ResultPanel. */
export function ResultItem({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 },
      }}
    >
      {children}
    </motion.div>
  );
}
