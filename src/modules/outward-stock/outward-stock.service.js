const outwardStockRepository = require('./outward-stock.repository');

class OutwardStockService {
  async createOutwardStock(data) {
    let { items, itemsCount, totalQuantity, totalValue } = data;
    
    if (items && Array.isArray(items)) {
      if (itemsCount === undefined) {
        data.itemsCount = items.length;
      }
      if (totalQuantity === undefined) {
        data.totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      }
      if (totalValue === undefined) {
        data.totalValue = items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.rate) || 0)), 0);
      }
    }

    return outwardStockRepository.create(data);
  }

  async getAllOutwardStocks() {
    return outwardStockRepository.findAll();
  }

  async getOutwardStockById(id) {
    return outwardStockRepository.findById(id);
  }

  async updateOutwardStock(id, data) {
    let { items, itemsCount, totalQuantity, totalValue } = data;
    
    if (items && Array.isArray(items)) {
      if (itemsCount === undefined) {
        data.itemsCount = items.length;
      }
      if (totalQuantity === undefined) {
        data.totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      }
      if (totalValue === undefined) {
        data.totalValue = items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.rate) || 0)), 0);
      }
    }

    return outwardStockRepository.update(id, data);
  }

  async deleteOutwardStock(id) {
    return outwardStockRepository.delete(id);
  }
}

module.exports = new OutwardStockService();
