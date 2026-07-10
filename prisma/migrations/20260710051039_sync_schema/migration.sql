-- DropForeignKey
ALTER TABLE "Dispatch" DROP CONSTRAINT "Dispatch_batchId_fkey";

-- DropForeignKey
ALTER TABLE "Dispatch" DROP CONSTRAINT "Dispatch_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "TransportChallan" DROP CONSTRAINT "TransportChallan_dispatchId_fkey";

-- DropIndex
DROP INDEX "Batch_batchNumber_key";

-- AlterTable
ALTER TABLE "Dispatch" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "createdDate" TEXT,
ADD COLUMN     "dispatchNo" TEXT,
ADD COLUMN     "dispatchType" TEXT,
ADD COLUMN     "driverMobile" TEXT,
ADD COLUMN     "driverName" TEXT,
ADD COLUMN     "lrNumber" TEXT,
ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "products" JSONB,
ADD COLUMN     "sourceWarehouse" TEXT,
ADD COLUMN     "totalItems" INTEGER,
ADD COLUMN     "totalQuantity" INTEGER,
ADD COLUMN     "transporter" TEXT,
ADD COLUMN     "vehicleNumber" TEXT,
ALTER COLUMN "batchId" DROP NOT NULL,
ALTER COLUMN "warehouseId" DROP NOT NULL,
ALTER COLUMN "customerName" DROP NOT NULL,
ALTER COLUMN "quantity" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RetailerOrder" ADD COLUMN     "mrId" INTEGER;

-- AlterTable
ALTER TABLE "TransportChallan" ADD COLUMN     "actualDeliveryDate" TEXT,
ADD COLUMN     "challanDate" TEXT,
ADD COLUMN     "challanNo" TEXT,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "createdDate" TEXT,
ADD COLUMN     "customer" TEXT,
ADD COLUMN     "dispatchDate" TEXT,
ADD COLUMN     "dispatchNo" TEXT,
ADD COLUMN     "orderNo" TEXT,
ADD COLUMN     "podDesignation" TEXT,
ADD COLUMN     "podFileName" TEXT,
ADD COLUMN     "podFileType" TEXT,
ADD COLUMN     "podFileUrl" TEXT,
ADD COLUMN     "podReceivedBy" TEXT,
ADD COLUMN     "podRemarks" TEXT,
ADD COLUMN     "podStatus" TEXT,
ADD COLUMN     "podUploadedBy" TEXT,
ADD COLUMN     "podUploadedDate" TEXT,
ADD COLUMN     "products" JSONB,
ADD COLUMN     "sourceWarehouse" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "totalItems" INTEGER,
ADD COLUMN     "totalQty" INTEGER,
ALTER COLUMN "dispatchId" DROP NOT NULL,
ALTER COLUMN "transporterName" DROP NOT NULL,
ALTER COLUMN "vehicleNumber" DROP NOT NULL,
ALTER COLUMN "challanNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentDeviceId" TEXT;

-- AlterTable
ALTER TABLE "Warehouse" ADD COLUMN     "branch" TEXT NOT NULL DEFAULT 'Default Branch',
ADD COLUMN     "city" TEXT,
ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "createdBy" TEXT NOT NULL DEFAULT 'System',
ADD COLUMN     "email" TEXT,
ADD COLUMN     "gstNumber" TEXT,
ADD COLUMN     "licenseNumber" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "pinCode" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Active',
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'Main Warehouse';

-- CreateTable
CREATE TABLE "Distributor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,

    CONSTRAINT "Distributor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hospital" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT,
    "address" TEXT,

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TerritoryBeat" (
    "id" SERIAL NOT NULL,
    "area" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "totalDoctors" INTEGER NOT NULL,
    "totalChemists" INTEGER NOT NULL,

    CONSTRAINT "TerritoryBeat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportChallan" ADD CONSTRAINT "TransportChallan_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailerOrder" ADD CONSTRAINT "RetailerOrder_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES "MR"("id") ON DELETE SET NULL ON UPDATE CASCADE;
