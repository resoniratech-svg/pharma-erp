const express = require('express');
const router = express.Router();
const controller = require('./exportOperations.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../../uploads/exports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

router.get('/currencies', controller.getCurrencies);
router.post('/currencies', controller.createCurrency);
router.put('/currencies/:id', controller.updateCurrency);
router.delete('/currencies/:id', controller.deleteCurrency);

router.get('/country-pricing', controller.getCountryPricing);
router.post('/country-pricing', controller.createCountryPricing);
router.put('/country-pricing/:id', controller.updateCountryPricing);
router.delete('/country-pricing/:id', controller.deleteCountryPricing);

router.get('/customers', controller.getExportCustomers);
router.post('/customers', controller.createExportCustomer);
router.put('/customers/:id', controller.updateExportCustomer);
router.delete('/customers/:id', controller.deleteExportCustomer);

router.get('/orders', controller.getExportOrders);
router.post('/orders', controller.createExportOrder);
router.put('/orders/:id', controller.updateExportOrder);
router.delete('/orders/:id', controller.deleteExportOrder);
router.put('/orders/:id/status', controller.updateExportOrderStatus);

router.get('/dashboard-stats', controller.getDashboardStats);

router.post('/upload', upload.single('file'), controller.uploadDocument);

module.exports = router;
