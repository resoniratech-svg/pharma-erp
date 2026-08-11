const service = require('./exportOperations.service');

const getCurrencies = async (req, res) => {
  try {
    const data = await service.getCurrenciesService();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCountryPricing = async (req, res) => {
  try {
    const data = await service.getCountryPricingService();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getExportCustomers = async (req, res) => {
  try {
    const data = await service.getExportCustomersService();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getExportOrders = async (req, res) => {
  try {
    const data = await service.getExportOrdersService();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    res.status(200).json({ 
      success: true, 
      message: 'File uploaded successfully', 
      fileUrl: `/uploads/exports/${req.file.filename}` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCurrencies,
  getCountryPricing,
  getExportCustomers,
  getExportOrders,
  uploadDocument,
  createCurrency: async (req, res) => {
    try {
      const data = await service.createCurrencyService(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  createCountryPricing: async (req, res) => {
    try {
      const data = await service.createCountryPricingService(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  createExportCustomer: async (req, res) => {
    try {
      const data = await service.createExportCustomerService(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  createExportOrder: async (req, res) => {
    try {
      const data = await service.createExportOrderService(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  updateExportOrderStatus: async (req, res) => {
    try {
      const data = await service.updateExportOrderStatusService(req.params.id, req.body.status);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  getDashboardStats: async (req, res) => {
    try {
      const data = await service.getDashboardStatsService();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  updateCurrency: async (req, res) => {
    try {
      const data = await service.updateCurrencyService(req.params.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  deleteCurrency: async (req, res) => {
    try {
      await service.deleteCurrencyService(req.params.id);
      res.status(200).json({ success: true, message: 'Deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  updateCountryPricing: async (req, res) => {
    try {
      const data = await service.updateCountryPricingService(req.params.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  deleteCountryPricing: async (req, res) => {
    try {
      await service.deleteCountryPricingService(req.params.id);
      res.status(200).json({ success: true, message: 'Deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  updateExportCustomer: async (req, res) => {
    try {
      const data = await service.updateExportCustomerService(req.params.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  deleteExportCustomer: async (req, res) => {
    try {
      await service.deleteExportCustomerService(req.params.id);
      res.status(200).json({ success: true, message: 'Deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  updateExportOrder: async (req, res) => {
    try {
      const data = await service.updateExportOrderService(req.params.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  deleteExportOrder: async (req, res) => {
    try {
      await service.deleteExportOrderService(req.params.id);
      res.status(200).json({ success: true, message: 'Deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
