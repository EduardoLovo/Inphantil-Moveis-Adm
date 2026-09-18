import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { MostruarioGallery } from "@/components/mostruario/mostruario-gallery";
import { CATEGORY_META, collectionBySlug } from "@/lib/catalog";
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
          <MostruarioGallery
            items={items}
            meta={meta}
            facet={collection.facet ?? "color"}
          />
        )}
      </div>
    </section>
  );
}
