-- CreateEnum
CREATE TYPE "QuoteMeasureType" AS ENUM ('UNIDADE', 'METRO_LINEAR', 'METRO_QUADRADO');

-- CreateTable
CREATE TABLE "QuoteProduct" (
    "id" SERIAL NOT NULL,
    "sku" VARCHAR(50),
    "name" VARCHAR(200) NOT NULL,
    "price" DECIMAL(10,2),
    "isPriceEditable" BOOLEAN NOT NULL DEFAULT false,
    "measureType" "QuoteMeasureType" NOT NULL DEFAULT 'UNIDADE',
    "dimensions" VARCHAR(100),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" SERIAL NOT NULL,
    "customerName" VARCHAR(200) NOT NULL,
    "sellerId" TEXT NOT NULL,
    "installments" INTEGER,
    "discountPercent" DECIMAL(5,2),
    "discountFixed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "oneInstallmentDiscount" BOOLEAN NOT NULL DEFAULT false,
    "shippingZipCode" VARCHAR(10),
    "shippingValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "quoteProductId" INTEGER,
    "sku" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "measureType" "QuoteMeasureType" NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER,
    "measure" DECIMAL(10,3),
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "dimensions" VARCHAR(100),
    "note" VARCHAR(500),

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuoteProduct_sku_key" ON "QuoteProduct"("sku");

-- CreateIndex
CREATE INDEX "QuoteProduct_isActive_idx" ON "QuoteProduct"("isActive");

-- CreateIndex
CREATE INDEX "Quote_sellerId_idx" ON "Quote"("sellerId");

-- CreateIndex
CREATE INDEX "Quote_createdAt_idx" ON "Quote"("createdAt");

-- CreateIndex
CREATE INDEX "QuoteItem_quoteId_idx" ON "QuoteItem"("quoteId");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteProductId_fkey" FOREIGN KEY ("quoteProductId") REFERENCES "QuoteProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

