-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "sourceApp" TEXT,
ADD COLUMN     "sourceRefId" TEXT,
ADD COLUMN     "sourceRefLabel" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_sourceApp_sourceRefId_idx" ON "Transaction"("sourceApp", "sourceRefId");
