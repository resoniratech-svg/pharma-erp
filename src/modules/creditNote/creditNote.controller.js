const service = require("./creditNote.service");

class CreditNoteController {
  async create(req, res) {
    try {
      const result = await service.createCreditNote(req.body);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAll(req, res) {
    try {
      const { status, section } = req.query;
      const result = await service.getCreditNotes({ status, section });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getById(req, res) {
    try {
      const result = await service.getCreditNoteById(req.params.id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  async settle(req, res) {
    try {
      const { settlementAmount, remarks } = req.body;
      const approvedByUserId = req.user ? req.user.id : null;
      
      const result = await service.settleCreditNote(
        req.params.id,
        settlementAmount,
        remarks,
        approvedByUserId
      );

      res.status(200).json({
        success: true,
        message: "Credit Note settled successfully",
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new CreditNoteController();
