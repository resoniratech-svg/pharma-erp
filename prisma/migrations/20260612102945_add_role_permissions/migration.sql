-- CreateTable
CREATE TABLE "RolePermission" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "role" "Role" NOT NULL,
    "featureId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
