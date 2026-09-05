const repo = require('./finance.repository');

const createVoucherService = async (voucherData, user) => {
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

  return repo.createVoucherRepo(voucherData, user);
};

const getVouchersService = async (filters, user) => {
  return repo.getVouchersRepo(filters, user);
};

const getTrialBalanceService = async (user) => {
  return repo.getTrialBalanceRepo(user);
};

const getProfitLossService = async (user) => {
  const trialBalance = await repo.getTrialBalanceRepo(user);
  
  // Filter for Income and Expenses
  const incomes = trialBalance.filter(l => (l.nature || '').toUpperCase() === 'INCOME');
  const expenses = trialBalance.filter(l => (l.nature || '').toUpperCase() === 'EXPENSE');

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

const getBalanceSheetService = async (user) => {
  const trialBalance = await repo.getTrialBalanceRepo(user);
  const pnl = await getProfitLossService(user);
  
  // Filter for Assets, Liabilities, Equity
  const assets = trialBalance.filter(l => (l.nature || '').toUpperCase() === 'ASSET');
  const liabilities = trialBalance.filter(l => (l.nature || '').toUpperCase() === 'LIABILITY' || (l.nature || '').toUpperCase() === 'EQUITY');

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

const getLedgersService = async (user) => {
  return repo.getLedgersRepo(user);
};

const getGroupsService = async (user) => {
  return repo.getGroupsRepo(user);
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

const createCommissionService = async (data, user) => {
  return repo.createCommissionRepo(data, user);
};

const getCommissionsService = async (user) => {
  return repo.getCommissionsRepo(user);
};

const updateCommissionStatusService = async (id, status, user) => {
  return repo.updateCommissionStatusRepo(id, status, user);
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
