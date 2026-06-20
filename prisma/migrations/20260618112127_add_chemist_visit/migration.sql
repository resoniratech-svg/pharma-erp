-- CreateTable
CREATE TABLE "ChemistVisit" (
    "id" SERIAL NOT NULL,
    "mrId" INTEGER NOT NULL,
    "chemistId" INTEGER NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "productsDiscussed" TEXT,
    "orderValue" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChemistVisit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChemistVisit" ADD CONSTRAINT "ChemistVisit_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES "MR"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChemistVisit" ADD CONSTRAINT "ChemistVisit_chemistId_fkey" FOREIGN KEY ("chemistId") REFERENCES "Chemist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
