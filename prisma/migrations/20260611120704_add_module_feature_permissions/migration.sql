-- CreateTable
CREATE TABLE "Module" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "moduleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyFeaturePermission" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "featureId" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyFeaturePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Module_name_key" ON "Module"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyFeaturePermission_companyId_featureId_key" ON "CompanyFeaturePermission"("companyId", "featureId");

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyFeaturePermission" ADD CONSTRAINT "CompanyFeaturePermission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyFeaturePermission" ADD CONSTRAINT "CompanyFeaturePermission_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
