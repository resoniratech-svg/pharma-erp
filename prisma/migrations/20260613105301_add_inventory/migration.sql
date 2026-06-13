-- DropIndex
DROP INDEX "Batch_batchNumber_key";

-- CreateTable
CREATE TABLE "Inventory" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
