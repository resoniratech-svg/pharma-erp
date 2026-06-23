/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `MR` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "MR" ADD COLUMN     "userId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "MR_userId_key" ON "MR"("userId");

-- AddForeignKey
ALTER TABLE "MR" ADD CONSTRAINT "MR_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
