const {
  findAllUsers,
  findUserById,
  updateUserById,
  softDeleteUser,
} = require("./user.repository");

const getAllUsers = async () => {
  return findAllUsers();
};

const getSingleUser = async (id) => {
  return findUserById(id);
};

const updateSingleUser = async (id, data) => {
  return updateUserById(id, data);
};

const deleteSingleUser = async (id) => {
  return softDeleteUser(id);
};

module.exports = {
  getAllUsers,
  getSingleUser,
  updateSingleUser,
  deleteSingleUser,
};