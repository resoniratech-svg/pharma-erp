const gstRepository = require("./gst.repository");

const createGST = async (data) => {
  return await gstRepository.createGST(data);
};

const getGSTs = async () => {
  return await gstRepository.getGSTs();
};

const getGSTById = async (id) => {
  const gst = await gstRepository.getGSTById(id);
  if (!gst) throw new Error("GST Record not found");
  return gst;
};

const updateGST = async (id, data) => {
  const gst = await gstRepository.getGSTById(id);
  if (!gst) throw new Error("GST Record not found");
  return await gstRepository.updateGST(id, data);
};

const deleteGST = async (id) => {
  const gst = await gstRepository.getGSTById(id);
  if (!gst) throw new Error("GST Record not found");
  return await gstRepository.deleteGST(id);
};

module.exports = {
  createGST,
  getGSTs,
  getGSTById,
  updateGST,
  deleteGST,
};
