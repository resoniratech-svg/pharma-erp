-- CreateTable
CREATE TABLE "TourPlan" (
    "id" SERIAL NOT NULL,
    "mrId" INTEGER NOT NULL,
    "tourDate" TIMESTAMP(3) NOT NULL,
    "territory" TEXT NOT NULL,
    "objective" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TourPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourPlanDoctor" (
    "id" SERIAL NOT NULL,
    "tourPlanId" INTEGER NOT NULL,
    "doctorId" INTEGER NOT NULL,

    CONSTRAINT "TourPlanDoctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourPlanChemist" (
    "id" SERIAL NOT NULL,
    "tourPlanId" INTEGER NOT NULL,
    "chemistId" INTEGER NOT NULL,

    CONSTRAINT "TourPlanChemist_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TourPlan" ADD CONSTRAINT "TourPlan_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES "MR"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourPlanDoctor" ADD CONSTRAINT "TourPlanDoctor_tourPlanId_fkey" FOREIGN KEY ("tourPlanId") REFERENCES "TourPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourPlanDoctor" ADD CONSTRAINT "TourPlanDoctor_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourPlanChemist" ADD CONSTRAINT "TourPlanChemist_tourPlanId_fkey" FOREIGN KEY ("tourPlanId") REFERENCES "TourPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourPlanChemist" ADD CONSTRAINT "TourPlanChemist_chemistId_fkey" FOREIGN KEY ("chemistId") REFERENCES "Chemist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
