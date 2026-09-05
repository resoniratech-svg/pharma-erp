const prisma = require('../../config/db');

const getCurrenciesRepo = async () => {
  return prisma.currencyMaster.findMany();
};

const getCountryPricingRepo = async () => {
  return prisma.countryPricing.findMany({ include: { product: true, currency: true } });
};

const getExportCustomersRepo = async () => {
  return prisma.exportCustomer.findMany({ include: { currency: true } });
};

const getExportOrdersRepo = async () => {
  return prisma.exportOrder.findMany({ include: { customer: true, currency: true, documents: true }, orderBy: { createdAt: 'desc' } });
};

const createCurrencyRepo = async (data) => {
  return prisma.currencyMaster.create({
    data: {
      code: data.code.toUpperCase(),
      name: data.name,
      exchangeRate: parseFloat(data.exchangeRate)
    }
  });
};

const createCountryPricingRepo = async (data) => {
  return prisma.countryPricing.create({
    data: {
      country: data.country,
      productId: parseInt(data.productId),
      currencyId: parseInt(data.currencyId),
      price: parseFloat(data.price)
    }
  });
};

const createExportCustomerRepo = async (data) => {
  return prisma.exportCustomer.create({
    data: {
      name: data.name,
      country: data.country,
      iecCode: data.iecCode,
      currencyId: parseInt(data.currencyId),
      billingAddress: data.billingAddress,
      shippingAddress: data.shippingAddress
    }
  });
};

const createExportOrderRepo = async (data) => {
  // Fetch customer to get their default currency and exchange rate if not explicitly passed
  let currencyId = data.currencyId;
  let exchangeRateApplied = data.exchangeRateApplied;

  if (!currencyId || !exchangeRateApplied) {
    const customer = await prisma.exportCustomer.findUnique({
      where: { id: parseInt(data.customerId) },
      include: { currency: true }
    });
    if (customer && customer.currency) {
      currencyId = customer.currency.id;
      exchangeRateApplied = customer.currency.exchangeRate;
    }
  }

  const totalAmount = parseFloat(data.totalAmount || 0);
  const totalAmountINR = totalAmount * (parseFloat(exchangeRateApplied) || 1);

  return prisma.exportOrder.create({
    data: {
      orderNumber: data.orderNumber || `EXP-${Date.now()}`,
      customerId: parseInt(data.customerId),
      currencyId: parseInt(currencyId),
      exchangeRateApplied: parseFloat(exchangeRateApplied),
      shippingMode: data.shippingMode,
      portOfLoading: data.portOfLoading,
      destinationPort: data.destinationPort,
      totalAmount: totalAmount,
      totalAmountINR: totalAmountINR
    }
  });
};

const updateExportOrderStatusRepo = async (id, status) => {
  return prisma.exportOrder.update({
    where: { id: parseInt(id) },
    data: { status }
  });
};

const getDashboardStatsRepo = async () => {
  const orders = await prisma.exportOrder.findMany({
    where: { status: 'Cleared' }
  });
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmountINR, 0);

  const activeShipments = await prisma.exportOrder.count({
    where: { status: { in: ['Processing', 'Shipped'] } }
  });

  const totalCustomers = await prisma.exportCustomer.count();
  
  const uniqueCountries = await prisma.exportCustomer.groupBy({
    by: ['country'],
  });

  // Recent shipments
  const recentShipments = await prisma.exportOrder.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  return {
    totalRevenue,
    activeShipments,
    totalCustomers,
    countriesReached: uniqueCountries.length,
    recentShipments
  };
};

const updateCurrencyRepo = async (id, data) => {
  return prisma.currencyMaster.update({
    where: { id: parseInt(id) },
    data: {
      code: data.code?.toUpperCase(),
      name: data.name,
      exchangeRate: data.exchangeRate ? parseFloat(data.exchangeRate) : undefined
    }
  });
};

const deleteCurrencyRepo = async (id) => {
  return prisma.currencyMaster.delete({
    where: { id: parseInt(id) }
  });
};

const updateCountryPricingRepo = async (id, data) => {
  return prisma.countryPricing.update({
    where: { id: parseInt(id) },
    data: {
      country: data.country,
      productId: data.productId ? parseInt(data.productId) : undefined,
      currencyId: data.currencyId ? parseInt(data.currencyId) : undefined,
      price: data.price ? parseFloat(data.price) : undefined
    }
  });
};

const deleteCountryPricingRepo = async (id) => {
  return prisma.countryPricing.delete({
    where: { id: parseInt(id) }
  });
};

const updateExportCustomerRepo = async (id, data) => {
  return prisma.exportCustomer.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      country: data.country,
      iecCode: data.iecCode,
      currencyId: data.currencyId ? parseInt(data.currencyId) : undefined,
      billingAddress: data.billingAddress,
      shippingAddress: data.shippingAddress
    }
  });
};

const deleteExportCustomerRepo = async (id) => {
  return prisma.exportCustomer.delete({
    where: { id: parseInt(id) }
  });
};

const updateExportOrderRepo = async (id, data) => {
  return prisma.exportOrder.update({
    where: { id: parseInt(id) },
    data: {
      customerId: data.customerId ? parseInt(data.customerId) : undefined,
      totalAmount: data.totalAmount ? parseFloat(data.totalAmount) : undefined,
      shippingMode: data.shippingMode,
      portOfLoading: data.portOfLoading,
      destinationPort: data.destinationPort
    }
  });
};

const deleteExportOrderRepo = async (id) => {
  return prisma.exportOrder.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = {
  getCurrenciesRepo,
  getCountryPricingRepo,
  getExportCustomersRepo,
  getExportOrdersRepo,
  createCurrencyRepo,
  createCountryPricingRepo,
  createExportCustomerRepo,
  createExportOrderRepo,
  updateExportOrderStatusRepo,
  getDashboardStatsRepo,
  updateCurrencyRepo,
  deleteCurrencyRepo,
  updateCountryPricingRepo,
  deleteCountryPricingRepo,
  updateExportCustomerRepo,
  deleteExportCustomerRepo,
  updateExportOrderRepo,
  deleteExportOrderRepo
};
