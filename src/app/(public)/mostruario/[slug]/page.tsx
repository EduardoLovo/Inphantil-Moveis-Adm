import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/motion/reveal";
import { LightboxImage } from "@/components/mostruario/lightbox-image";
import {
  CATEGORY_META,
  PRONTA_KIND_LABEL,
  collectionBySlug,
} from "@/lib/catalog";
import { listPublicCollection } from "@/lib/catalog-server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const col = collectionBySlug(slug);
  return { title: col ? `${col.label} · Mostruário` : "Mostruário" };
}

export default async function MostruarioCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = collectionBySlug(slug);
  if (!collection) notFound();

  const meta = CATEGORY_META[collection.category];
  const items = await listPublicCollection(collection);

  return (
    <section className="bg-playful min-h-[calc(100vh-8rem)]">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <Reveal>
          <Link
            href="/mostruario"
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Mostruário
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            {collection.label}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {items.length} {items.length === 1 ? "opção disponível" : "opções disponíveis"}
          </p>
        </Reveal>

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
            Nenhum item disponível nesta coleção no momento.
          </div>
        ) : (
          <StaggerContainer className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <StaggerItem key={item.id}>
                <div className="overflow-hidden rounded-2xl border bg-card">
                  <div className="relative aspect-square bg-muted">
                    {item.imageUrl ? (
                      <LightboxImage
                        src={item.imageUrl}
                        alt={`${item.code} — ${item.color}`}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px"
                        className="object-cover transition-transform duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-muted-foreground">
                        <ImageOff className="size-8" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 p-3">
                    <p className="font-bold leading-tight">{item.code}</p>
                    <p className="text-sm text-muted-foreground">{item.color}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {meta.hasFazExterno && (
                        <Badge variant="secondary">
                          {item.fazExterno ? "Interno + Externo" : "Interno"}
                        </Badge>
                      )}
                      {meta.hasProntaKind && item.prontaKind && (
                        <Badge variant="secondary">
                          {PRONTA_KIND_LABEL[item.prontaKind]}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </section>
  );
}
