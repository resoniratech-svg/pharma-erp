const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Checking and seeding billing data for testing...");

  // 1. Ensure stockist exists
  let stockist = await prisma.stockist.findFirst();
  if (!stockist) {
    stockist = await prisma.stockist.create({
      data: {
        name: "Metro Stockists Ltd",
        code: "ST001",
        mobile: "9988776655",
        email: "metro@stockist.com",
        address: "Industrial Area, Phase 1",
        gstNumber: "27ABCDE9999F1Z5",
        isActive: true
      }
    });
    console.log("Created Stockist:", stockist.name);
  }

  // 2. Ensure retailer exists
  let retailer = await prisma.retailer.findFirst();
  if (!retailer) {
    retailer = await prisma.retailer.create({
      data: {
        name: "Apollo Pharmacy Store 5",
        code: "RET001",
        mobile: "9876543210",
        email: "apollo5@pharmacy.com",
        address: "Main Market, Sector 15",
        gstNumber: "27ABCDE1234F1Z5",
        isActive: true,
        stockistId: stockist.id
      }
    });
    console.log("Created Retailer:", retailer.name);
  }

  // 3. Ensure warehouse with code 'DIST-001' exists
  let warehouse = await prisma.warehouse.findUnique({
    where: { code: 'DIST-001' }
  });
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        name: "Distributor Warehouse (DIST-001)",
        code: "DIST-001",
        address: "Central Logistics Hub",
        type: "Main Warehouse",
        status: "Active",
        companyId: 1
      }
    });
    console.log("Created Warehouse:", warehouse.name);
  }

  // 4. Ensure product exists
  let product = await prisma.product.findFirst();
  if (!product) {
    product = await prisma.product.create({
      data: {
        name: "Paracetamol 500mg",
        code: "PCM500",
        gst: 12,
        mrp: 20,
        ptr: 15,
        pts: 13,
        ptd: 12,
        status: "Active",
        companyId: 1
      }
    });
    console.log("Created Product:", product.name);
  }

  // 5. Ensure batch exists
  let batch = await prisma.batch.findFirst({
    where: { productId: product.id }
  });
  if (!batch) {
    batch = await prisma.batch.create({
      data: {
        batchNumber: "B-PCM-001",
        productId: product.id,
        manufacturingDate: new Date("2026-01-01"),
        expiryDate: new Date("2028-12-31"),
        quantity: 1000
      }
    });
    console.log("Created Batch:", batch.batchNumber);
  }

  // 6. Ensure inventory exists for this specific warehouse
  let inventory = await prisma.inventory.findFirst({
    where: { batchId: batch.id, warehouseId: warehouse.id }
  });
  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: {
        batchId: batch.id,
        warehouseId: warehouse.id,
        quantity: 850
      }
    });
    console.log("Created Inventory Record for DIST-001");
  }

  // 7. Ensure invoice exists
  let invoice = await prisma.invoice.findFirst();
  if (!invoice) {
    invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: "INV-2026-0001",
        invoiceDate: new Date(),
        retailerId: retailer.id,
        subTotal: 150.00,
        gstAmount: 18.00,
        totalAmount: 168.00,
        status: "PENDING",
        invoiceItems: {
          create: [
            {
              productId: product.id,
              quantity: 10,
              rate: 15.00,
              gst: 12.00,
              amount: 168.00
            }
          ]
        }
      }
    });
    console.log("Created Invoice:", invoice.invoiceNumber);
  }

  console.log("Seeding billing details complete!");
}

main()
  .catch(e => {
    console.error("Error seeding details:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
