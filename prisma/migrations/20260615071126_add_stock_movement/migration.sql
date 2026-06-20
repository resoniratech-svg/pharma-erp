/*
  Warnings:

  - You are about to drop the column `batchId` on the `StockMovement` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `StockMovement` table. All the data in the column will be lost.
  - You are about to drop the column `warehouseId` on the `StockMovement` table. All the data in the column will be lost.
  - Added the required column `inventoryId` to the `StockMovement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `movementType` to the `StockMovement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StockMovement" DROP COLUMN "batchId",
DROP COLUMN "type",
DROP COLUMN "warehouseId",
ADD COLUMN     "inventoryId" INTEGER NOT NULL,
ADD COLUMN     "movementType" TEXT NOT NULL,
ADD COLUMN     "remarks" TEXT;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
