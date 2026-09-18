import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A nova senha deve ter ao menos 8 caracteres.")
      .max(72, "Senha muito longa."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "As senhas não conferem.",
    path: ["confirm"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
