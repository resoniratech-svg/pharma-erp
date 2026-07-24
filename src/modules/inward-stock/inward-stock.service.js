const inwardStockRepository = require('./inward-stock.repository');

class InwardStockService {
  async createInwardStock(data) {
    return inwardStockRepository.create(data);
  }

  async getAllInwardStocks() {
    return inwardStockRepository.findAll();
  }

  async getInwardStockById(id) {
    return inwardStockRepository.findById(id);
  }

  async updateInwardStock(id, data) {
    return inwardStockRepository.update(id, data);
  }
}

module.exports = new InwardStockService();
