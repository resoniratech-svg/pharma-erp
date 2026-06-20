-- CreateTable
CREATE TABLE "TransportChallan" (
    "id" SERIAL NOT NULL,
    "dispatchId" INTEGER NOT NULL,
    "transporterName" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "driverName" TEXT,
    "driverMobile" TEXT,
    "challanNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportChallan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransportChallan_challanNumber_key" ON "TransportChallan"("challanNumber");

-- AddForeignKey
ALTER TABLE "TransportChallan" ADD CONSTRAINT "TransportChallan_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
