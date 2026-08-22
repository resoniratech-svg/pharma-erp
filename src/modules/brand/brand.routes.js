const express = require('express');
const router = express.Router();
const brandController = require('./brand.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', brandController.createBrand);
router.get('/', brandController.getBrands);
router.put('/:id', brandController.updateBrand);
router.delete('/:id', brandController.deleteBrand);

module.exports = router;
