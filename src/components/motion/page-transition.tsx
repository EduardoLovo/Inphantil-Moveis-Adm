"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Transição de entrada de página. Usada em `template.tsx` — como o Next
 * remonta o template a cada navegação, a animação dispara em toda troca
 * de rota. `className` permite, por exemplo, esticar o wrapper (flex) para
 * que a página preencha a altura disponível.
 */
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
