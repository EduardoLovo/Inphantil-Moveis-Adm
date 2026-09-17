"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

type P = { x: number; y: number; vx: number; vy: number; r: number; c: string };

// Paleta Inphantil em componentes RGB (para o canvas).
const YELLOW = "246, 201, 69"; // #f6c945
const GRAY = "138, 141, 143"; // #8a8d8f
const GOLD = "224, 167, 42"; // gold escuro (bom no fundo claro)
const LIGHTGRAY = "217, 217, 214"; // #d9d9d6

/**
 * Fundo de "constelação" desenhado em canvas puro (sem biblioteca).
 * Partículas flutuam e se conectam por linhas; perto do cursor elas se
 * ligam a ele e o campo faz um leve parallax seguindo o mouse.
 * Cores adaptadas ao tema (claro/escuro). Respeita prefers-reduced-motion.
 */
export function ConstellationField({
  className = "pointer-events-none absolute inset-0 h-full w-full",
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const context = canvasEl.getContext("2d");
    if (!context) return;
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = context;

    const isDark = resolvedTheme !== "light";
    // No escuro, pontos amarelos brilham; no claro, grafite + toques dourados.
    const colorA = isDark ? YELLOW : GRAY;
    const colorB = isDark ? LIGHTGRAY : GOLD;
    const linkColor = isDark ? YELLOW : GRAY;
    const mouseColor = isDark ? YELLOW : GOLD;
    const linkBase = isDark ? 0.22 : 0.16;
    const mouseBase = isDark ? 0.5 : 0.4;
    const dotAlpha = isDark ? 0.9 : 0.75;
    const glow = isDark ? 8 : 0;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let particles: P[] = [];
    const mouse = { x: -9999, y: -9999, active: false };
    const offset = { x: 0, y: 0 };
    let raf = 0;

    const LINK_DIST = 130;
    const MOUSE_DIST = 170;

    function build() {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(80, Math.max(24, Math.floor((w * h) / 16000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.32,
        vy: (Math.random() - 0.5) * 0.32,
        r: Math.random() * 1.6 + 0.8,
        c: Math.random() > 0.5 ? colorA : colorB,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      const tx = mouse.active ? (mouse.x - w / 2) * 0.02 : 0;
      const ty = mouse.active ? (mouse.y - h / 2) * 0.02 : 0;
      offset.x += (tx - offset.x) * 0.06;
      offset.y += (ty - offset.y) * 0.06;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      }

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const ax = a.x + offset.x;
        const ay = a.y + offset.y;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < LINK_DIST) {
            const alpha = (1 - d / LINK_DIST) * linkBase;
            ctx.strokeStyle = `rgba(${linkColor}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(b.x + offset.x, b.y + offset.y);
            ctx.stroke();
          }
        }

        if (mouse.active) {
          const dx = a.x - mouse.x;
          const dy = a.y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < MOUSE_DIST) {
            const alpha = (1 - d / MOUSE_DIST) * mouseBase;
            ctx.strokeStyle = `rgba(${mouseColor}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.c}, ${dotAlpha})`;
        ctx.shadowColor = `rgba(${p.c}, ${dotAlpha})`;
        ctx.shadowBlur = glow;
        ctx.arc(p.x + offset.x, p.y + offset.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    }

    function onMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active =
        mouse.x >= 0 && mouse.y >= 0 && mouse.x <= w && mouse.y <= h;
    }
    function onLeave() {
      mouse.active = false;
    }

    build();

    if (reduced) {
      draw();
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(draw);
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseout", onLeave);
    }

    const ro = new ResizeObserver(() => build());
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      ro.disconnect();
    };
  }, [resolvedTheme]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
