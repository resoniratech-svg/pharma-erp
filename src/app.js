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