"use server";

import { revalidatePath } from "next/cache";
import { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import {
  createCorDigitalSchema,
  updateCorDigitalSchema,
} from "@/lib/validators/cor-digital";

export type ActionResult = { ok: true } | { ok: false; error: string };

const STAFF = [Role.DEV, Role.ADMIN];

// A paleta aparece no catálogo, no mostruário e nas três composições.
function revalidate() {
  revalidatePath("/catalogo");
  revalidatePath("/catalogo/cores-digitais");
  revalidatePath("/mostruario");
  revalidatePath("/mostruario/cores-digitais");
  revalidatePath("/protetor-parede");
  revalidatePath("/tapete");
  revalidatePath("/cama");
}

/** As composições identificam a cor pelo hex: não pode repetir. */
async function hexEmUso(hex: string, exceptId?: string) {
  const outra = await prisma.corDigital.findFirst({
    where: { hex, NOT: exceptId ? { id: exceptId } : undefined },
    select: { codigo: true },
  });
  return outra?.codigo ?? null;
}

function erroBanco(e: unknown, fallback: string): string {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    return "Já existe uma cor com esse código.";
  }
  return fallback;
}

export async function createCorDigital(input: unknown): Promise<ActionResult> {
  await requireRole(STAFF);
  const parsed = createCorDigitalSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const dup = await hexEmUso(parsed.data.hex);
  if (dup) return { ok: false, error: `Esse hex já é usado pela cor ${dup}.` };
  try {
    await prisma.corDigital.create({ data: parsed.data });
  } catch (e) {
    return { ok: false, error: erroBanco(e, "Não foi possível criar a cor.") };
  }
  revalidate();
  return { ok: true };
}

export async function updateCorDigital(input: unknown): Promise<ActionResult> {
  await requireRole(STAFF);
  const parsed = updateCorDigitalSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { id, ...data } = parsed.data;
  const dup = await hexEmUso(data.hex, id);
  if (dup) return { ok: false, error: `Esse hex já é usado pela cor ${dup}.` };
  try {
    await prisma.corDigital.update({ where: { id }, data });
  } catch (e) {
    return { ok: false, error: erroBanco(e, "Não foi possível salvar.") };
  }
  revalidate();
  return { ok: true };
}

export async function deleteCorDigital(id: string): Promise<ActionResult> {
  await requireRole(STAFF);
  try {
    await prisma.corDigital.delete({ where: { id } });
  } catch {
    return { ok: false, error: "Não foi possível excluir." };
  }
  revalidate();
  return { ok: true };
}

export async function setCorDigitalAtiva(
  id: string,
  ativa: boolean,
): Promise<ActionResult> {
  await requireRole(STAFF);
  try {
    await prisma.corDigital.update({ where: { id }, data: { ativa } });
  } catch {
    return { ok: false, error: "Não foi possível atualizar." };
  }
  revalidate();
  return { ok: true };
}
