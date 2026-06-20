-- CreateTable
CREATE TABLE "Chemist" (
    "id" SERIAL NOT NULL,
    "chemistCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT,
    "email" TEXT,
    "address" TEXT,
    "territory" TEXT,
    "gstNumber" TEXT,
    "drugLicenseNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chemist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chemist_chemistCode_key" ON "Chemist"("chemistCode");
