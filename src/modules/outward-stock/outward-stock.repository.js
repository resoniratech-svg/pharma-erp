const prisma = require('../../config/db');

class OutwardStockRepository {
  async create(data) {
    const { items, ...outwardStockData } = data;
    return prisma.outwardStock.create({
      data: {
        ...outwardStockData,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
        warehouse: true,
      },
    });
  }

  async findAll() {
    return prisma.outwardStock.findMany({
      include: {
        items: true,
        warehouse: true,
      },
      orderBy: {
        createdAt: 'desc',
      }
    });
  }

  async findById(id) {
    return prisma.outwardStock.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          include: {
            product: true,
            batch: true,
          }
        },
        warehouse: true,
      },
    });
  }

  async update(id, data) {
    const { items, ...outwardStockData } = data;
    
    const updateData = { ...outwardStockData };
    if (items) {
       updateData.items = {
         deleteMany: {},
         create: items,
       };
    }

    return prisma.outwardStock.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        items: true,
        warehouse: true,
      },
    });
  }

  async delete(id) {
    return prisma.outwardStock.delete({
      where: { id: parseInt(id) },
    });
  }
}

module.exports = new OutwardStockRepository();
