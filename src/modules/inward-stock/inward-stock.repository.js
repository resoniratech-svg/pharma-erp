const prisma = require('../../config/db');

class InwardStockRepository {
  async create(data) {
    const { items, ...inwardStockData } = data;
    return prisma.inwardStock.create({
      data: {
        ...inwardStockData,
        items: items && items.length > 0 ? {
          create: items
        } : undefined
      },
      include: {
        items: true,
        warehouse: true,
        supplier: true
      }
    });
  }

  async findAll() {
    return prisma.inwardStock.findMany({
      include: {
        items: true,
        warehouse: true,
        supplier: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findById(id) {
    return prisma.inwardStock.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        items: true,
        warehouse: true,
        supplier: true
      }
    });
  }
}

module.exports = new InwardStockRepository();
