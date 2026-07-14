const service = require("./scheme.service");

const createScheme = async (req, res) => {
  try {
    const result = await service.createScheme(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getSchemes = async (req, res) => {
  try {
    const result = await service.getSchemes();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getSchemeById = async (req, res) => {
  try {
    const result = await service.getSchemeById(Number(req.params.id));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateScheme = async (req, res) => {
  try {
    const result = await service.updateScheme(Number(req.params.id), req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteScheme = async (req, res) => {
  try {
    await service.deleteScheme(Number(req.params.id));
    res.status(200).json({ success: true, message: "Scheme deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createScheme,
  getSchemes,
  getSchemeById,
  updateScheme,
  deleteScheme,
};