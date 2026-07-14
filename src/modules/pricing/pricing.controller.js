const service = require("./pricing.service");

const createPricing = async (req, res) => {
  try {
    const result = await service.createPricing(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getPricings = async (req, res) => {
  try {
    const result = await service.getPricings();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getPricingById = async (req, res) => {
  try {
    const result = await service.getPricingById(Number(req.params.id));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updatePricing = async (req, res) => {
  try {
    const result = await service.updatePricing(Number(req.params.id), req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deletePricing = async (req, res) => {
  try {
    await service.deletePricing(Number(req.params.id));
    res.status(200).json({ success: true, message: "Pricing deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPricing,
  getPricings,
  getPricingById,
  updatePricing,
  deletePricing,
};