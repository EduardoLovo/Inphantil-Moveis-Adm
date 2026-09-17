-- AlterEnum
BEGIN;
CREATE TYPE "CatalogCategory_new" AS ENUM ('APLIQUE', 'SINTETICO', 'TECIDO_LENCOL', 'PRONTA_ENTREGA');
ALTER TABLE "CatalogItem" ALTER COLUMN "category" TYPE "CatalogCategory_new" USING ("category"::text::"CatalogCategory_new");
ALTER TYPE "CatalogCategory" RENAME TO "CatalogCategory_old";
ALTER TYPE "CatalogCategory_new" RENAME TO "CatalogCategory";
DROP TYPE "public"."CatalogCategory_old";
COMMIT;

-- AlterTable
ALTER TABLE "CatalogItem" ADD COLUMN     "cabana" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tapete" BOOLEAN NOT NULL DEFAULT false;

