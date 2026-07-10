const express = require('express');
const router = express.Router();
const outwardStockController = require('./outward-stock.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.post('/', authMiddleware, outwardStockController.create);
router.get('/', authMiddleware, outwardStockController.getAll);
router.get('/:id', authMiddleware, outwardStockController.getById);
router.put('/:id', authMiddleware, outwardStockController.update);
router.delete('/:id', authMiddleware, outwardStockController.delete);

module.exports = router;
