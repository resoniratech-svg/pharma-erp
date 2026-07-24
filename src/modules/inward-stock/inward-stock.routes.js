const express = require('express');
const router = express.Router();
const inwardStockController = require('./inward-stock.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.post('/', authMiddleware, inwardStockController.createInwardStock.bind(inwardStockController));
router.get('/', authMiddleware, inwardStockController.getAllInwardStocks.bind(inwardStockController));
router.get('/:id', authMiddleware, inwardStockController.getInwardStockById.bind(inwardStockController));
router.put('/:id', authMiddleware, inwardStockController.updateInwardStock.bind(inwardStockController));

module.exports = router;
