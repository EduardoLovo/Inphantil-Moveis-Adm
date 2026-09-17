import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { Role } from "@prisma/client";

import { getCurrentUser, hasRole } from "@/lib/rbac";
import { listShippingFull } from "@/lib/shipping-server";
import type { ShippingStatus } from "@/lib/shipping";

export const dynamic = "force-dynamic";

const yn = (b: boolean) => (b ? "Sim" : "Não");

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

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Fretes");
  ws.columns = [
    { header: "Nº", key: "number", width: 12 },
    { header: "Data", key: "createdAt", width: 12 },
    { header: "Solicitante", key: "createdByName", width: 20 },
    { header: "Cliente", key: "customerName", width: 22 },
    { header: "CPF", key: "customerCpf", width: 16 },
    { header: "CEP", key: "customerZipCode", width: 12 },
    { header: "Cidade", key: "customerCity", width: 18 },
    { header: "UF", key: "customerState", width: 6 },
    { header: "Detalhes", key: "quoteDetails", width: 30 },
    { header: "Transportadora", key: "carrierName", width: 20 },
    { header: "Volumes", key: "volumeQuantity", width: 10 },
    { header: "Peso", key: "weight", width: 10 },
    { header: "Valor frete", key: "shippingValue", width: 14 },
    { header: "Valor pedido", key: "orderValue", width: 14 },
    { header: "Prazo", key: "deliveryDeadline", width: 14 },
    { header: "Protetor", key: "wallProtector", width: 18 },
    { header: "Tapete", key: "rug", width: 16 },
    { header: "Acessórios", key: "accessories", width: 12 },
    { header: "Cama", key: "bedSize", width: 16 },
    { header: "Solicitado", key: "isRequested", width: 10 },
    { header: "Concluído", key: "isConcluded", width: 10 },
    { header: "Observações", key: "adminNotes", width: 30 },
  ];
  ws.getRow(1).font = { bold: true };

  for (const r of rows) {
    ws.addRow({
      number: r.number,
      createdAt: new Date(r.createdAt).toLocaleDateString("pt-BR"),
      createdByName: r.createdByName,
      customerName: r.customerName ?? "",
      customerCpf: r.customerCpf ?? "",
      customerZipCode: r.customerZipCode ?? "",
      customerCity: r.customerCity ?? "",
      customerState: r.customerState ?? "",
      quoteDetails: r.quoteDetails ?? "",
      carrierName: r.carrierName ?? "",
      volumeQuantity: r.volumeQuantity ?? "",
      weight: r.weight ?? "",
      shippingValue: r.shippingValue ?? "",
      orderValue: r.orderValue ?? "",
      deliveryDeadline: r.deliveryDeadline ?? "",
      wallProtector: r.hasWallProtector ? `${yn(true)} ${r.wallProtectorSize ?? ""}`.trim() : "Não",
      rug: r.hasRug ? `${yn(true)} ${r.rugSize ?? ""}`.trim() : "Não",
      accessories: r.hasAccessories ? `${r.accessoryQuantity ?? ""}`.trim() || "Sim" : "Não",
      bedSize: r.bedSize ?? "",
      isRequested: yn(r.isRequested),
      isConcluded: yn(r.isConcluded),
      adminNotes: r.adminNotes ?? "",
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="fretes-${stamp}.xlsx"`,
    },
  });
}
