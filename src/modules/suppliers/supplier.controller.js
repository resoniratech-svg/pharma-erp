const supplierService = require('./supplier.service');

class SupplierController {
  async create(req, res, next) {
    try {
      const supplier = await supplierService.createSupplier(req.body);
      res.status(201).json(supplier);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const suppliers = await supplierService.getAllSuppliers();
      res.status(200).json(suppliers);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const supplier = await supplierService.getSupplierById(req.params.id);
      if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }
      res.status(200).json(supplier);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const supplier = await supplierService.updateSupplier(req.params.id, req.body);
      res.status(200).json(supplier);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await supplierService.deleteSupplier(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SupplierController();
