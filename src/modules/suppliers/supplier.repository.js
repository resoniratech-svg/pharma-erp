const prisma = require('../../config/db');

class SupplierRepository {
  async create(data) {
    const { inwardStocks, items, ...supplierData } = data;
    
    const payload = {
      data: {
        ...supplierData,
      }
    };

    const nestedItems = inwardStocks || items;
    if (nestedItems && Array.isArray(nestedItems) && nestedItems.length > 0) {
      payload.data.inwardStocks = {
        create: nestedItems
      };
    }

    return prisma.supplier.create(payload);
  }

  async findAll() {
    return prisma.supplier.findMany({
      include: {
        inwardStocks: true
      }
    });
  }

  async findById(id) {
    return prisma.supplier.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        inwardStocks: true
      }
    });
  }

  async update(id, data) {
    return prisma.supplier.update({
      where: { id: parseInt(id, 10) },
      data,
    });
  }

  async delete(id) {
    return prisma.supplier.delete({
      where: { id: parseInt(id, 10) },
    });
  }
}

module.exports = new SupplierRepository();
