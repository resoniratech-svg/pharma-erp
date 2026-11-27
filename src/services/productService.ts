import { apiRequest } from './apiClient';

export interface Product {
  id: string;
  code: string;
  name: string;
  genericName: string;
  brandName: string;
  category: string;
  type: string;
  manufacturer: string;
  composition?: string;
  scheme?: string;
  barcode?: string;
  packingType: string;
  unitsPerPack: string;
  packsInBox?: string;
  totalUnits?: string;
  mrp: string;
  ptr: string;
  pts: string;
  ptd?: string;
  purchasePrice?: string;
  sellingPrice?: string;
  gst: string;
  hsnCode: string;
  minimumStock?: string;
  reorderLevel?: string;
  batchTracking?: boolean;
  expiryTracking?: boolean;
  status: "Active" | "Inactive" | "Discontinued";
}

// Memory cache for products
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "1",
    code: "PRD-001",
    name: "Amoxicillin 500mg Capsules",
    genericName: "Amoxicillin",
    brandName: "Amoxil",
    category: "Antibiotics",
    type: "Capsule",
    manufacturer: "Sun Pharma",
    packingType: "10x10 Box",
    unitsPerPack: "100",
    mrp: "120",
    ptr: "85",
    pts: "75",
    gst: "12",
    hsnCode: "30041010",
    status: "Active"
  },
  {
    id: "2",
    code: "PRD-002",
    name: "Paracetamol 650mg Tablets",
    genericName: "Paracetamol",
    brandName: "Dolo",
    category: "Analgesic",
    type: "Tablet",
    manufacturer: "Micro Labs",
    packingType: "15x10 Box",
    unitsPerPack: "150",
    mrp: "35",
    ptr: "22",
    pts: "18",
    gst: "12",
    hsnCode: "30049060",
    status: "Active"
  },
  {
    id: "3",
    code: "PRD-003",
    name: "Azithromycin 500mg Tablets",
    genericName: "Azithromycin",
    brandName: "Azee",
    category: "Antibiotics",
    type: "Tablet",
    manufacturer: "Cipla",
    packingType: "3x10 Box",
    unitsPerPack: "30",
    mrp: "135",
    ptr: "98",
    pts: "88",
    gst: "12",
    hsnCode: "30042010",
    status: "Active"
  }
];

let productsCache: Product[] = [...DEFAULT_PRODUCTS];

// Helper to map DB product to UI product structure
function mapProduct(p: any): Product {
  return {
    id: String(p.id),
    code: p.code,
    name: p.name,
    genericName: p.genericName || "",
    brandName: p.brandName || "",
    category: p.category ? p.category.name : "",
    type: p.type || "Tablet",
    manufacturer: p.manufacturer || "",
    composition: p.composition || "",
    scheme: p.scheme || "",
    packingType: p.packingType || "",
    unitsPerPack: String(p.unitsPerPack || ""),
    packsInBox: String(p.packsInBox || ""),
    totalUnits: String(p.totalUnits || ""),
    mrp: String(p.mrp),
    ptr: String(p.ptr || ""),
    pts: String(p.pts || ""),
    ptd: String(p.ptd || ""),
    purchasePrice: String(p.purchasePrice || ""),
    sellingPrice: String(p.sellingPrice || ""),
    gst: String(p.gst),
    hsnCode: p.hsnCode || "",
    minimumStock: String(p.minStock || ""),
    reorderLevel: String(p.reorderLevel || ""),
    batchTracking: p.batchTracking,
    expiryTracking: p.expiryTracking,
    status: p.status || "Active",
  };
}



export const productService = {
  // Synchronous method for backward compatibility
  getProducts(): Product[] {
    return productsCache;
  },

  // Asynchronous method to load products from database and refresh cache
  async loadProducts(): Promise<Product[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/products');
      if (response.success && Array.isArray(response.data) && response.data.length > 0) {
        productsCache = response.data.map(mapProduct);
      } else if (productsCache.length === 0) {
        productsCache = [...DEFAULT_PRODUCTS];
      }
    } catch (err) {
      console.warn("Failed to fetch products from backend, using active catalog:", err);
      if (productsCache.length === 0) {
        productsCache = [...DEFAULT_PRODUCTS];
      }
    }
    return productsCache;
  },

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const response = await apiRequest<{ success: boolean; data: any }>('/products', {
      method: 'POST',
      bodyData: product,
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to create product');
    }
    const createdProduct = mapProduct(response.data);
    productsCache = [createdProduct, ...productsCache];
    return createdProduct;
  },

  async updateProduct(productId: string, updatedProduct: Product): Promise<Product> {
    const response = await apiRequest<{ success: boolean; data: any }>(`/products/${productId}`, {
      method: 'PUT',
      bodyData: updatedProduct,
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to update product');
    }
    const updated = mapProduct(response.data);
    productsCache = productsCache.map(p => p.id === productId ? updated : p);
    return updated;
  },

  async deleteProduct(productId: string): Promise<boolean> {
    const response = await apiRequest<{ success: boolean }>(`/products/${productId}`, {
      method: 'DELETE',
    });
    if (response.success) {
      productsCache = productsCache.filter(p => p.id !== productId);
    }
    return response.success;
  },

  saveProducts(products: Product[]) {
    productsCache = products;
  }
};