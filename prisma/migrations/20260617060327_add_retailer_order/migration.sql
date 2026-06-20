-- CreateTable
CREATE TABLE "RetailerOrder" (
    "id" SERIAL NOT NULL,
    "retailerId" INTEGER NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetailerOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetailerOrderItem" (
    "id" SERIAL NOT NULL,
    "retailerOrderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RetailerOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RetailerOrder_orderNumber_key" ON "RetailerOrder"("orderNumber");

-- AddForeignKey
ALTER TABLE "RetailerOrder" ADD CONSTRAINT "RetailerOrder_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailerOrderItem" ADD CONSTRAINT "RetailerOrderItem_retailerOrderId_fkey" FOREIGN KEY ("retailerOrderId") REFERENCES "RetailerOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailerOrderItem" ADD CONSTRAINT "RetailerOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
