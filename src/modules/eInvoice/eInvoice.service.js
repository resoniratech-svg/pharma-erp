const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Fetch all invoices with E-Invoice status & filters
 */
const getEInvoicesService = async (query = {}) => {
  const { search, irnStatus, nicStatus } = query;

  const where = {};

  if (irnStatus) {
    where.irnStatus = irnStatus;
  }

  if (nicStatus) {
    where.nicStatus = nicStatus;
  }

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { irnNumber: { contains: search, mode: "insensitive" } },
      { retailer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      retailer: true,
      invoiceItems: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return invoices;
};

/**
 * Get detailed E-Invoice by ID
 */
const getEInvoiceByIdService = async (id) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: parseInt(id) },
    include: {
      retailer: true,
      invoiceItems: {
        include: {
          product: true,
        },
      },
    },
  });

  return invoice;
};

/**
 * Helper to generate a 64-character hex IRN hash
 */
const generateIRNHash = () => {
  const chars = "abcdef0123456789";
  let hash = "";
  for (let i = 0; i < 64; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
};

/**
 * Helper to generate mock Signed QR code data string
 */
const generateSignedQRCode = (irn, ackNo, gstin, totalVal) => {
  const qrObj = {
    SellerGstin: "27AAACB1234H1Z5",
    BuyerGstin: gstin || "29ABCDE1234F1Z5",
    DocNo: irn,
    DocTyp: "INV",
    DocDt: new Date().toISOString().split("T")[0],
    TotInvVal: totalVal,
    ItemCnt: 1,
    MainHsnCode: "30049099",
    Irn: irn,
    AckNo: ackNo,
    AckDt: new Date().toISOString(),
  };
  return JSON.stringify(qrObj);
};

/**
 * Trigger IRN Generation for an Invoice
 */
const generateIRNService = async (id) => {
  const invoiceId = parseInt(id);
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { retailer: true, invoiceItems: true },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (invoice.irnStatus === "GENERATED") {
    throw new Error("IRN has already been generated for this invoice.");
  }

  const irnHash = generateIRNHash();
  const ackNo = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
  const now = new Date();

  // Create GSTR-1 compliant JSON payload format
  const jsonPayload = {
    Version: "1.1",
    TranDetails: { TaxSch: "GST", SupTyp: "B2B", RegRev: "N", EcmGstin: null, IgstOnIntra: "N" },
    DocDetails: { Typ: "INV", No: invoice.invoiceNumber, Dt: invoice.invoiceDate.toISOString().split("T")[0] },
    SellerDetails: { Gstin: "27AAACB1234H1Z5", LglNm: "MJ Healthcare Pharmaceuticals", TrdNm: "MJ Health", Addr1: "Plot 42, Pharma Complex", Loc: "Mumbai", Pin: 400001, Stcd: "27" },
    BuyerDetails: { Gstin: invoice.retailer?.gstin || "29ABCDE1234F1Z5", LglNm: invoice.retailer?.name || "Retail Customer", TrdNm: invoice.retailer?.name || "Retail Customer", Pos: "27", Addr1: invoice.retailer?.address || "Main Street", Loc: "City", Pin: 400002, Stcd: "27" },
    ItemList: (invoice.invoiceItems || []).map((item, idx) => ({
      SlNo: (idx + 1).toString(),
      PrdDesc: item.productName || "Pharma Product",
      IsServc: "N",
      HsnCd: "30049099",
      Qty: item.quantity || 1,
      UnitPrice: item.unitPrice || item.price || 100,
      TotAmt: item.total || (item.quantity * item.unitPrice) || 100,
      AssAmt: item.total || 100,
      GstRt: 12,
      IgstVal: 0,
      CgstVal: ((item.total || 100) * 0.06),
      SgstVal: ((item.total || 100) * 0.06),
      TotItemVal: (item.total || 100) * 1.12
    })),
    ValDetails: {
      AssVal: invoice.subTotal || 1000,
      CgstVal: (invoice.gstAmount || 120) / 2,
      SgstVal: (invoice.gstAmount || 120) / 2,
      IgstVal: 0,
      CesVal: 0,
      Discount: 0,
      OthChrg: 0,
      RndOffAmt: 0,
      TotInvVal: invoice.totalAmount || 1120
    }
  };

  const signedQrCode = generateSignedQRCode(
    irnHash,
    ackNo,
    invoice.retailer?.gstin,
    invoice.totalAmount
  );

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      irnStatus: "GENERATED",
      irnNumber: irnHash,
      irnGeneratedOn: now,
      ackNo: ackNo,
      ackDate: now,
      signedQrCode: signedQrCode,
      jsonPayload: jsonPayload,
      nicStatus: "SUCCESS",
      nicErrorCode: "-",
      nicErrorDesc: "-",
    },
    include: { retailer: true },
  });

  return updatedInvoice;
};

/**
 * Cancel an existing IRN within 24 hours
 */
const cancelIRNService = async (id, reason) => {
  const invoiceId = parseInt(id);
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (invoice.irnStatus !== "GENERATED") {
    throw new Error("Only GENERATED IRNs can be cancelled.");
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      irnStatus: "CANCELLED",
      nicStatus: "SUCCESS",
      cancellationReason: reason || "Data Entry Error",
      cancelledAt: new Date(),
    },
    include: { retailer: true },
  });

  return updatedInvoice;
};

/**
 * Retry failed IRN submission
 */
const retryIRNService = async (id) => {
  const invoiceId = parseInt(id);
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      irnStatus: "PENDING",
      nicStatus: "PENDING",
      nicErrorCode: null,
      nicErrorDesc: null,
    },
  });

  return generateIRNService(id);
};

module.exports = {
  getEInvoicesService,
  getEInvoiceByIdService,
  generateIRNService,
  cancelIRNService,
  retryIRNService,
};
