const repository = require("./creditNote.repository");
const invoiceRepository = require("../invoice/invoice.repository");
const prisma = require("../../config/db");

class CreditNoteService {
  async createCreditNote(data) {
    let subTotal = 0;
    let gstAmount = 0;
    let invoice = null;

    if (data.againstInvoiceId) {
      const numId = parseInt(data.againstInvoiceId, 10);
      if (!isNaN(numId)) {
        invoice = await invoiceRepository.getInvoiceByIdRepo(numId);
      }
      if (!invoice && typeof data.againstInvoiceId === 'string') {
        invoice = await prisma.invoice.findFirst({
          where: { invoiceNumber: data.againstInvoiceId },
          include: { invoiceItems: true }
        });
      }
    }

    // Auto-resolve distributorId or retailerId by customerName if not explicitly provided
    let distributorId = data.distributorId && !isNaN(parseInt(data.distributorId, 10)) ? parseInt(data.distributorId, 10) : null;
    let retailerId = data.retailerId && !isNaN(parseInt(data.retailerId, 10)) ? parseInt(data.retailerId, 10) : null;

    if (!distributorId && !retailerId && data.customerName) {
      const dist = await prisma.distributor.findFirst({
        where: { name: { equals: data.customerName, mode: 'insensitive' } }
      });
      if (dist) {
        distributorId = dist.id;
      } else {
        const ret = await prisma.retailer.findFirst({
          where: { name: { equals: data.customerName, mode: 'insensitive' } }
        });
        if (ret) {
          retailerId = ret.id;
        }
      }
    }

    // Ensure valid fallback batch and product IDs exist in DB
    let fallbackProduct = await prisma.product.findFirst();
    if (!fallbackProduct) {
      let company = await prisma.company.findFirst();
      if (!company) {
        company = await prisma.company.create({
          data: { name: "Default Company", code: "CMP01" }
        });
      }
      fallbackProduct = await prisma.product.create({
        data: {
          code: "PRD-DEFAULT",
          name: "Default Product",
          mrp: 100,
          minStock: 10,
          companyId: company.id
        }
      });
    }

    let fallbackBatch = await prisma.batch.findFirst();
    if (!fallbackBatch) {
      fallbackBatch = await prisma.batch.create({
        data: {
          batchNumber: "BAT-DEFAULT",
          productId: fallbackProduct.id,
          manufacturingDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          quantity: 100
        }
      });
    }

    const formattedItems = [];

    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        const itemRate = Number(item.unitRate || item.rate || 0);
        const itemGst = Number(item.gstPercent || 12);
        const itemQty = Number(item.quantity || 1);

        const lineAmount = itemQty * itemRate;
        const lineGst = lineAmount * (itemGst / 100);
        const lineTotal = lineAmount + lineGst;

        subTotal += lineAmount;
        gstAmount += lineGst;

        let prodId = Number(item.productId);
        if (!prodId || isNaN(prodId)) {
          prodId = fallbackProduct.id;
        } else {
          const exists = await prisma.product.findUnique({ where: { id: prodId } });
          if (!exists) prodId = fallbackProduct.id;
        }

        let bId = Number(item.batchId);
        if (!bId || isNaN(bId)) {
          bId = fallbackBatch.id;
        } else {
          const exists = await prisma.batch.findUnique({ where: { id: bId } });
          if (!exists) bId = fallbackBatch.id;
        }

        formattedItems.push({
          productId: prodId,
          batchId: bId,
          quantity: itemQty,
          rate: itemRate,
          gstPercent: itemGst,
          totalAmount: lineTotal,
          disposition: item.disposition || "SALABLE"
        });
      }
    }

    const finalSubTotal = subTotal || Number(data.taxableAmount || 0);
    const finalGstAmount = gstAmount || Number(data.gstAmount || 0);
    const finalTotalAmount = (subTotal + gstAmount) || Number(data.totalAmount || 0);

    const payload = {
      cnNo: data.cnNo || `CN/26/${Math.floor(1000 + Math.random() * 9000)}`,
      cnType: data.cnType || 'Sales Return',
      reason: data.reason || 'Sales Return',
      remarks: data.remarks || (data.againstInvoiceNo ? `Against Invoice: ${data.againstInvoiceNo}` : null),
      retailerId: retailerId,
      distributorId: distributorId,
      mrId: data.mrId && !isNaN(parseInt(data.mrId, 10)) ? parseInt(data.mrId, 10) : null,
      againstInvoiceId: invoice ? invoice.id : null,
      status: "PAID",
      taxableAmount: finalSubTotal,
      gstAmount: finalGstAmount,
      totalAmount: finalTotalAmount,
      amountSettled: finalTotalAmount,
      items: formattedItems
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
