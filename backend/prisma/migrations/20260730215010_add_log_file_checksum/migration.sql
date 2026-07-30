-- AlterTable
ALTER TABLE "log_files" ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "sizeBytes" INTEGER;

-- CreateIndex
CREATE INDEX "log_files_checksum_idx" ON "log_files"("checksum");
