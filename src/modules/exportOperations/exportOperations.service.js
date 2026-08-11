const repository = require('./exportOperations.repository');

const getCurrenciesService = async () => {
  return await repository.getCurrenciesRepo();
};

const getCountryPricingService = async () => {
  return await repository.getCountryPricingRepo();
};

const getExportCustomersService = async () => {
  return await repository.getExportCustomersRepo();
};

const getExportOrdersService = async () => {
  return await repository.getExportOrdersRepo();
};

const createCurrencyService = async (data) => {
  let exchangeRate = data.exchangeRate || 1;
  
  if (data.code && data.code.toUpperCase() !== 'INR') {
    try {
      const response = await fetch(`https://api.frankfurter.app/latest?from=${data.code.toUpperCase()}&to=INR`);
      if (response.ok) {
        const result = await response.json();
        if (result && result.rates && result.rates.INR) {
          exchangeRate = result.rates.INR;
        }
      }
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error.message);
      // Fallback to manual rate if API fails
    }
  }

  const payload = {
    ...data,
    exchangeRate
  };
  return await repository.createCurrencyRepo(payload);
};

const createCountryPricingService = async (data) => {
  return await repository.createCountryPricingRepo(data);
};

const createExportCustomerService = async (data) => {
  return await repository.createExportCustomerRepo(data);
};

const createExportOrderService = async (data) => {
  // We need to fetch the customer to get the currency ID and exchange rate
  // This logic is better placed in the repository or handled by the frontend sending the correct IDs.
  // We'll pass the payload directly to the repository to handle creation.
  return await repository.createExportOrderRepo(data);
};

const updateExportOrderStatusService = async (id, status) => {
  return await repository.updateExportOrderStatusRepo(id, status);
};

const getDashboardStatsService = async () => {
  return await repository.getDashboardStatsRepo();
};

const updateCurrencyService = async (id, data) => {
  let exchangeRate = data.exchangeRate;
  
  if (data.code && data.code.toUpperCase() !== 'INR') {
    try {
      const response = await fetch(`https://api.frankfurter.app/latest?from=${data.code.toUpperCase()}&to=INR`);
      if (response.ok) {
        const result = await response.json();
        if (result && result.rates && result.rates.INR) {
          exchangeRate = result.rates.INR;
        }
      }
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error.message);
    }
  }

  const payload = {
    ...data,
    ...(exchangeRate ? { exchangeRate } : {})
  };
  return await repository.updateCurrencyRepo(id, payload);
};

const deleteCurrencyService = async (id) => {
  return await repository.deleteCurrencyRepo(id);
};

const updateCountryPricingService = async (id, data) => {
  return await repository.updateCountryPricingRepo(id, data);
};

const deleteCountryPricingService = async (id) => {
  return await repository.deleteCountryPricingRepo(id);
};

const updateExportCustomerService = async (id, data) => {
  return await repository.updateExportCustomerRepo(id, data);
};

const deleteExportCustomerService = async (id) => {
  return await repository.deleteExportCustomerRepo(id);
};

const updateExportOrderService = async (id, data) => {
  return await repository.updateExportOrderRepo(id, data);
};

const deleteExportOrderService = async (id) => {
  return await repository.deleteExportOrderRepo(id);
};

module.exports = {
  getCurrenciesService,
  getCountryPricingService,
  getExportCustomersService,
  getExportOrdersService,
  createCurrencyService,
  createCountryPricingService,
  createExportCustomerService,
  createExportOrderService,
  updateExportOrderStatusService,
  getDashboardStatsService,
  updateCurrencyService,
  deleteCurrencyService,
  updateCountryPricingService,
  deleteCountryPricingService,
  updateExportCustomerService,
  deleteExportCustomerService,
  updateExportOrderService,
  deleteExportOrderService
};
