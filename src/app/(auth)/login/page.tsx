import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const safeCallback =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";

  return (
    <div className="bg-playful relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <ConstellationField />
      <Reveal className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Área da equipe</CardTitle>
            <CardDescription>
              Entre com seu e-mail e senha para acessar as ferramentas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm callbackUrl={safeCallback} />
          </CardContent>
        </Card>
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar ao início
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
