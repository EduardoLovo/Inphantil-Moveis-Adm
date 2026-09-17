"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/rbac";
import { formatShippingNumber } from "@/lib/shipping";
import {
  createShippingQuoteSchema,
  updateShippingQuoteSchema,
} from "@/lib/validators/shipping-quote";

export type ActionResult = { ok: true } | { ok: false; error: string };
type CreateResult = { ok: true; id: number; number: string } | { ok: false; error: string };

const STAFF = [Role.DEV, Role.ADMIN];

/** Solicitar frete — qualquer usuário logado. */
export async function createShippingQuote(input: unknown): Promise<CreateResult> {
  const user = await requireUser();
  const parsed = createShippingQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  try {
    const created = await prisma.shippingQuote.create({
      data: {
        createdById: user.id,
        quoteDetails: parsed.data.quoteDetails,
        customerName: parsed.data.customerName,
        customerCpf: parsed.data.customerCpf,
        customerZipCode: parsed.data.customerZipCode,
        customerAddress: parsed.data.customerAddress,
        customerCity: parsed.data.customerCity,
        customerState: parsed.data.customerState,
      },
    });
    revalidatePath("/frete/lista");
    return { ok: true, id: created.id, number: formatShippingNumber(created.id) };
  } catch {
    return { ok: false, error: "Não foi possível criar a solicitação." };
  }
}

/** Cotação (transportadora/valor/prazo/pacote/conclusão) — só ADMIN/DEV. */
export async function updateShippingQuote(input: unknown): Promise<ActionResult> {
  await requireRole(STAFF);
  const parsed = updateShippingQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { id, isConcluded, ...rest } = parsed.data;
  try {
    const current = await prisma.shippingQuote.findUnique({
      where: { id },
      select: { isConcluded: true, concludedAt: true },
    });
    if (!current) return { ok: false, error: "Solicitação não encontrada." };

    const concludedAt = isConcluded
      ? (current.concludedAt ?? new Date())
      : null;

    await prisma.shippingQuote.update({
      where: { id },
      data: { ...rest, isConcluded, concludedAt },
    });
    revalidatePath("/frete/lista");
    revalidatePath(`/frete/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível salvar a cotação." };
  }
}

/** Marca/desmarca concluído a partir da lista — só ADMIN/DEV. */
export async function setShippingConcluded(
  id: number,
  isConcluded: boolean,
): Promise<ActionResult> {
  await requireRole(STAFF);
  try {
    await prisma.shippingQuote.update({
      where: { id },
      data: { isConcluded, concludedAt: isConcluded ? new Date() : null },
    });
    revalidatePath("/frete/lista");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível atualizar o status." };
  }
}

/** Excluir — SELLER só os próprios; ADMIN/DEV qualquer. */
export async function deleteShippingQuote(id: number): Promise<ActionResult> {
  const user = await requireUser();
  const sq = await prisma.shippingQuote.findUnique({
    where: { id },
    select: { createdById: true },
  });
  if (!sq) return { ok: false, error: "Solicitação não encontrada." };
  if (user.role === Role.SELLER && sq.createdById !== user.id) {
    return { ok: false, error: "Você só pode excluir as suas próprias solicitações." };
  }
  try {
    await prisma.shippingQuote.delete({ where: { id } });
    revalidatePath("/frete/lista");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir." };
  }
}
