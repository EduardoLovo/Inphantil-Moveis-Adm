-- CreateEnum
CREATE TYPE "CatalogCategory" AS ENUM ('APLIQUE', 'TAPETE', 'CAMA', 'TECIDO_LENCOL', 'PRONTA_ENTREGA');

-- CreateEnum
CREATE TYPE "ProntaEntregaKind" AS ENUM ('LENCOL', 'LENCOL_FRONHA', 'VIROL', 'VIROL_FRONHA', 'FRONHA');

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "category" "CatalogCategory" NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "color" VARCHAR(80) NOT NULL,
    "imageUrl" TEXT,
    "imageKey" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "quantity" INTEGER,
    "fazExterno" BOOLEAN NOT NULL DEFAULT false,
    "prontaKind" "ProntaEntregaKind",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogItem_category_idx" ON "CatalogItem"("category");

-- CreateIndex
CREATE INDEX "CatalogItem_category_available_idx" ON "CatalogItem"("category", "available");

