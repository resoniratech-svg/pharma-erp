const prisma = require("../../config/db");
const repository = require("./invoice.repository");

const createInvoiceService = async (data) => {
  let retailerId = data.retailerId && !isNaN(parseInt(data.retailerId, 10)) ? parseInt(data.retailerId, 10) : null;
  
  if (retailerId) {
    const exists = await prisma.retailer.findUnique({ where: { id: retailerId } });
    if (!exists) retailerId = null;
  }

  if (!retailerId && data.customerName) {
    const found = await prisma.retailer.findFirst({
      where: { name: { equals: data.customerName, mode: 'insensitive' } }
    });
    if (found) retailerId = found.id;
  }

  if (!retailerId) {
    let fallbackRetailer = await prisma.retailer.findFirst();
    if (!fallbackRetailer) {
      let stockist = await prisma.stockist.findFirst();
      if (!stockist) {
        stockist = await prisma.stockist.create({
          data: {
            name: "Default Stockist",
            code: "STK-DEFAULT",
            mobile: "9999999999"
          }
        });
      }
      fallbackRetailer = await prisma.retailer.create({
        data: {
          stockistId: stockist.id,
          name: data.customerName || "Default Retailer",
          code: `RET-${Date.now()}`,
          mobile: "9999999999",
          address: "Main Store"
        }
      });
    }
    retailerId = fallbackRetailer.id;
  }

  const payload = {
    invoiceNumber: data.invoiceNumber || data.invoiceNo || `GST-${Date.now()}`,
    retailerId: retailerId,
    subTotal: Number(data.subTotal || 0),
    gstAmount: Number(data.gstAmount || 0),
    totalAmount: Number(data.totalAmount || data.grandTotal || 0),
    status: data.status || 'PENDING'
  };

  return repository.createInvoiceRepo(payload);
};

const getInvoicesService =
  async () => {

    return repository
      .getInvoicesRepo();

  };

const getInvoiceByIdService =
  async (id) => {

    return repository
      .getInvoiceByIdRepo(id);

  };

const updateInvoiceService =
  async (id, data) => {

    return repository
      .updateInvoiceRepo(
        id,
        data
      );

  };

const deleteInvoiceService =
  async (id) => {

    return repository
      .deleteInvoiceRepo(id);

  };

module.exports = {
  createInvoiceService,
  getInvoicesService,
  getInvoiceByIdService,
  updateInvoiceService,
  deleteInvoiceService,
};