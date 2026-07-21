const service = require("./eInvoice.service");

const getEInvoices = async (req, res) => {
  try {
    const data = await service.getEInvoicesService(req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getEInvoiceById = async (req, res) => {
  try {
    const data = await service.getEInvoiceByIdService(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateIRN = async (req, res) => {
  try {
    const data = await service.generateIRNService(req.params.id);
    res.json({ success: true, message: "IRN Generated successfully", data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const cancelIRN = async (req, res) => {
  try {
    const { reason } = req.body;
    const data = await service.cancelIRNService(req.params.id, reason);
    res.json({ success: true, message: "IRN Cancelled successfully", data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const retryIRN = async (req, res) => {
  try {
    const data = await service.retryIRNService(req.params.id);
    res.json({ success: true, message: "IRN Retry completed", data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getEInvoices,
  getEInvoiceById,
  generateIRN,
  cancelIRN,
  retryIRN,
};
