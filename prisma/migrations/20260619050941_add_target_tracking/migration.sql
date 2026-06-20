-- CreateTable
CREATE TABLE "Target" (
    "id" SERIAL NOT NULL,
    "mrId" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "doctorVisitTarget" INTEGER NOT NULL,
    "chemistVisitTarget" INTEGER NOT NULL,
    "orderTarget" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "achievedDoctorVisits" INTEGER NOT NULL DEFAULT 0,
    "achievedChemistVisits" INTEGER NOT NULL DEFAULT 0,
    "achievedOrderValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Target_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Target" ADD CONSTRAINT "Target_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES "MR"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
