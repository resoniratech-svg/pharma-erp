const repository = require("./creditNote.repository");
const invoiceRepository = require("../invoice/invoice.repository");

class CreditNoteService {
  async createCreditNote(data) {
    let subTotal = 0;
    let gstAmount = 0;

    // 1. If linked to an invoice, validate quantities
    if (data.againstInvoiceId) {
      const invoice = await invoiceRepository.getInvoiceByIdRepo(parseInt(data.againstInvoiceId, 10));
      if (!invoice) {
        throw new Error("Target invoice not found");
      }

      // Pre-calculate subtotal and gst
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          // Find item in original invoice
          const originalItem = invoice.invoiceItems.find(
            (ii) => ii.productId === item.productId
          );

          if (!originalItem) {
            throw new Error(`Product ID ${item.productId} was not sold in this invoice`);
          }

          if (item.quantity > originalItem.quantity) {
            throw new Error(
              `Return quantity (${item.quantity}) for product ID ${item.productId} exceeds originally invoiced quantity (${originalItem.quantity})`
            );
          }

          // Force rate to match the original invoice rate
          item.rate = originalItem.rate;
          item.gstPercent = originalItem.gst;
          
          const lineAmount = item.quantity * item.rate;
          const lineGst = lineAmount * (item.gstPercent / 100);
          
          item.totalAmount = lineAmount + lineGst;
          
          subTotal += lineAmount;
          gstAmount += lineGst;
        }
      }
    } else {
      // General credit note without specific invoice reference
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          const lineAmount = item.quantity * item.rate;
          const lineGst = lineAmount * (item.gstPercent / 100);
          
          item.totalAmount = lineAmount + lineGst;
          
          subTotal += lineAmount;
          gstAmount += lineGst;
        }
      }
    }

    const totalAmount = subTotal + gstAmount;

    // Set values to main model payload
    const payload = {
      cnNo: data.cnNo || `CN/26/0${Math.floor(100 + Math.random() * 900)}`,
      cnType: data.cnType,
      reason: data.reason,
      remarks: data.remarks,
      retailerId: data.retailerId ? parseInt(data.retailerId, 10) : null,
      distributorId: data.distributorId ? parseInt(data.distributorId, 10) : null,
      mrId: data.mrId ? parseInt(data.mrId, 10) : null,
      againstInvoiceId: data.againstInvoiceId ? parseInt(data.againstInvoiceId, 10) : null,
      status: "PENDING",
      taxableAmount: subTotal,
      gstAmount: gstAmount,
      totalAmount: totalAmount,
      amountSettled: 0.0,
      items: data.items
    };

    return repository.create(payload);
  }

  async getCreditNotes(filters) {
    return repository.findAll(filters);
  }

  async getCreditNoteById(id) {
    const record = await repository.findById(id);
    if (!record) {
      throw new Error("Credit Note not found");
    }
    return record;
  }

  async settleCreditNote(id, settlementAmount, remarks, approvedByUserId) {
    const amt = parseFloat(settlementAmount);
    if (isNaN(amt) || amt <= 0) {
      throw new Error("Settlement amount must be positive");
    }

    return repository.executeSettlementTx(
      parseInt(id, 10),
      amt,
      remarks,
      approvedByUserId
    );
  }
}

module.exports = new CreditNoteService();
