const repo = require('./finance.repository');

const createVoucherService = async (voucherData) => {
  // Strict Validation: Debit must equal Credit
  let totalDr = 0;
  let totalCr = 0;

  for (const txn of voucherData.transactions) {
    if (txn.type === 'DR') totalDr += txn.amount;
    if (txn.type === 'CR') totalCr += txn.amount;
  }

  if (totalDr !== totalCr) {
    throw new Error('Transaction is unbalanced: Total Debits must equal Total Credits.');
  }

  if (voucherData.amount <= 0) {
    throw new Error('Voucher amount must be greater than 0.');
  }

  return repo.createVoucherRepo(voucherData);
};

const getVouchersService = async (filters) => {
  return repo.getVouchersRepo(filters);
};

const getTrialBalanceService = async () => {
  return repo.getTrialBalanceRepo();
};

const getProfitLossService = async () => {
  const trialBalance = await repo.getTrialBalanceRepo();
  
  // Filter for Income and Expenses
  const incomes = trialBalance.filter(l => l.nature === 'INCOME');
  const expenses = trialBalance.filter(l => l.nature === 'EXPENSE');

  const totalIncome = incomes.reduce((sum, l) => sum + (l.credit || 0), 0);
  const totalExpense = expenses.reduce((sum, l) => sum + (l.debit || 0), 0);
  
  const netProfit = totalIncome - totalExpense;

  return {
    incomes,
    expenses,
    totalIncome,
    totalExpense,
    netProfit
  };
};

const getBalanceSheetService = async () => {
  const trialBalance = await repo.getTrialBalanceRepo();
  const pnl = await getProfitLossService();
  
  // Filter for Assets, Liabilities, Equity
  const assets = trialBalance.filter(l => l.nature === 'ASSET');
  const liabilities = trialBalance.filter(l => l.nature === 'LIABILITY' || l.nature === 'EQUITY');

  const totalAssets = assets.reduce((sum, l) => sum + (l.debit || 0), 0);
  let totalLiabilities = liabilities.reduce((sum, l) => sum + (l.credit || 0), 0);
  
  // Add Net Profit to Liabilities (Retained Earnings)
  totalLiabilities += pnl.netProfit;

  return {
    assets,
    liabilities,
    totalAssets,
    totalLiabilities,
    netProfit: pnl.netProfit
  };
};

const getLedgersService = async () => {
  return repo.getLedgersRepo();
};

const getGroupsService = async () => {
  return repo.getGroupsRepo();
};

const createGroupService = async (data) => {
  if (!data.name || !data.nature) {
    throw new Error("Group name and nature are required");
  }
  return repo.createGroupRepo(data);
};

const getLedgerStatementService = async (ledgerId) => {
  return repo.getLedgerStatementRepo(ledgerId);
};

const createLedgerService = async (data) => {
  return repo.createLedgerRepo(data);
};

const createCommissionService = async (data) => {
  return repo.createCommissionRepo(data);
};

const getCommissionsService = async () => {
  return repo.getCommissionsRepo();
};

const updateCommissionStatusService = async (id, status) => {
  return repo.updateCommissionStatusRepo(id, status);
};

module.exports = {
  createVoucherService,
  getVouchersService,
  getTrialBalanceService,
  getProfitLossService,
  getBalanceSheetService,
  getGroupsService,
  createGroupService,
  getLedgersService,
  getLedgerStatementService,
  createLedgerService,
  createCommissionService,
  getCommissionsService,
  updateCommissionStatusService
};
