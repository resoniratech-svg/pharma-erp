const service = require(
  "./productCategory.service"
);

const createCategory = async (
  req,
  res
) => {
  try {
    const result =
      await service.createCategory(
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

const getAllCategories = async (
  req,
  res
) => {
  try {
    const result =
      await service.getAllCategories();

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

const getCategoryById = async (
  req,
  res
) => {
  try {

    const id = Number(req.params.id);

    const result =
      await service.getCategoryById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
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

module.exports = {
  createCategory,
  getAllCategories,
   getCategoryById,
};