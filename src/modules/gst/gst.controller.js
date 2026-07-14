const gstService = require("./gst.service");

const createGST = async (req, res) => {
  try {
    const result = await gstService.createGST(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getGSTs = async (req, res) => {
  try {
    const result = await gstService.getGSTs();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getGSTById = async (req, res) => {
  try {
    const result = await gstService.getGSTById(Number(req.params.id));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateGST = async (req, res) => {
  try {
    const result = await gstService.updateGST(Number(req.params.id), req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteGST = async (req, res) => {
  try {
    await gstService.deleteGST(Number(req.params.id));
    res.status(200).json({ success: true, message: "GST Record deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createGST,
  getGSTs,
  getGSTById,
  updateGST,
  deleteGST,
};
