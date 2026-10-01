import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { getCurrentUser, hasRole } from "@/lib/rbac";
import { listShippingFull } from "@/lib/shipping-server";
import type { ShippingStatus } from "@/lib/shipping";
import { buildFretesWorkbook, todayStamp } from "@/lib/reports-server";
import { xlsxResponse } from "@/lib/xlsx-server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!hasRole(user.role, [Role.DEV, Role.ADMIN])) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const sp = new URL(req.url).searchParams;
  const rows = await listShippingFull(user, {
    carrier: sp.get("carrier") ?? undefined,
    city: sp.get("city") ?? undefined,
    state: sp.get("state") ?? undefined,
    status: (sp.get("status") as ShippingStatus) ?? undefined,
  });

  return xlsxResponse(buildFretesWorkbook(rows), `fretes-${todayStamp()}.xlsx`);
}
