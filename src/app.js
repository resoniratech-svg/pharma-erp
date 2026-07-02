const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/user.routes");

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

const warehouseTransferRoutes =
require(
"./modules/warehouseTransfer/warehouseTransfer.routes"
);

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

const retailerOrderRoutes =
require(
"./modules/retailerOrder/retailerOrder.routes"
);

const retailerOrderItemRoutes =
  require("./modules/retailerOrderItem/retailerOrderItem.routes");

  const paymentCollectionRoutes =
  require("./modules/paymentCollection/paymentCollection.routes");

  const ledgerRoutes =
require("./modules/ledger/ledger.routes");

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

const app = express();


app.use(cors());
app.use(express.json());

app.use("/api/company", companyRoutes);

app.use("/api/modules", moduleRoutes);
app.use("/api/features", featureRoutes);

app.use(express.urlencoded({ extended: true }));

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

app.use(
  "/api/products",
  productRoutes
);

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
  "/api/retailer-orders",
  retailerOrderRoutes
);

app.use(
  "/api/retailer-order-items",
  retailerOrderItemRoutes
);

app.use(
  "/api/payment-collections",
  paymentCollectionRoutes
);

app.use(
  "/api/ledgers",
  ledgerRoutes
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
app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "API Working",
  });
});

app.use(
  "/api/permissions",
  permissionRoutes
);

module.exports = app;