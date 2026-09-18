"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validators/auth";
import { changeOwnPassword } from "./actions";

export function ChangePasswordForm() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  async function onSubmit(values: ChangePasswordInput) {
    setPending(true);
    try {
      const res = await changeOwnPassword(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Senha alterada com sucesso!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Não foi possível alterar a senha. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirmar nova senha</Label>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          {...register("confirm")}
        />
        {errors.confirm && (
          <p className="text-xs text-destructive">{errors.confirm.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <KeyRound className="size-4" />
        )}
        Salvar nova senha
      </Button>
    </form>
  );
}
