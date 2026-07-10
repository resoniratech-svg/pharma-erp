const outwardStockService = require('./outward-stock.service');

class OutwardStockController {
  async create(req, res) {
    try {
      const outwardStock = await outwardStockService.createOutwardStock(req.body);
      res.status(201).json(outwardStock);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const outwardStocks = await outwardStockService.getAllOutwardStocks();
      res.status(200).json(outwardStocks);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const outwardStock = await outwardStockService.getOutwardStockById(id);
      if (!outwardStock) {
        return res.status(404).json({ error: 'Outward stock not found' });
      }
      res.status(200).json(outwardStock);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const outwardStock = await outwardStockService.updateOutwardStock(id, req.body);
      res.status(200).json(outwardStock);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await outwardStockService.deleteOutwardStock(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new OutwardStockController();
