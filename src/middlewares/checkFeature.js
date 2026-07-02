const prisma = require("../config/db");

const checkFeature = (featureName) => {
  return async (req, res, next) => {
    try {

      console.log("REQ USER =>", req.user);

      const companyId =
        req.user.companyId;

        if (!companyId) {
  return next();
}

      const permission =
        await prisma.companyFeaturePermission.findFirst({
          where: {
            companyId,
            enabled: true,
            feature: {
              name: featureName,
            },
          },
        });

      if (!permission) {
        return res.status(403).json({
          success: false,
          message:
            `Feature '${featureName}' is not enabled for your company`,
        });
      }

      next();

    } catch (error) {

      return res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  };
};

module.exports = checkFeature;