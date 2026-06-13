const repository = require(
  "./batch.repository"
);

const createBatchService = (
  data
) => {
  return repository.createBatchRepo(
    data
  );
};

const getBatchesService = () => {
  return repository.getBatchesRepo();
};

const getBatchById = (
  id
) => {
  return repository.getBatchById(
    id
  );
};

const updateBatch = (
  id,
  data
) => {
  return repository.updateBatch(
    id,
    data
  );
};

const deleteBatch = (
  id
) => {
  return repository.deleteBatch(
    id
  );
};

module.exports = {
  createBatchService,
  getBatchesService,
  getBatchById,
  updateBatch,
  deleteBatch,
};