"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { changePasswordSchema } from "@/lib/validators/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Troca a senha do próprio usuário logado e limpa o `mustChangePassword`. */
export async function changeOwnPassword(input: unknown): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível alterar a senha." };
  }
}
