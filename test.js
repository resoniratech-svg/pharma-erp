const service = require('./src/modules/finance/finance.service');

async function main() {
  const tb = await service.getBalanceSheetService();
  console.log('Balance Sheet:', JSON.stringify(tb, null, 2));
}

main().catch(console.error);
