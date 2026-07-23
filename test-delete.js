const prisma = require('./src/config/db');
const { deleteRetailerOrderRepo } = require('./src/modules/retailerOrder/retailerOrder.repository');

async function testDelete() {
  try {
    const order = await prisma.retailerOrder.findFirst();
    if (!order) {
      console.log('No orders to delete.');
      return;
    }
    console.log(`Trying to delete order id ${order.id}...`);
    await deleteRetailerOrderRepo(order.id);
    console.log('Successfully deleted!');
  } catch (err) {
    console.error('Failed to delete:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testDelete();
