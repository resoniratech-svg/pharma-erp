const repository =
  require("./retailer.repository");

const prisma = require("../../config/db");
const bcrypt = require("bcrypt");

const createRetailerService = async (data) => {
  const { address, assignedDistributors, password, status, mobile, contactPerson, name, code, email, drugLicenseNumber, companyPan, bankName, accountName, accountNumber, ifscCode } = data;

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
    address: address || "",
    isActive: status !== 'Inactive',
    stockistId: stockistId,
    drugLicenseNumber: drugLicenseNumber || "",
    companyPan: companyPan || "",
    bankName: bankName || "",
    accountName: accountName || "",
    accountNumber: accountNumber || "",
    ifscCode: ifscCode || ""
  };

  const retailer = await repository.createRetailerRepo(mappedData);

  // Automatically create user login credentials for retailer
  if (password) {
    try {
      const userEmail = email && email.trim() ? email.toLowerCase().trim() : `${code.toLowerCase()}@retailer.local`;
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: userEmail },
            { linkedRetailerCode: code }
          ]
        }
      });

      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: name,
            password: hashedPassword,
            role: 'RETAILER',
            mobile: mobile || null,
            linkedRetailerCode: code,
            isActive: status !== 'Inactive'
          }
        });
      } else {
        await prisma.user.create({
          data: {
            name: name,
            email: userEmail,
            password: hashedPassword,
            role: 'RETAILER',
            mobile: mobile || null,
            linkedRetailerCode: code,
            isActive: status !== 'Inactive'
          }
        });
      }
    } catch (err) {
      console.error("Failed to create user record for retailer:", err);
    }
  }

  return retailer;
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
  const { address, assignedDistributors, password, status, mobile, contactPerson, name, email, drugLicenseNumber, companyPan, bankName, accountName, accountNumber, ifscCode } = data;
  
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
  if (address !== undefined) mappedData.address = address;
  if (status !== undefined) mappedData.isActive = status !== 'Inactive';
  if (stockistId !== undefined) mappedData.stockistId = stockistId;
  if (drugLicenseNumber !== undefined) mappedData.drugLicenseNumber = drugLicenseNumber;
  if (companyPan !== undefined) mappedData.companyPan = companyPan;
  if (bankName !== undefined) mappedData.bankName = bankName;
  if (accountName !== undefined) mappedData.accountName = accountName;
  if (accountNumber !== undefined) mappedData.accountNumber = accountNumber;
  if (ifscCode !== undefined) mappedData.ifscCode = ifscCode;

  const updatedRetailer = await repository.updateRetailerRepo(id, mappedData);

  // Also sync user login credentials if exists or if password updated
  try {
    const retailer = await repository.getRetailerByIdRepo(id);
    if (retailer && retailer.code) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { linkedRetailerCode: retailer.code },
            ...(retailer.email ? [{ email: retailer.email.toLowerCase().trim() }] : [])
          ]
        }
      });

      if (existingUser) {
        const userUpdates = {};
        if (name) userUpdates.name = name;
        if (mobile) userUpdates.mobile = mobile;
        if (status !== undefined) userUpdates.isActive = status !== 'Inactive';
        if (email) userUpdates.email = email.toLowerCase().trim();
        if (password) {
          userUpdates.password = await bcrypt.hash(password, 10);
        }
        await prisma.user.update({
          where: { id: existingUser.id },
          data: userUpdates
        });
      } else if (password) {
        const userEmail = (email || retailer.email || `${retailer.code.toLowerCase()}@retailer.local`).toLowerCase().trim();
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
          data: {
            name: name || retailer.name,
            email: userEmail,
            password: hashedPassword,
            role: 'RETAILER',
            mobile: mobile || retailer.mobile || null,
            linkedRetailerCode: retailer.code,
            isActive: status !== undefined ? status !== 'Inactive' : retailer.isActive
          }
        });
      }
    }
  } catch (err) {
    console.error("Failed to update user record for retailer:", err);
  }

  return updatedRetailer;
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