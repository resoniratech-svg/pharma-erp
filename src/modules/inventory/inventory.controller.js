const inventoryService = require(
  "./inventory.service"
);

const createInventory = async (
  req,
  res
) => {
  try {

    const result =
      await inventoryService.createInventoryService(
        req.body
      );

    res.status(201).json({
      success: true,
      data: result,
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

    const result =
      await inventoryService.getInventoriesService();

    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {

    res.status(400).json({
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

    const result =
      await inventoryService.getInventoryById(
        Number(req.params.id)
      );

    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          "Inventory not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {

    res.status(400).json({
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

    const result =
      await inventoryService.updateInventory(
        Number(req.params.id),
        req.body
      );

    res.status(200).json({
      success: true,
      data: result,
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

    await inventoryService.deleteInventory(
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

const getInventoryByCompany = async (
  req,
  res
) => {
  try {

    const companyId =
      Number(req.params.companyId);

    const result =
      await inventoryService.getInventoryByCompanyService(
        companyId
      );

    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {

    res.status(400).json({
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