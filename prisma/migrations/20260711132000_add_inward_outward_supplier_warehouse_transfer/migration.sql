-- DropForeignKey
ALTER TABLE "WarehouseTransfer" DROP CONSTRAINT "WarehouseTransfer_batchId_fkey";

-- AlterTable
ALTER TABLE "WarehouseTransfer" DROP COLUMN "batchId",
DROP COLUMN "quantity",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "itemsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Completed',
ADD COLUMN     "totalQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "transferNo" TEXT;

-- Seed unique values for existing rows
UPDATE "WarehouseTransfer" SET "transferNo" = 'TRF-' || id WHERE "transferNo" IS NULL;

-- Alter column to NOT NULL
ALTER TABLE "WarehouseTransfer" ALTER COLUMN "transferNo" SET NOT NULL;

-- CreateTable
CREATE TABLE "WarehouseTransferItem" (
    "id" SERIAL NOT NULL,
    "warehouseTransferId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "batchId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarehouseTransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "email" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InwardStock" (
    "id" SERIAL NOT NULL,
    "grnNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplierId" INTEGER NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "invoiceNumber" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "itemsCount" INTEGER NOT NULL DEFAULT 0,
    "totalQuantity" INTEGER NOT NULL DEFAULT 0,
    "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'Completed',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InwardStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InwardStockItem" (
    "id" SERIAL NOT NULL,
    "inwardStockId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "batchNo" TEXT NOT NULL,
    "mfgDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "quantity" INTEGER NOT NULL,
    "ptr" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "mrp" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InwardStockItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutwardStock" (
    "id" SERIAL NOT NULL,
    "dispatchNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client" TEXT NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "referenceNumber" TEXT,
    "itemsCount" INTEGER NOT NULL DEFAULT 0,
    "totalQuantity" INTEGER NOT NULL DEFAULT 0,
    "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'Dispatched',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutwardStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutwardStockItem" (
    "id" SERIAL NOT NULL,
    "outwardStockId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "batchId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "OutwardStockItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "InwardStock_grnNo_key" ON "InwardStock"("grnNo");

-- CreateIndex
CREATE UNIQUE INDEX "OutwardStock_dispatchNo_key" ON "OutwardStock"("dispatchNo");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseTransfer_transferNo_key" ON "WarehouseTransfer"("transferNo");

-- AddForeignKey
ALTER TABLE "WarehouseTransferItem" ADD CONSTRAINT "WarehouseTransferItem_warehouseTransferId_fkey" FOREIGN KEY ("warehouseTransferId") REFERENCES "WarehouseTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseTransferItem" ADD CONSTRAINT "WarehouseTransferItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseTransferItem" ADD CONSTRAINT "WarehouseTransferItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InwardStock" ADD CONSTRAINT "InwardStock_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InwardStock" ADD CONSTRAINT "InwardStock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InwardStockItem" ADD CONSTRAINT "InwardStockItem_inwardStockId_fkey" FOREIGN KEY ("inwardStockId") REFERENCES "InwardStock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InwardStockItem" ADD CONSTRAINT "InwardStockItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutwardStock" ADD CONSTRAINT "OutwardStock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutwardStockItem" ADD CONSTRAINT "OutwardStockItem_outwardStockId_fkey" FOREIGN KEY ("outwardStockId") REFERENCES "OutwardStock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutwardStockItem" ADD CONSTRAINT "OutwardStockItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutwardStockItem" ADD CONSTRAINT "OutwardStockItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
