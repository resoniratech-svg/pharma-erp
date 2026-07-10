const express = require('express');
const router = express.Router();
const controller = require('./warehouse-transfer.controller');

// If you have an authMiddleware, uncomment and use it
// const authMiddleware = require('../../middleware/auth.middleware');
// router.use(authMiddleware);

router.post('/', controller.createWarehouseTransfer);
router.get('/', controller.getWarehouseTransfers);
router.get('/:id', controller.getWarehouseTransferById);
router.put('/:id', controller.updateWarehouseTransfer);
router.delete('/:id', controller.deleteWarehouseTransfer);

module.exports = router;
