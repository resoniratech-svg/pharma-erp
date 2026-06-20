const service = require("./inventory.service");

const createInventory = async (req, res) => {
  try {
    const inventory =
      await service.createInventoryService(
        req.body
      );

    res.status(201).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getInventories = async (
  req,
  res
) => {
  try {
    const inventories =
      await service.getInventoriesService();

    res.status(200).json({
      success: true,
      data: inventories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getInventoryById = async (
  req,
  res
) => {
  try {
    const inventory =
      await service.getInventoryByIdService(
        Number(req.params.id)
      );

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateInventory = async (
  req,
  res
) => {
  try {
    const inventory =
      await service.updateInventoryService(
        Number(req.params.id),
        req.body
      );

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteInventory = async (
  req,
  res
) => {
  try {
    await service.deleteInventoryService(
      Number(req.params.id)
    );

    res.status(200).json({
      success: true,
      message:
        "Inventory deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getInventoryByCompany =
  async (req, res) => {
    try {
      const companyId = Number(
        req.params.companyId
      );

      const inventories =
        await service.getInventoryByCompanyService(
          companyId
        );

      res.status(200).json({
        success: true,
        data: inventories,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

module.exports = {
  createInventory,
  getInventories,
  getInventoryById,
  updateInventory,
  deleteInventory,
  getInventoryByCompany,
};