const express = require('express');
const router = express.Router();
const manufacturerController = require('./manufacturer.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', manufacturerController.createManufacturer);
router.get('/', manufacturerController.getManufacturers);
router.put('/:id', manufacturerController.updateManufacturer);
router.delete('/:id', manufacturerController.deleteManufacturer);

module.exports = router;
