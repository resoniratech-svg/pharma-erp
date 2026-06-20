const service = require(
  "./warehouseTransfer.service"
);

const createTransfer = async (
  req,
  res
) => {
  try {

    const result =
      await service
        .createTransferService(
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

const getTransfers = async (
  req,
  res
) => {

  const result =
    await service
      .getTransfersService();

  res.status(200).json({
    success: true,
    data: result,
  });

};

const getTransferById =
async (req, res) => {

  const result =
    await service
      .getTransferByIdService(
        Number(req.params.id)
      );

  res.status(200).json({
    success: true,
    data: result,
  });

};

module.exports = {
  createTransfer,
  getTransfers,
  getTransferById,
};