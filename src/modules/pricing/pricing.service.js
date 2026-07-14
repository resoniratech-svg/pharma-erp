const repository = require("./pricing.repository");

const createPricing = async (data) => {
  return await repository.createPricing(data);
};

const getPricings = async () => {
  return await repository.getPricings();
};

const getPricingById = async (id) => {
  const item = await repository.getPricingById(id);
  if (!item) throw new Error("Pricing not found");
  return item;
};

const updatePricing = async (id, data) => {
  const item = await repository.getPricingById(id);
  if (!item) throw new Error("Pricing not found");
  return await repository.updatePricing(id, data);
};

const deletePricing = async (id) => {
  const item = await repository.getPricingById(id);
  if (!item) throw new Error("Pricing not found");
  return await repository.deletePricing(id);
};

module.exports = {
  createPricing,
  getPricings,
  getPricingById,
  updatePricing,
  deletePricing,
};