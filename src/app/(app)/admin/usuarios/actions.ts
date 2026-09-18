"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createUserSchema, updateUserSchema } from "@/lib/validators/user";

export type ActionResult = { ok: true } | { ok: false; error: string };

const DEV_ONLY = [Role.DEV];

/** Cria um novo usuário (apenas DEV). */
export async function createUser(input: unknown): Promise<ActionResult> {
  await requireRole(DEV_ONLY);

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { name, email, password, role } = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      // Novo usuário precisa trocar a senha no primeiro acesso.
      data: { name, email, passwordHash, role, mustChangePassword: true },
    });
    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { ok: false, error: "Já existe um usuário com este e-mail." };
    }
    return { ok: false, error: "Não foi possível criar o usuário." };
  }
}

/** Edita um usuário; se `password` vier preenchida, redefine a senha. */
export async function updateUser(input: unknown): Promise<ActionResult> {
  const current = await requireRole(DEV_ONLY);

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { id, name, role, isActive, password } = parsed.data;

  // Evita que o DEV se auto-tranque (rebaixar ou desativar a si mesmo).
  if (id === current.id && (role !== Role.DEV || !isActive)) {
    return {
      ok: false,
      error: "Você não pode rebaixar ou desativar a própria conta.",
    };
  }

  try {
    const data: Prisma.UserUpdateInput = { name, role, isActive };
    if (password && password.length >= 8) {
      data.passwordHash = await bcrypt.hash(password, 12);
      // Senha redefinida pelo DEV → exige troca no próximo login.
      data.mustChangePassword = true;
    }
    await prisma.user.update({ where: { id }, data });
    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível salvar as alterações." };
  }
}

/** Atalho para ativar/desativar. */
export async function setUserActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  const current = await requireRole(DEV_ONLY);
  if (id === current.id && !isActive) {
    return { ok: false, error: "Você não pode desativar a própria conta." };
  }
  try {
    await prisma.user.update({ where: { id }, data: { isActive } });
    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível atualizar o status." };
  }
}
