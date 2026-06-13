/*
  Warnings:

  - A unique constraint covering the columns `[batchNumber]` on the table `Batch` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `ProductCategory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Batch_batchNumber_key" ON "Batch"("batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_name_key" ON "ProductCategory"("name");
