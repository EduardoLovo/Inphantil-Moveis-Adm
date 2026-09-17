import { z } from "zod";
import { Role } from "@prisma/client";

export const roleEnum = z.nativeEnum(Role);

export const createUserSchema = z.object({
  name: z.string().min(2, "Nome muito curto.").max(120),
  email: z.string().email("E-mail inválido.").transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(8, "A senha inicial deve ter ao menos 8 caracteres.")
    .max(72, "Senha muito longa."),
  role: roleEnum,
});

export const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, "Nome muito curto.").max(120),
  role: roleEnum,
  isActive: z.boolean(),
  // Opcional: quando preenchida, redefine a senha.
  password: z
    .string()
    .min(8, "A senha deve ter ao menos 8 caracteres.")
    .max(72)
    .optional()
    .or(z.literal("")),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
