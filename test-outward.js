const outwardStockService = require('./src/modules/outward-stock/outward-stock.service');
async function test() {
  try {
    const data = {
      dispatchNo: 'OUT-2026-001',
      date: new Date().toISOString(),
      client: 'Care Pharmacy',
      warehouseId: 1, // Make sure warehouse 1 exists
      referenceNumber: '123',
      itemsCount: 1,
      totalQuantity: 10,
      totalValue: 100,
      status: 'Processing',
      items: [
        {
          productId: 7, // Paracetamol 650
          batchId: 4, // BT301
          quantity: 10,
          rate: 10
        }
      ]
    };
    const res = await outwardStockService.createOutwardStock(data);
    console.log("Success:", res);
  } catch (err) {
    console.error("Failed:", err);
  }
}
test();
