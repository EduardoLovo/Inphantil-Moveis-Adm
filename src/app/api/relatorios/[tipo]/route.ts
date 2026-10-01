import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { getCurrentUser, hasRole } from "@/lib/rbac";
import { listShippingFull } from "@/lib/shipping-server";
import {
  buildFretesWorkbook,
  buildOrcamentosWorkbook,
  buildProdutosWorkbook,
  todayStamp,
} from "@/lib/reports-server";
import { xlsxResponse } from "@/lib/xlsx-server";

export const dynamic = "force-dynamic";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isValidDate = (s: string | null): s is string =>
  !!s && ISO_DATE.test(s) && !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime());

/** Download de relatórios .xlsx — somente DEV/ADMIN. */
export async function GET(req: Request, { params }: { params: Promise<{ tipo: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!hasRole(user.role, [Role.DEV, Role.ADMIN])) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { tipo } = await params;
  const stamp = todayStamp();

  switch (tipo) {
    case "fretes": {
      const rows = await listShippingFull(user);
      return xlsxResponse(buildFretesWorkbook(rows), `relatorio-fretes-${stamp}.xlsx`);
    }
    case "produtos": {
      return xlsxResponse(await buildProdutosWorkbook(), `relatorio-produtos-${stamp}.xlsx`);
    }
    case "orcamentos": {
      const sp = new URL(req.url).searchParams;
      const from = sp.get("from");
      const to = sp.get("to");
      if (!isValidDate(from) || !isValidDate(to)) {
        return NextResponse.json({ error: "Informe o período (de/até)." }, { status: 400 });
      }
      if (from > to) {
        return NextResponse.json({ error: "A data inicial é maior que a final." }, { status: 400 });
      }
      const wb = await buildOrcamentosWorkbook(from, to);
      return xlsxResponse(wb, `relatorio-orcamentos-${from}_a_${to}.xlsx`);
    }
    default:
      return NextResponse.json({ error: "Relatório desconhecido." }, { status: 404 });
  }
}
