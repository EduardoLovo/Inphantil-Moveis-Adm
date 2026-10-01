"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Indicador global de carregamento.
 *
 * Observa as requisições ao servidor feitas pelo app (navegação do Next,
 * Server Actions como salvar/excluir, login e rotas /api, como downloads)
 * e só aparece quando a espera passa de um limite:
 *   - BAR_DELAY: barra fina no topo;
 *   - OVERLAY_DELAY: cartão central com o elefantinho (bloqueia cliques
 *     para evitar envio duplo).
 * Tarefas só do navegador (ex.: gerar PDF) podem usar `trackLoading`.
 */

const BAR_DELAY = 200;
const OVERLAY_DELAY = 700;

// ─── Contador de operações em andamento ───────────────────────

let inflight = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function begin() {
  inflight++;
  emit();
}
function end() {
  inflight = Math.max(0, inflight - 1);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Mostra o indicador enquanto a promessa não termina. */
export async function trackLoading<T>(promise: Promise<T>): Promise<T> {
  begin();
  try {
    return await promise;
  } finally {
    end();
  }
}

// ─── Interceptação do fetch ───────────────────────────────────

function headersOf(input: RequestInfo | URL, init?: RequestInit) {
  const h = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init?.headers).forEach((v, k) => h.set(k, v));
  return h;
}

/** Só requisições do próprio app que o usuário está esperando. */
function shouldTrack(input: RequestInfo | URL, init?: RequestInit): boolean {
  const url = new URL(
    input instanceof Request ? input.url : String(input),
    window.location.href,
  );
  if (url.origin !== window.location.origin) return false;

  const h = headersOf(input, init);
  if (h.has("next-router-prefetch")) return false; // prefetch em segundo plano
  if (h.has("next-action")) return true; // Server Actions (salvar, excluir…)
  if (h.has("rsc")) return true; // navegação / router.refresh()
  return url.pathname.startsWith("/api/") && url.pathname !== "/api/auth/session";
}

/** Lê uma cópia da resposta até o fim (o conteúdo chega em streaming). */
async function drain(res: Response) {
  const reader = res.body?.getReader();
  if (!reader) return;
  try {
    while (!(await reader.read()).done) {
      /* só consome */
    }
  } catch {
    /* requisição cancelada */
  }
}

let installed = false;
function installFetchTracker() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let tracked = false;
    try {
      tracked = shouldTrack(input, init);
    } catch {
      tracked = false;
    }
    if (!tracked) return originalFetch(input, init);

    begin();
    try {
      const res = await originalFetch(input, init);
      // Termina quando o corpo inteiro chegar, não só o cabeçalho.
      void drain(res.clone()).finally(end);
      return res;
    } catch (err) {
      end();
      throw err;
    }
  };
}

// ─── UI ───────────────────────────────────────────────────────

export function GlobalLoading() {
  const busy = React.useSyncExternalStore(
    subscribe,
    () => inflight > 0,
    () => false,
  );
  const [phase, setPhase] = React.useState<"idle" | "bar" | "overlay">("idle");

  React.useEffect(installFetchTracker, []);

  React.useEffect(() => {
    if (!busy) {
      const t = setTimeout(() => setPhase("idle"), 0);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setPhase("bar"), BAR_DELAY);
    const t2 = setTimeout(() => setPhase("overlay"), OVERLAY_DELAY);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [busy]);

  return (
    <>
      <TopBar active={phase !== "idle"} />
      <AnimatePresence>{phase === "overlay" && <LoadingOverlay />}</AnimatePresence>
    </>
  );
}

/** Barra no topo: avança devagar enquanto espera e completa ao terminar. */
function TopBar({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="bar"
          className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25, delay: 0.2 } }}
        >
          <motion.div
            className="h-full origin-left rounded-r-full bg-gradient-to-r from-primary via-amber-400 to-primary shadow-[0_0_10px_var(--primary)]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 0.85, transition: { duration: 6, ease: [0.1, 0.6, 0.2, 1] } }}
            exit={{ scaleX: 1, transition: { duration: 0.2 } }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LoadingOverlay() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="fixed inset-0 z-[90] grid place-items-center bg-background/45 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      role="status"
      aria-live="polite"
      aria-label="Carregando"
    >
      <motion.div
        className="flex flex-col items-center gap-4 rounded-3xl border bg-card px-9 py-7 shadow-2xl"
        initial={{ scale: 0.92, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
      >
        <div className="relative grid size-20 place-items-center">
          {/* anel girando na cor da marca */}
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, var(--primary) 270deg, transparent 360deg)",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))",
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))",
            }}
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 1, ease: "linear", repeat: Infinity }}
          />
          <span className="grid size-14 place-items-center rounded-2xl bg-neutral-900 shadow-md">
            <motion.span
              animate={reduce ? undefined : { y: [0, -3, 0] }}
              transition={{ duration: 0.9, ease: "easeInOut", repeat: Infinity }}
            >
              <Image
                src="/logo.png"
                alt=""
                width={40}
                height={28}
                unoptimized
                priority
                className="h-auto w-10"
              />
            </motion.span>
          </span>
        </div>

        <p className="flex items-baseline text-sm font-semibold text-muted-foreground">
          Carregando
          <span className="ml-0.5 inline-flex w-4">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                animate={reduce ? undefined : { opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              >
                .
              </motion.span>
            ))}
          </span>
        </p>
      </motion.div>
    </motion.div>
  );
}
