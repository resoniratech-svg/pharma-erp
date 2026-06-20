const stockMovementService = require(
  "./stockMovement.service"
);

const createStockMovement = async (
  req,
  res
) => {
  try {

    const result =
      await stockMovementService
      .createStockMovementService(
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

const getStockMovements = async (
  req,
  res
) => {

  const result =
    await stockMovementService
    .getStockMovementsService();

  res.status(200).json({
    success: true,
    data: result,
  });

};

const getStockMovementById =
async (
  req,
  res
) => {

  try {

    const result =
      await stockMovementService
      .getStockMovementByIdService(
        Number(req.params.id)
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
  createStockMovement,
  getStockMovements,
  getStockMovementById,
};