const hsnService = require("./hsn.service");

const createHSN = async (req, res) => {
  try {
    const result = await hsnService.createHSN(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getHSNs = async (req, res) => {
  try {
    const result = await hsnService.getHSNs();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getHSNById = async (req, res) => {
  try {
    const result = await hsnService.getHSNById(Number(req.params.id));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateHSN = async (req, res) => {
  try {
    const result = await hsnService.updateHSN(Number(req.params.id), req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteHSN = async (req, res) => {
  try {
    await hsnService.deleteHSN(Number(req.params.id));
    res.status(200).json({ success: true, message: "HSN Code deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createHSN,
  getHSNs,
  getHSNById,
  updateHSN,
  deleteHSN,
};
