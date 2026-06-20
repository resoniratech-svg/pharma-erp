-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "mrId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES "MR"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
