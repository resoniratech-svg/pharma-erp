const inwardStockService = require('./inward-stock.service');

class InwardStockController {
  async createInwardStock(req, res) {
    try {
      const data = req.body;
      const inwardStock = await inwardStockService.createInwardStock(data);
      res.status(201).json({
        success: true,
        data: inwardStock
      });
    } catch (error) {
      console.error('Error creating InwardStock:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getAllInwardStocks(req, res) {
    try {
      const inwardStocks = await inwardStockService.getAllInwardStocks();
      res.status(200).json({
        success: true,
        data: inwardStocks
      });
    } catch (error) {
      console.error('Error fetching InwardStocks:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getInwardStockById(req, res) {
    try {
      const { id } = req.params;
      const inwardStock = await inwardStockService.getInwardStockById(id);
      if (!inwardStock) {
        return res.status(404).json({ success: false, message: 'InwardStock not found' });
      }
      res.status(200).json({
        success: true,
        data: inwardStock
      });
    } catch (error) {
      console.error('Error fetching InwardStock by ID:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new InwardStockController();
