const express = require('express');
const router = express.Router();
const controller = require('./finance.controller');

// Vouchers
router.post('/vouchers', controller.createVoucher);
router.get('/vouchers', controller.getVouchers);

// Ledgers
router.post('/ledgers', controller.createLedger);
router.get('/ledgers', controller.getLedgers);
router.get('/ledgers/:id/statement', controller.getLedgerStatement);
router.get('/groups', controller.getGroups);
router.post('/groups', controller.createGroup);

// Reports
router.get('/reports/trial-balance', controller.getTrialBalance);
router.get('/reports/pnl', controller.getProfitLoss);
router.get('/reports/balance-sheet', controller.getBalanceSheet);

// Commissions
router.get('/commissions', controller.getCommissions);
router.post('/commissions', controller.createCommission);
router.put('/commissions/:id/status', controller.updateCommissionStatus);

module.exports = router;
