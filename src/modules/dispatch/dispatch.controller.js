const service =
require("./dispatch.service");

const createDispatch =
async (req, res) => {

  try {

    const result =
      await service
      .createDispatchService(
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

const getDispatches =
async (req, res) => {

  try {

    const result =
      await service
      .getDispatchesService();

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

const getDispatchById =
async (req, res) => {

  try {

    const result =
      await service
      .getDispatchByIdService(
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
  createDispatch,
  getDispatches,
  getDispatchById,
};