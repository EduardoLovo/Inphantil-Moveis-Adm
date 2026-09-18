import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { ConstellationField } from "@/components/motion/constellation-field";
import { getCurrentUser } from "@/lib/rbac";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "Trocar senha" };

export default async function TrocarSenhaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="bg-playful relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <ConstellationField />
      <Reveal className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Defina uma nova senha</CardTitle>
            <CardDescription>
              Por segurança, escolha uma senha nova para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
