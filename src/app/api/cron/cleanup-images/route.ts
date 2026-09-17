import { NextResponse } from "next/server";
import { runMediaCleanup } from "@/lib/media-cleanup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Rotina de limpeza de imagens órfãs.
 * Protegida por CRON_SECRET (usada pelo Vercel Cron ou chamada manual):
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const report = await runMediaCleanup();
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
