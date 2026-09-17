import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/motion/reveal";

export default function LandingPage() {
  return (
    <section className="bg-playful">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl flex-col items-center justify-center px-4 py-16 text-center md:px-6">
        <Reveal>
          <Badge variant="secondary" className="mb-5">
            Inphantil · Cloud
          </Badge>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="max-w-3xl text-balance text-4xl font-extrabold tracking-tight md:text-6xl">
            Móveis infantis com um{" "}
            <span className="text-gradient">toque encantado</span>
          </h1>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mt-5 max-w-xl text-balance text-lg text-muted-foreground">
            Vitrine dos nossos produtos e o painel interno da equipe, num só
            lugar. Explore o mostruário ou entre para usar as ferramentas.
          </p>
        </Reveal>

        <StaggerContainer className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <StaggerItem>
            <Button size="lg" asChild>
              <Link href="/mostruario">
                Ver mostruário
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </StaggerItem>
          <StaggerItem>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">
                <LogIn className="size-4" />
                Área da equipe
              </Link>
            </Button>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </section>
  );
}
