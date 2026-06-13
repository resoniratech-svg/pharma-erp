/*
  Warnings:

  - A unique constraint covering the columns `[batchNumber]` on the table `Batch` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `warehouseName` to the `Inventory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "warehouseName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Batch_batchNumber_key" ON "Batch"("batchNumber");
