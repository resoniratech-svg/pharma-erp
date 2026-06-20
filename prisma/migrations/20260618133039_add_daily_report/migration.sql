-- CreateTable
CREATE TABLE "DailyReport" (
    "id" SERIAL NOT NULL,
    "mrId" INTEGER NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "doctorVisits" INTEGER NOT NULL DEFAULT 0,
    "chemistVisits" INTEGER NOT NULL DEFAULT 0,
    "samplesDistributed" INTEGER NOT NULL DEFAULT 0,
    "ordersCollected" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES "MR"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
