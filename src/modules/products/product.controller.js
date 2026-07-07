const productService = require("./product.service");
const prisma = require("../../config/db");

const createProduct = async (req, res) => {
  try {
    // 1. Find or create the ProductCategory by name
    let categoryId = 1;
    if (req.body.category) {
      const category = await prisma.productCategory.findFirst({
        where: { name: req.body.category }
      });
      if (category) {
        categoryId = category.id;
      } else {
        const newCat = await prisma.productCategory.create({
          data: { name: req.body.category }
        });
        categoryId = newCat.id;
      }
    }

    // 2. Coerce types and prepare product creation object
    const productData = {
      name: req.body.name,
      code: req.body.code,
      categoryId: categoryId,
      companyId: req.user.companyId || 1, // Fallback to 1 if no company
      hsnCode: req.body.hsnCode,
      gst: req.body.gst ? parseFloat(req.body.gst) : 0,
      mrp: req.body.mrp ? parseFloat(req.body.mrp) : 0,
      ptr: req.body.ptr ? parseFloat(req.body.ptr) : null,
      pts: req.body.pts ? parseFloat(req.body.pts) : null,
      ptd: req.body.ptd ? parseFloat(req.body.ptd) : null,
      minStock: req.body.minimumStock ? parseInt(req.body.minimumStock) : 0,
      genericName: req.body.genericName,
      brandName: req.body.brandName,
      type: req.body.type,
      manufacturer: req.body.manufacturer,
      composition: req.body.composition,
      scheme: req.body.scheme,
      packingType: req.body.packingType,
      unitsPerPack: req.body.unitsPerPack,
      packsInBox: req.body.packsInBox,
      totalUnits: req.body.totalUnits,
      purchasePrice: req.body.purchasePrice ? parseFloat(req.body.purchasePrice) : null,
      sellingPrice: req.body.sellingPrice ? parseFloat(req.body.sellingPrice) : null,
      reorderLevel: req.body.reorderLevel ? parseInt(req.body.reorderLevel) : null,
      batchTracking: req.body.batchTracking === true || req.body.batchTracking === "true",
      expiryTracking: req.body.expiryTracking === true || req.body.expiryTracking === "true",
      status: req.body.status || "Active",
    };

    const product = await productService.createProductService(productData);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await productService.getProductsService();
    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(Number(req.params.id));

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const updateData = {};
    
    if (req.body.category) {
      const category = await prisma.productCategory.findFirst({
        where: { name: req.body.category }
      });
      if (category) {
        updateData.categoryId = category.id;
      } else {
        const newCat = await prisma.productCategory.create({
          data: { name: req.body.category }
        });
        updateData.categoryId = newCat.id;
      }
    }
    
    // Map text fields
    const textFields = [
      "name", "code", "hsnCode", "genericName", "brandName", "type",
      "manufacturer", "composition", "scheme", "packingType", "unitsPerPack",
      "packsInBox", "totalUnits", "status"
    ];
    textFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Map float fields
    const floatFields = ["gst", "mrp", "ptr", "pts", "ptd", "purchasePrice", "sellingPrice"];
    floatFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field] ? parseFloat(req.body[field]) : null;
      }
    });

    // Map int fields
    if (req.body.minimumStock !== undefined) {
      updateData.minStock = req.body.minimumStock ? parseInt(req.body.minimumStock) : 0;
    }
    if (req.body.reorderLevel !== undefined) {
      updateData.reorderLevel = req.body.reorderLevel ? parseInt(req.body.reorderLevel) : null;
    }

    // Map boolean fields
    if (req.body.batchTracking !== undefined) {
      updateData.batchTracking = req.body.batchTracking === true || req.body.batchTracking === "true";
    }
    if (req.body.expiryTracking !== undefined) {
      updateData.expiryTracking = req.body.expiryTracking === true || req.body.expiryTracking === "true";
    }

    const product = await productService.updateProduct(Number(req.params.id), updateData);

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const product = await productService.getProductById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 1. Check if there are active batches linked to this product
    const linkedBatches = await prisma.batch.findMany({
      where: { productId },
      select: { batchNumber: true }
    });

    if (linkedBatches.length > 0) {
      const batchList = linkedBatches.map(b => b.batchNumber).join(", ");
      return res.status(400).json({
        success: false,
        message: `Cannot delete product because it is linked with the batch(es): ${batchList}. Please delete the batch(es) first if you want to delete this product.`,
      });
    }

    // 2. Check if it is used in invoices
    const linkedInvoices = await prisma.invoiceItem.findFirst({
      where: { productId }
    });

    if (linkedInvoices) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete product because it is referenced in sales billing invoices. Please mark the product as Inactive or Discontinued instead to preserve historical ledger records.",
      });
    }

    // 3. Check if it is used in retailer orders
    const linkedOrders = await prisma.retailerOrderItem.findFirst({
      where: { productId }
    });

    if (linkedOrders) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete product because it is referenced in retailer orders. Please mark the product as Inactive or Discontinued instead.",
      });
    }

    await productService.deleteProduct(productId);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};