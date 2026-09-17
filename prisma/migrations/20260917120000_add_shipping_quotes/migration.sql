-- CreateTable
CREATE TABLE "ShippingQuote" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "quoteDetails" TEXT,
    "customerName" VARCHAR(150),
    "customerCpf" VARCHAR(14),
    "customerZipCode" VARCHAR(10),
    "customerAddress" VARCHAR(255),
    "customerCity" VARCHAR(100),
    "customerState" VARCHAR(2),
    "carrierName" VARCHAR(150),
    "volumeQuantity" INTEGER,
    "weight" VARCHAR(50),
    "shippingValue" DECIMAL(10,2),
    "orderValue" DECIMAL(10,2),
    "deliveryDeadline" VARCHAR(50),
    "hasWallProtector" BOOLEAN NOT NULL DEFAULT false,
    "wallProtectorSize" TEXT,
    "hasRug" BOOLEAN NOT NULL DEFAULT false,
    "rugSize" VARCHAR(100),
    "hasAccessories" BOOLEAN NOT NULL DEFAULT false,
    "accessoryQuantity" INTEGER,
    "bedSize" VARCHAR(100),
    "adminNotes" TEXT,
    "isRequested" BOOLEAN NOT NULL DEFAULT false,
    "isConcluded" BOOLEAN NOT NULL DEFAULT false,
    "concludedAt" TIMESTAMP(3),

    CONSTRAINT "ShippingQuote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShippingQuote_createdById_idx" ON "ShippingQuote"("createdById");

-- CreateIndex
CREATE INDEX "ShippingQuote_isConcluded_idx" ON "ShippingQuote"("isConcluded");

-- CreateIndex
CREATE INDEX "ShippingQuote_createdAt_idx" ON "ShippingQuote"("createdAt");

-- AddForeignKey
ALTER TABLE "ShippingQuote" ADD CONSTRAINT "ShippingQuote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

