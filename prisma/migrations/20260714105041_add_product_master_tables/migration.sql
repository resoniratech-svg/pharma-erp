-- AlterTable
ALTER TABLE "Stockist" ALTER COLUMN "code" DROP NOT NULL;

-- CreateTable
CREATE TABLE "MeetingHospital" (
    "id" SERIAL NOT NULL,
    "meetingId" INTEGER NOT NULL,
    "hospitalId" INTEGER NOT NULL,

    CONSTRAINT "MeetingHospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingStockist" (
    "id" SERIAL NOT NULL,
    "meetingId" INTEGER NOT NULL,
    "stockistId" INTEGER NOT NULL,

    CONSTRAINT "MeetingStockist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HSNCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HSNCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GSTRecord" (
    "id" SERIAL NOT NULL,
    "hsnCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "gstPercent" DOUBLE PRECISION NOT NULL,
    "effectiveDate" TIMESTAMP(3),
    "createdBy" TEXT,
    "lastUpdatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GSTRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingType" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackingType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingMaster" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "mrp" DOUBLE PRECISION NOT NULL,
    "ptr" DOUBLE PRECISION NOT NULL,
    "pts" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "effectiveDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "batchId" INTEGER,

    CONSTRAINT "PricingMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchemeMaster" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "buyQty" INTEGER NOT NULL,
    "freeQty" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "batchId" INTEGER,

    CONSTRAINT "SchemeMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HSNCode_code_key" ON "HSNCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PackingType_code_key" ON "PackingType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SchemeMaster_code_key" ON "SchemeMaster"("code");

-- AddForeignKey
ALTER TABLE "MeetingHospital" ADD CONSTRAINT "MeetingHospital_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingHospital" ADD CONSTRAINT "MeetingHospital_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingStockist" ADD CONSTRAINT "MeetingStockist_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingStockist" ADD CONSTRAINT "MeetingStockist_stockistId_fkey" FOREIGN KEY ("stockistId") REFERENCES "Stockist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingMaster" ADD CONSTRAINT "PricingMaster_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingMaster" ADD CONSTRAINT "PricingMaster_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemeMaster" ADD CONSTRAINT "SchemeMaster_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemeMaster" ADD CONSTRAINT "SchemeMaster_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
