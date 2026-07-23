const repository =
  require("./retailer.repository");

const prisma = require("../../config/db");

const createRetailerService = async (data) => {
  const { assignedDistributors, password, status, mobile, contactPerson, name, code, email } = data;

  let stockistId; // No hardcoded fallback
  if (assignedDistributors && assignedDistributors.length > 0) {
    const distCode = assignedDistributors[0].code;
    const distName = assignedDistributors[0].name || "Unknown Stockist";
    
    let stockist = await prisma.stockist.findUnique({
      where: { code: distCode }
    });
    
    if (!stockist) {
      // Create it if it doesn't exist
      stockist = await prisma.stockist.create({
        data: {
          code: distCode,
          name: distName,
          mobile: "0000000000" // Required field
        }
      });
    }
    
    stockistId = stockist.id;
  }
  
  // If still no stockist, fallback to first available
  if (!stockistId) {
    const firstStockist = await prisma.stockist.findFirst();
    if (firstStockist) {
      stockistId = firstStockist.id;
    } else {
      const dummyStockist = await prisma.stockist.create({
        data: {
          code: "DUMMY",
          name: "Dummy Stockist",
          mobile: "0000000000"
        }
      });
      stockistId = dummyStockist.id;
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
    const distName = assignedDistributors[0].name || "Unknown Stockist";
    let stockist = await prisma.stockist.findUnique({
      where: { code: distCode }
    });
    if (!stockist) {
      stockist = await prisma.stockist.create({
        data: {
          code: distCode,
          name: distName,
          mobile: "0000000000"
        }
      });
    }
    stockistId = stockist.id;
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