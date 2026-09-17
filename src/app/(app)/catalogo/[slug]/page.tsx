import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Role } from "@prisma/client";

import { PageHeader } from "@/components/page-header";
import { guardPage } from "@/lib/guard";
import { collectionBySlug } from "@/lib/catalog";
import { listCollection } from "@/lib/catalog-server";
import { CatalogList } from "./catalog-list";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const col = collectionBySlug(slug);
  return { title: col ? col.label : "Catálogo" };
}

export default async function CatalogCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = collectionBySlug(slug);
  if (!collection) notFound();

  await guardPage([Role.DEV, Role.ADMIN]);
  const items = await listCollection(collection);

  return (
    <div>
      <Link
        href="/catalogo"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Catálogo
      </Link>
      <PageHeader
        title={collection.label}
        description={
          collection.flag
            ? "Coleção filtrada — itens da categoria marcados com esta característica."
            : "Adicione, edite e controle a disponibilidade dos itens."
        }
      />
      <CatalogList items={items} collection={collection} />
    </div>
  );
}
