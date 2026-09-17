-- Renomeia publicId -> key (migração de Cloudinary para R2). Sem perda de dados.

-- Image
ALTER TABLE "Image" RENAME COLUMN "publicId" TO "key";
ALTER INDEX "Image_publicId_key" RENAME TO "Image_key_key";

-- OrphanImage
ALTER TABLE "OrphanImage" RENAME COLUMN "publicId" TO "key";
ALTER INDEX "OrphanImage_publicId_key" RENAME TO "OrphanImage_key_key";
