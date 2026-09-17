"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** Placeholder animado "Em breve" para as seções ainda não implementadas.
 *  O `icon` é um nó já renderizado (evita passar função Server→Client). */
export function ComingSoon({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-md text-center"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto mb-6 grid size-20 place-items-center rounded-3xl bg-primary/12 text-primary [&_svg]:size-9"
        >
          {icon ?? <Sparkles className="size-9" />}
        </motion.div>
        <Badge variant="secondary" className="mb-3">
          Em breve
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-2 text-muted-foreground">{description}</p>
        )}
      </motion.div>
    </div>
  );
}
