const prisma = require("../config/db");

const checkRoleFeature = (featureName) => {
  return async (req, res, next) => {
    try {

      const companyId = req.user.companyId;
      const role = req.user.role;

      const permission =
        await prisma.rolePermission.findFirst({
          where: {
            companyId,
            role,
            feature: {
              name: featureName,
            },
          },
        });

      if (!permission) {
        return res.status(403).json({
          success: false,
          message:
            `Role '${role}' does not have access to '${featureName}'`,
        });
      }

      next();

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  };
};

module.exports = checkRoleFeature;