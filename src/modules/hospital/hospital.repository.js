const prisma = require("../../config/db");

const getHospitalsRepo = async () => {
  return prisma.hospital.findMany();
};

const createHospitalRepo = async (data) => {
  return prisma.hospital.create({
    data,
  });
};

module.exports = {
  getHospitalsRepo,
  createHospitalRepo,
};
