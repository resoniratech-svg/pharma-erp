-- CreateTable
CREATE TABLE "LRTracking" (
    "id" SERIAL NOT NULL,
    "transportChallanId" INTEGER NOT NULL,
    "lrNumber" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_TRANSIT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LRTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LRTracking_lrNumber_key" ON "LRTracking"("lrNumber");

-- AddForeignKey
ALTER TABLE "LRTracking" ADD CONSTRAINT "LRTracking_transportChallanId_fkey" FOREIGN KEY ("transportChallanId") REFERENCES "TransportChallan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
