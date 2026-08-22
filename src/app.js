const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/user.routes");
const salesOrganizationRoutes = require("./modules/salesOrganization/employee.routes");
const targetAllocationRoutes = require("./modules/targetAllocation/targetAllocation.routes");
const hierarchyDashboardRoutes = require("./modules/hierarchyDashboard/dashboard.routes");
const superAdminDashboardRoutes = require("./modules/dashboard/dashboard.routes");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const permissionRoutes = require(
  "./modules/permissions/permission.routes"
);

const moduleRoutes = require(
  "./modules/module/module.routes"
);

const featureRoutes = require(
  "./modules/feature/feature.routes"
);
const companyRoutes = require(
  "./modules/company/company.routes"
);
const testRoutes =
  require("./modules/test/test.routes");

  const rolePermissionRoutes =
require("./modules/rolePermission/rolePermission.routes");

const roleTestRoutes =
require("./modules/test/roleTest.routes");

const hsnRoutes = require("./modules/hsn/hsn.routes");
const gstRoutes = require("./modules/gst/gst.routes");
const packingTypeRoutes = require("./modules/packing-type/packing-type.routes");
const pricingRoutes = require("./modules/pricing/pricing.routes");
const schemeRoutes = require("./modules/scheme/scheme.routes");
const compositionRoutes = require("./modules/composition/composition.routes");

const manufacturerRoutes = require("./modules/manufacturer/manufacturer.routes");
const brandRoutes = require("./modules/brand/brand.routes");
const productRoutes =
  require("./modules/products/product.routes");

  const productCategoryRoutes = require(
  "./modules/product-category/productCategory.routes"
);

const batchRoutes = require(
  "./modules/batches/batch.routes"
);

const inventoryRoutes = require(
  "./modules/inventory/inventory.routes"
);

const warehouseRoutes =
  require("./modules/warehouse/warehouse.routes");

  const stockMovementRoutes =
require(
"./modules/stockMovement/stockMovement.routes"
);

const lowStockAlertRoutes =
require("./modules/lowStockAlert/lowStockAlert.routes");

const expiryMonitoringRoutes =
require("./modules/expiryMonitoring/expiryMonitoring.routes");

const deadStockRoutes =
require("./modules/deadStock/deadStock.routes");

const warehouseTransferRoutes = require("./modules/warehouseTransfer/warehouseTransfer.routes");

const inwardStockRoutes = require("./modules/inward-stock/inward-stock.routes");
const outwardStockRoutes = require("./modules/outward-stock/outward-stock.routes");
const supplierRoutes = require("./modules/suppliers/supplier.routes");

const dispatchRoutes =
require(
"./modules/dispatch/dispatch.routes"
);


const transportChallanRoutes =
require(
"./modules/transportChallan/transportChallan.routes"
);

const lrTrackingRoutes =
require(
"./modules/lrTracking/lrTracking.routes"
);

const deliveryTrackingRoutes =
require(
"./modules/deliveryTracking/deliveryTracking.routes"
);

const stockistRoutes =
require(
"./modules/stockist/stockist.routes"
);

const retailerRoutes =
require("./modules/retailer/retailer.routes");

const invoiceRoutes =
require("./modules/invoice/invoice.routes");

const eInvoiceRoutes = require("./modules/eInvoice/eInvoice.routes");

const retailerOrderRoutes =
require(
"./modules/retailerOrder/retailerOrder.routes"
);

const retailerOrderItemRoutes =
  require("./modules/retailerOrderItem/retailerOrderItem.routes");

  const financeRoutes = 
  require("./modules/finance/finance.routes");

const creditNoteRoutes =
require("./modules/creditNote/creditNote.routes");

const outstandingRoutes =
  require(
    "./modules/outstanding/outstanding.routes"
  );

  const accountingRoutes = require(
  "./modules/accounting/accounting.routes"
);

const mrRoutes =
  require(
    "./modules/mr/mr.routes"
  );

  const doctorRoutes =
  require(
    "./modules/doctor/doctor.routes"
  );

  const chemistRoutes =
  require(
    "./modules/chemist/chemist.routes"
  );

  const attendanceRoutes =
  require(
    "./modules/attendance/attendance.routes"
  );

  const doctorVisitRoutes =
  require(
    "./modules/doctorVisit/doctorVisit.routes"
  );

  const chemistVisitRoutes = require(
  "./modules/chemistVisit/chemistVisit.routes"
);

const tourPlanRoutes = require(
  "./modules/tourPlan/tourPlan.routes"
);

const targetRoutes = require(
  "./modules/target/target.routes"
);

const dailyReportRoutes = require("./modules/dailyReport/dailyReport.routes");

const meetingRoutes = require(
  "./modules/meeting/meeting.routes"
);
const followUpRoutes = require(
  "./modules/followUp/followUp.routes"
);
const activityRoutes = require(
  "./modules/activity/activity.routes"
);
const leadRoutes = require(
  "./modules/lead/lead.routes"
);
const leaveRoutes = require(
  "./modules/leave/leave.routes"
);
const expenseRoutes = require(
  "./modules/expense/expense.routes"
);
const notificationRoutes = require(
  "./modules/notification/notification.routes"
);
const analyticsRoutes = require(
  "./modules/analytics/analytics.routes"
);
const routeHistoryRoutes =
  require(
    "./modules/routeHistory/routeHistory.routes"
  );
  const dailyMovementRoutes =
