const prisma = require("../../config/db");

const getHospitalsRepo = async () => {
  return prisma.hospital.findMany();
};

module.exports = {
  getHospitalsRepo,
};
