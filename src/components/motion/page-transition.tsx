"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Transição de entrada de página. Usada em `template.tsx` — como o Next
 * remonta o template a cada navegação, a animação dispara em toda troca
 * de rota.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
