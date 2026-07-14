const hsnRepository = require("./hsn.repository");

const createHSN = async (data) => {
  return await hsnRepository.createHSN(data);
};

const getHSNs = async () => {
  return await hsnRepository.getHSNs();
};

const getHSNById = async (id) => {
  const hsn = await hsnRepository.getHSNById(id);
  if (!hsn) throw new Error("HSN Code not found");
  return hsn;
};

const updateHSN = async (id, data) => {
  const hsn = await hsnRepository.getHSNById(id);
  if (!hsn) throw new Error("HSN Code not found");
  return await hsnRepository.updateHSN(id, data);
};

const deleteHSN = async (id) => {
  const hsn = await hsnRepository.getHSNById(id);
  if (!hsn) throw new Error("HSN Code not found");
  return await hsnRepository.deleteHSN(id);
};

module.exports = {
  createHSN,
  getHSNs,
  getHSNById,
  updateHSN,
  deleteHSN,
};
