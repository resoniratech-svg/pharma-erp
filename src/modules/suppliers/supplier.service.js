const supplierRepository = require('./supplier.repository');

class SupplierService {
  async createSupplier(data) {
    return supplierRepository.create(data);
  }

  async getAllSuppliers() {
    return supplierRepository.findAll();
  }

  async getSupplierById(id) {
    return supplierRepository.findById(id);
  }

  async updateSupplier(id, data) {
    return supplierRepository.update(id, data);
  }

  async deleteSupplier(id) {
    return supplierRepository.delete(id);
  }
}

module.exports = new SupplierService();
