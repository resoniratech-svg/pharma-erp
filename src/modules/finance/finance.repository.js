const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const getWhereClause = (user) => {
  const where = {};
  if (user && user.role === "COMPANY_ADMIN") {
    where.companyId = user.companyId || 1;
  }
  return where;
};


const createVoucherRepo = async (voucherData, user) => {
  const { 
    voucherType, 
    voucherDate, 
    amount, 
    narration, 
    referenceType, 
    referenceId, 
    paymentMode, 
    paymentRef, 
    transactions, // Array of { ledgerId, type, amount }
    createdBy 
  } = voucherData;

  // Generate a voucher number (In production this would be a proper sequence)
  const voucherNumber = `${voucherType}-${Date.now()}`;

  // Execute in a transaction to ensure ACID compliance (Debit = Credit)
  return prisma.$transaction(async (tx) => {
    // 1. Create the Voucher
    const voucher = await tx.voucher.create({
      data: {
        voucherNumber,
        voucherType,
        voucherDate: voucherDate ? new Date(voucherDate) : new Date(),
        companyId: (user && user.role === "COMPANY_ADMIN") ? (user.companyId || 1) : 1,
        amount,
        narration,
        referenceType,
        referenceId,
        paymentMode,
        paymentRef,
        createdBy,
        transactions: {
          create: transactions.map(t => ({
            ledgerId: t.ledgerId,
            type: t.type,
            amount: t.amount
          }))
        }
      },
      include: {
        transactions: true
      }
    });

    // 2. Update Ledger balances directly if maintaining running balance (optional but common)
    for (const txn of transactions) {
      const ledger = await tx.accountLedger.findUnique({ where: { id: txn.ledgerId }});
      if (ledger) {
        let balanceChange = 0;
        if (ledger.balanceType === 'DR') {
          balanceChange = txn.type === 'DR' ? txn.amount : -txn.amount;
        } else {
          balanceChange = txn.type === 'CR' ? txn.amount : -txn.amount;
        }
        
        // This is a naive way, actual dynamic reporting derives this from transactions
        await tx.accountLedger.update({
          where: { id: txn.ledgerId },
          data: {
            openingBalance: { increment: balanceChange } // We repurpose openingBalance as current balance for simplicity or add a currentBalance field
          }
        });
      }
    }

    // 3. If referenceType is INVOICE, reduce outstanding
    if (referenceType === 'INVOICE' && referenceId) {
      const invoice = await tx.invoice.findUnique({ where: { id: referenceId } });
      if (invoice && invoice.outstandingAmount >= amount) {
        await tx.invoice.update({
          where: { id: referenceId },
          data: { outstandingAmount: { decrement: amount } }
        });
      }
    }

    return voucher;
  });
};

const getVouchersRepo = async (filters = {}, user) => {
  return prisma.voucher.findMany({
    where: { ...filters, ...getWhereClause(user) },
    include: {
      transactions: {
        include: {
          ledger: true
        }
      }
    },
    orderBy: {
      voucherDate: 'desc'
    }
  });
};

const getTrialBalanceRepo = async (user) => {
  // Aggregate all DR and CR per ledger
  const transactions = await prisma.ledgerTransaction.groupBy({
    by: ['ledgerId', 'type'],
    _sum: {
      amount: true
    }
  });

  const ledgers = await prisma.accountLedger.findMany({
    where: getWhereClause(user),
    include: {
      group: true
    }
  });

  // Map and calculate
  return ledgers.map(ledger => {
    const drTxns = transactions.find(t => t.ledgerId === ledger.id && t.type === 'DR');
    const crTxns = transactions.find(t => t.ledgerId === ledger.id && t.type === 'CR');
    
    const debit = drTxns ? drTxns._sum.amount : 0;
    const credit = crTxns ? crTxns._sum.amount : 0;

    let balance = ledger.openingBalance;
    if (ledger.balanceType === 'DR') {
      balance += (debit - credit);
    } else {
      balance += (credit - debit);
    }

    let finalDebit = 0;
    let finalCredit = 0;

    if (ledger.balanceType === 'DR') {
      if (balance > 0) finalDebit = balance;
      else if (balance < 0) finalCredit = Math.abs(balance);
    } else {
      if (balance > 0) finalCredit = balance;
      else if (balance < 0) finalDebit = Math.abs(balance);
    }

    return {
      id: ledger.id,
      name: ledger.name,
      group: ledger.group.name,
      nature: ledger.group.nature,
      debit: finalDebit,
      credit: finalCredit
    };
  });
};

const getLedgersRepo = async (user) => {
  return prisma.accountLedger.findMany({
    where: getWhereClause(user),
    include: {
      group: true
    },
    orderBy: {
      id: 'desc'
    }
  });
};

const getGroupsRepo = async (user) => {
  return prisma.accountGroup.findMany({ where: getWhereClause(user) });
};

const createGroupRepo = async (data, user) => {
  return prisma.accountGroup.create({
    data: { ...data, companyId: (user && user.role === "COMPANY_ADMIN") ? (user.companyId || 1) : 1 }
  });
};

const getLedgerStatementRepo = async (ledgerId, user) => {
  return prisma.ledgerTransaction.findMany({
    where: { ledgerId: parseInt(ledgerId) },
    include: {
      voucher: true
    },
    orderBy: {
      voucher: { voucherDate: 'asc' }
    }
  });
};

const createLedgerRepo = async (data, user) => {
  return prisma.accountLedger.create({
    data: { ...data, companyId: (user && user.role === "COMPANY_ADMIN") ? (user.companyId || 1) : 1 }
  });
};

const createCommissionRepo = async (data, user) => {
  return prisma.commission.create({
    data: { ...data, companyId: (user && user.role === "COMPANY_ADMIN") ? (user.companyId || 1) : 1 }
  });
};

const getCommissionsRepo = async (user) => {
  return prisma.commission.findMany({
    where: getWhereClause(user),
    orderBy: { createdAt: 'desc' }
  });
};

const updateCommissionStatusRepo = async (id, status, user) => {
  return prisma.commission.update({
    where: { id: parseInt(id) },
    data: { status }
  });
};

module.exports = {
  getGroupsRepo,
  createGroupRepo,
  createVoucherRepo,
  getVouchersRepo,
  getTrialBalanceRepo,
  getLedgersRepo,
  getLedgerStatementRepo,
  createLedgerRepo,
  createCommissionRepo,
  getCommissionsRepo,
  updateCommissionStatusRepo
};
