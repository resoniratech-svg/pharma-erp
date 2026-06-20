const service = require("./chemistVisit.service");

const createChemistVisit = async (req, res) => {
  try {
    const data = await service.createChemistVisit(req.body);

    res.status(201).json({
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

const getAllChemistVisits = async (req, res) => {
  try {
    const data = await service.getAllChemistVisits();

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

const getChemistVisitById = async (req, res) => {
  try {
    const data = await service.getChemistVisitById(req.params.id);

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

const updateChemistVisit = async (req, res) => {
  try {
    const data = await service.updateChemistVisit(
      req.params.id,
      req.body
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

const deleteChemistVisit = async (req, res) => {
  try {
    const data = await service.deleteChemistVisit(req.params.id);

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

const getChemistVisitsByMr = async (req, res) => {
  try {
    const data = await service.getChemistVisitsByMr(
      req.params.mrId
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

const getChemistVisitsByChemist = async (req, res) => {
  try {
    const data = await service.getChemistVisitsByChemist(
      req.params.chemistId
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
  createChemistVisit,
  getAllChemistVisits,
  getChemistVisitById,
  updateChemistVisit,
  deleteChemistVisit,
  getChemistVisitsByMr,
  getChemistVisitsByChemist,
};