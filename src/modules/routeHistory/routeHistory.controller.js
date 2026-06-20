const service = require(
  "./routeHistory.service"
);

const getRouteHistory = async (
  req,
  res
) => {
  try {
    const { mrId, date } = req.params;

    const data =
      await service.getRouteHistoryService(
        mrId,
        date
      );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getRouteHistory,
};