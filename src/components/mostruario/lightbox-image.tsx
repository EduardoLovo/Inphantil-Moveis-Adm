"use client";

import * as React from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  animate,
} from "framer-motion";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

const MIN = 1;
const MAX = 5;
const clamp = (v: number) => Math.min(MAX, Math.max(MIN, v));

/**
 * Miniatura do mostruário que abre um lightbox com zoom ao ser clicada.
 * Zoom por roda do mouse, duplo-clique ou botões; quando ampliada, é
 * possível arrastar para navegar (pan). Fecha no X, no fundo ou com Esc.
 */
export function LightboxImage({
  src,
  alt,
  sizes,
  className,
}: {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ampliar imagem ${alt}`}
        className="absolute inset-0 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Image src={src} alt={alt} fill sizes={sizes} className={className} />
      </button>

      <Lightbox open={open} onClose={() => setOpen(false)} src={src} alt={alt} />
    </>
  );
}

function Lightbox({
  open,
  onClose,
  src,
  alt,
}: {
  open: boolean;
  onClose: () => void;
  src: string;
  alt: string;
}) {
  const [mounted, setMounted] = React.useState(false);
  const [zoomed, setZoomed] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const scale = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Portal só no cliente (evita usar document.body no SSR).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), []);

  const spring = { type: "spring" as const, stiffness: 260, damping: 30 };

  const applyScale = React.useCallback(
    (target: number) => {
      const t = clamp(target);
      animate(scale, t, spring);
      setZoomed(t > 1);
      if (t <= 1) {
        animate(x, 0, spring);
        animate(y, 0, spring);
      }
    },
    // motion values are stable refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Reset ao abrir/fechar.
  React.useEffect(() => {
    if (open) {
      scale.set(1);
      x.set(0);
      y.set(0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setZoomed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Trava o scroll do body enquanto aberto.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc para fechar.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Zoom pela roda do mouse (listener nativo p/ poder previnir o scroll).
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || !open) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      applyScale(scale.get() * factor);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open, applyScale, scale]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/85 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          {/* Controles */}
          <div
            className="absolute right-3 top-3 z-10 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <ControlButton
              label="Diminuir zoom"
              onClick={() => applyScale(scale.get() - 0.5)}
            >
              <ZoomOut className="size-5" />
            </ControlButton>
            <ControlButton
              label="Aumentar zoom"
              onClick={() => applyScale(scale.get() + 0.5)}
            >
              <ZoomIn className="size-5" />
            </ControlButton>
            <ControlButton label="Redefinir" onClick={() => applyScale(1)}>
              <RotateCcw className="size-5" />
            </ControlButton>
            <ControlButton label="Fechar" onClick={onClose}>
              <X className="size-5" />
            </ControlButton>
          </div>

          <motion.img
            src={src}
            alt={alt}
            draggable={false}
            drag={zoomed}
            dragConstraints={containerRef}
            dragElastic={0.12}
            style={{ x, y, scale, touchAction: "none" }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={() => applyScale(zoomed ? 1 : 2.5)}
            className="max-h-[90vh] max-w-[92vw] select-none rounded-lg object-contain shadow-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-label={alt}
          />

          <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-xs text-white/70">
            Role para dar zoom · arraste para mover · duplo-clique aproxima
          </p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
    >
      {children}
    </button>
  );
}
