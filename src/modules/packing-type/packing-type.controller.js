const service = require("./packing-type.service");

const createPackingType = async (req, res) => {
  try {
    const result = await service.createPackingType(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getPackingTypes = async (req, res) => {
  try {
    const result = await service.getPackingTypes();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getPackingTypeById = async (req, res) => {
  try {
    const result = await service.getPackingTypeById(Number(req.params.id));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updatePackingType = async (req, res) => {
  try {
    const result = await service.updatePackingType(Number(req.params.id), req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deletePackingType = async (req, res) => {
  try {
    await service.deletePackingType(Number(req.params.id));
    res.status(200).json({ success: true, message: "PackingType deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPackingType,
  getPackingTypes,
  getPackingTypeById,
  updatePackingType,
  deletePackingType,
};