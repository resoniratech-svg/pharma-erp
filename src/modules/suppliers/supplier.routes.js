const express = require('express');
const supplierController = require('./supplier.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', supplierController.create);
router.get('/', supplierController.getAll);
router.get('/:id', supplierController.getById);
router.put('/:id', supplierController.update);
router.delete('/:id', supplierController.delete);

module.exports = router;
