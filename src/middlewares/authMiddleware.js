const { tenantContext } = require('../utils/tenantContext');
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    // Check device session concurrency for MEDICAL_REPRESENTATIVE role
    if (decoded.role === "MEDICAL_REPRESENTATIVE" && decoded.deviceId) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { currentDeviceId: true },
      });
      if (user && user.currentDeviceId && user.currentDeviceId !== decoded.deviceId) {
        return res.status(401).json({
          success: false,
          message: "Session terminated. You have logged in on another device.",
          code: "SESSION_TERMINATED",
        });
      }
    }

    
    const companyId = decoded.companyId || 1;
    const role = decoded.role;
    
    // Wrap next() in tenantContext
    tenantContext.run({ companyId, role }, () => {
      next();
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

module.exports = authMiddleware;