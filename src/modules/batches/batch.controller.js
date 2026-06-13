const batchService = require(
  "./batch.service"
);

const createBatch = async (
  req,
  res
) => {
  try {

    const payload = {
  ...req.body,
  manufacturingDate: new Date(
    req.body.manufacturingDate
  ),
  expiryDate: new Date(
    req.body.expiryDate
  ),
};

const result =
  await batchService.createBatchService(
    payload
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

const getBatches = async (
  req,
  res
) => {
  try {

    const result =
      await batchService.getBatchesService();

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

const getBatchById = async (
  req,
  res
) => {
  try {

    const result =
      await batchService.getBatchById(
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

const updateBatch = async (
  req,
  res
) => {
  try {

    const result =
      await batchService.updateBatch(
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

const deleteBatch = async (
  req,
  res
) => {
  try {

    await batchService.deleteBatch(
      Number(req.params.id)
    );

    res.status(200).json({
      success: true,
      message:
        "Batch deleted successfully",
    });

  } catch (error) {

    res.status(400).json({
      success: false,
      message: error.message,
    });

  }
};

module.exports = {
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
};