const repo = require("./composition.repository");

const getAllCompositions = () => repo.getAllCompositionsRepo();

const getCompositionById = (id) => repo.getCompositionByIdRepo(id);

const createComposition = (data) => repo.createCompositionRepo(data);

const updateComposition = (id, data) => repo.updateCompositionRepo(id, data);

const deleteComposition = (id) => repo.deleteCompositionRepo(id);

module.exports = {
  getAllCompositions,
  getCompositionById,
  createComposition,
  updateComposition,
  deleteComposition,
};
