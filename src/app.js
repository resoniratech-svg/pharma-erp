const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/user.routes");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");


const app = express();


app.use(cors());

app.use(express.json());
app.use("/api/auth", authRoutes);

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


app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "API Working",
  });
});

module.exports = app;