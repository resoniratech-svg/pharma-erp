const repository =
  require("./retailer.repository");

const prisma = require("../../config/db");

const createRetailerService = async (data) => {
  const { assignedDistributors, password, status, mobile, contactPerson, name, code, email } = data;

  let stockistId = 1; // Fallback
  if (assignedDistributors && assignedDistributors.length > 0) {
    const distCode = assignedDistributors[0].code;
    const stockist = await prisma.stockist.findUnique({
      where: { code: distCode }
    });
    if (stockist) {
      stockistId = stockist.id;
    }
  }

  const mappedData = {
    code: code,
    name: name,
    contactPerson: contactPerson,
    mobile: mobile,
    email: email || "",
    isActive: status !== 'Inactive',
    stockistId: stockistId
  };

  return repository.createRetailerRepo(mappedData);
};

const getRetailersService =
  async () => {
    return repository
      .getRetailersRepo();
  };

const getRetailerByIdService =
  async (id) => {
    return repository
      .getRetailerByIdRepo(id);
  };

const updateRetailerService = async (id, data) => {
  const { assignedDistributors, password, status, mobile, contactPerson, name, email } = data;
  
  let stockistId;
  if (assignedDistributors && assignedDistributors.length > 0) {
    const distCode = assignedDistributors[0].code;
    const stockist = await prisma.stockist.findUnique({
      where: { code: distCode }
    });
    if (stockist) {
      stockistId = stockist.id;
    }
  }

  const mappedData = {};
  if (name !== undefined) mappedData.name = name;
  if (contactPerson !== undefined) mappedData.contactPerson = contactPerson;
  if (mobile !== undefined) mappedData.mobile = mobile;
  if (email !== undefined) mappedData.email = email;
  if (status !== undefined) mappedData.isActive = status !== 'Inactive';
  if (stockistId !== undefined) mappedData.stockistId = stockistId;

  return repository.updateRetailerRepo(id, mappedData);
};

const deleteRetailerService =
  async (id) => {
    return repository
      .deleteRetailerRepo(id);
  };

const getRetailersByStockistService =
  async (stockistId) => {
    return repository
      .getRetailersByStockistRepo(
        stockistId
      );
  };

module.exports = {
  createRetailerService,
  getRetailersService,
  getRetailerByIdService,
  updateRetailerService,
  deleteRetailerService,
  getRetailersByStockistService,
};