require(
"./modules/dailyMovement/dailyMovement.routes"
);
const distributorRoutes = require("./modules/distributor/distributor.routes");
const hospitalRoutes = require("./modules/hospital/hospital.routes");
const territoryRoutes = require("./modules/territory/territory.routes");
const exportOperationsRoutes = require("./modules/exportOperations/exportOperations.routes");

const app = express();


app.use(cors({
  origin: [
    "http://localhost:5173", 
    "http://localhost:3000",
    "https://pharma-erp-pharma-frontend.rrh5yv.easypanel.host"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));

app.use("/api/company", companyRoutes);
app.use("/api/companies", companyRoutes);

app.use("/api/modules", moduleRoutes);
app.use("/api/features", featureRoutes);

app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(cookieParser());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Pharma ERP Backend Running'
  });
});

app.post('/api/activity-logs', (req, res) => {
  res.status(200).json({ success: true, message: 'Activity logged successfully' });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/test", testRoutes);
app.use(
  "/api/role-permissions",
  rolePermissionRoutes
);
app.use(
  "/api/role-test",
  roleTestRoutes
);

app.use("/api/manufacturers", manufacturerRoutes);
app.use("/api/brands", brandRoutes);
app.use(
  "/api/products",
  productRoutes
);

app.use("/api/hsn", hsnRoutes);
app.use("/api/gst", gstRoutes);
app.use("/api/packing-types", packingTypeRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api/schemes", schemeRoutes);
app.use("/api/compositions", compositionRoutes);

app.use(
  "/api/categories",
  productCategoryRoutes
);

app.use(
  "/api/batches",
  batchRoutes
);

app.use(
  "/api/inventory",
  inventoryRoutes
);

app.use(
  "/api/warehouses",
  warehouseRoutes
);

app.use(
  "/api/stock-movements",
  stockMovementRoutes
);

app.use(
  "/api/alerts/low-stock",
  lowStockAlertRoutes
);

app.use(
  "/api/alerts/expiring-batches",
  expiryMonitoringRoutes
);

app.use(
  "/api/alerts",
  deadStockRoutes
);

app.use(
  "/api/warehouse-transfers",
  warehouseTransferRoutes
);

app.use(
  "/api/inward-stock",
  inwardStockRoutes
);

app.use(
  "/api/outward-stock",
  outwardStockRoutes
);

app.use(
  "/api/suppliers",
  supplierRoutes
);

app.use(
  "/api/dispatches",
  dispatchRoutes
);


app.use(
  "/api/transport-challans",
  transportChallanRoutes
);

app.use(
  "/api/lr-tracking",
  lrTrackingRoutes
);

app.use(
  "/api/delivery-tracking",
  deliveryTrackingRoutes
);

app.use(
  "/api/stockists",
  stockistRoutes
);

app.use(
  "/api/retailers",
  retailerRoutes
);

app.use(
  "/api/invoices",
  invoiceRoutes
);

app.use(
  "/api/einvoices",
  eInvoiceRoutes
);

app.use(
  "/api/retailer-orders",
  retailerOrderRoutes
);

app.use(
  "/api/retailer-order-items",
  retailerOrderItemRoutes
);

  app.use(
    "/api/finance",
    financeRoutes
  );

app.use(
  "/api/credit-notes",
  creditNoteRoutes
);

app.use(
  "/api/outstanding",
  outstandingRoutes
);

app.use(
  "/api/accounting",
  accountingRoutes
);

app.use(
  "/api/mrs",
  mrRoutes
);

app.use(
  "/api/doctors",
  doctorRoutes
);

app.use(
  "/api/chemists",
  chemistRoutes
);

app.use(
  "/api/attendance",
  attendanceRoutes
);

app.use(
  "/api/doctor-visits",
  doctorVisitRoutes
);

app.use(
  "/api/chemist-visits",
  chemistVisitRoutes
);

app.use("/api/daily-reports", dailyReportRoutes);

app.use("/api/tour-plans", tourPlanRoutes);

app.use(
  "/api/targets",
  targetRoutes
);

app.use(
  "/api/meetings",
  meetingRoutes
);

app.use(
  "/api/follow-ups",
  followUpRoutes
);
app.use(
  "/api/activities",
  activityRoutes
);
app.use("/api/leads", leadRoutes);
app.use(
  "/api/leaves",
  leaveRoutes
);
app.use(
  "/api/expenses",
  expenseRoutes
);
app.use(
  "/api/notifications",
  notificationRoutes
);
app.use(
  "/api/analytics",
  analyticsRoutes
);
app.use(
  "/api/route-history",
  routeHistoryRoutes
);
app.use(
"/api/daily-movement",
dailyMovementRoutes
);


// app.use("/api/company", companyRoutes);
app.get("/test", async (req, res) => {
  const prisma = require("./config/db");
  try {
    // Delete the failed migration status from the prisma history table
    await prisma.$executeRawUnsafe(`
      DELETE FROM _prisma_migrations 
      WHERE migration_name = '20260711132000_add_inward_outward_supplier_warehouse_transfer'
    `);

    res.json({
      success: true,
      message: "Successfully cleared the failed migration state from the production database."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.use("/api/distributors", distributorRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use(
  "/api/territory",
  territoryRoutes
);

app.use(
  "/api/exports",
  exportOperationsRoutes
);

app.use("/api/sales-organization", salesOrganizationRoutes);
app.use("/api/target-allocations", targetAllocationRoutes);
app.use("/api/dashboard", hierarchyDashboardRoutes);
app.use("/api/dashboard/admin", superAdminDashboardRoutes);

app.use(
  "/api/permissions",
  permissionRoutes
);

module.exports = app;
