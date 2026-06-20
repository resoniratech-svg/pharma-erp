-- CreateTable
CREATE TABLE "DeliveryTracking" (
    "id" SERIAL NOT NULL,
    "lrTrackingId" INTEGER NOT NULL,
    "receiverName" TEXT NOT NULL,
    "receiverMobile" TEXT,
    "deliveryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DELIVERED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryTracking_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DeliveryTracking" ADD CONSTRAINT "DeliveryTracking_lrTrackingId_fkey" FOREIGN KEY ("lrTrackingId") REFERENCES "LRTracking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
