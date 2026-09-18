-- CreateEnum
CREATE TYPE "ProntaTamanho" AS ENUM ('FRONHA', 'BERCO', 'JUNIOR', 'SOLTEIRO', 'SOLTEIRAO', 'VIUVA', 'CASAL', 'QUEEN', 'KING');

-- AlterTable
ALTER TABLE "CatalogItem" ADD COLUMN     "tamanho" "ProntaTamanho";
