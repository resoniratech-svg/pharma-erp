const service = require('./finance.service');
const { formatResponse } = require('../../utils/responseFormatter');

const createVoucher = async (req, res, next) => {
  try {
    const data = await service.createVoucherService(req.body, req.user);
    res.status(201).json(formatResponse(true, 'Voucher created successfully', data));
  } catch (error) {
    next(error);
  }
};

const getVouchers = async (req, res, next) => {
  try {
    const filters = req.query;
    const data = await service.getVouchersService(filters, req.user);
    res.status(200).json(formatResponse(true, 'Vouchers fetched successfully', data));
  } catch (error) {
    next(error);
  }
};

const getTrialBalance = async (req, res, next) => {
  try {
    const data = await service.getTrialBalanceService(req.user);
    res.status(200).json(formatResponse(true, 'Trial Balance generated successfully', data));
  } catch (error) {
    next(error);
  }
};

const getProfitLoss = async (req, res, next) => {
  try {
    const data = await service.getProfitLossService(req.user);
    res.status(200).json(formatResponse(true, 'P&L generated successfully', data));
  } catch (error) {
    next(error);
  }
};

const getBalanceSheet = async (req, res, next) => {
  try {
    const data = await service.getBalanceSheetService(req.user);
    res.status(200).json(formatResponse(true, 'Balance Sheet generated successfully', data));
  } catch (error) {
    next(error);
  }
};

const getLedgers = async (req, res, next) => {
  try {
    const data = await service.getLedgersService(req.user);
    res.status(200).json(formatResponse(true, 'Ledgers fetched successfully', data));
  } catch (error) {
    next(error);
  }
};

const getGroups = async (req, res, next) => {
  try {
    const data = await service.getGroupsService(req.user);
    res.status(200).json(formatResponse(true, 'Groups fetched successfully', data));
  } catch (error) {
    next(error);
  }
};

const createGroup = async (req, res, next) => {
  try {
    const data = await service.createGroupService(req.body, req.user);
    res.status(201).json(formatResponse(true, 'Group created successfully', data));
  } catch (error) {
    next(error);
  }
};

const getLedgerStatement = async (req, res, next) => {
  try {
    const data = await service.getLedgerStatementService(req.params.id, req.user);
    res.status(200).json(formatResponse(true, 'Ledger statement fetched successfully', data));
  } catch (error) {
    next(error);
  }
};

const createLedger = async (req, res, next) => {
  try {
    const data = await service.createLedgerService(req.body, req.user);
    res.status(201).json(formatResponse(true, 'Ledger created successfully', data));
  } catch (error) {
    next(error);
  }
};

const createCommission = async (req, res, next) => {
  try {
    const data = await service.createCommissionService(req.body, req.user);
    res.status(201).json(formatResponse(true, 'Commission created successfully', data));
  } catch (error) {
    next(error);
  }
};

const getCommissions = async (req, res, next) => {
  try {
    const data = await service.getCommissionsService(req.user);
    res.status(200).json(formatResponse(true, 'Commissions fetched successfully', data));
  } catch (error) {
    next(error);
  }
};

const updateCommissionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const data = await service.updateCommissionStatusService(req.params.id, status, req.user);
    res.status(200).json(formatResponse(true, 'Commission status updated successfully', data));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVoucher,
  getVouchers,
  getTrialBalance,
  getProfitLoss,
  getBalanceSheet,
  getGroups,
  createGroup,
  getLedgers,
  getLedgerStatement,
  createLedger,
  createCommission,
  getCommissions,
  updateCommissionStatus
};
