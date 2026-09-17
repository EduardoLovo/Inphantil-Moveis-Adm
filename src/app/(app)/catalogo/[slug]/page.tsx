import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Role } from "@prisma/client";

import { PageHeader } from "@/components/page-header";
import { guardPage } from "@/lib/guard";
import { categoryBySlug } from "@/lib/catalog";
import { listCatalog } from "@/lib/catalog-server";
import { CatalogList } from "./catalog-list";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = categoryBySlug(slug);
  return { title: cat ? cat.label : "Catálogo" };
}

export default async function CatalogCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = categoryBySlug(slug);
  if (!category) notFound();

  await guardPage([Role.DEV, Role.ADMIN]);
  const items = await listCatalog(category.value);

  return (
    <div>
      <Link
        href="/catalogo"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Catálogo
      </Link>
      <PageHeader
        title={category.label}
        description="Adicione, edite e controle a disponibilidade dos itens."
      />
      {/* category é um objeto do const CATEGORIES (serializável). */}
      <CatalogList items={items} category={category} />
    </div>
  );
}
