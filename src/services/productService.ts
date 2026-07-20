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
let productsCache: Product[] = [];

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

// Load initial products from localStorage on initialization as a fallback
try {
  const saved = localStorage.getItem("pharma_erp_products");
  if (saved) {
    productsCache = JSON.parse(saved);
  }
} catch (err) {
  console.error("Failed to parse cached products:", err);
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
      if (response.success && Array.isArray(response.data)) {
        productsCache = response.data.map(mapProduct);

        // 1. Auto-heal mismatches between Active local MRP records and DB products
        const mrpDataRaw = localStorage.getItem('pharma_erp_mrp_records');
        if (mrpDataRaw) {
          try {
            const mrpRecords = JSON.parse(mrpDataRaw);
            for (const p of productsCache) {
              const activeMrp = mrpRecords.find((r: any) => r.productCode === p.code && r.status === 'Active');
              if (activeMrp && String(activeMrp.currentMrp) !== String(p.mrp)) {
                p.mrp = String(activeMrp.currentMrp);
                // Fire update request asynchronously to fix database record
                apiRequest(`/products/${p.id}`, {
                  method: 'PUT',
                  bodyData: p
                }).catch(err => console.error(`Failed to auto-heal product ${p.code} MRP:`, err));
              }
            }
          } catch (e) {
            console.error("Auto-heal parsing failed", e);
          }
        }

        // 2. Auto-heal mismatches between Active Pricing records and DB products
        try {
          const pricingRes = await apiRequest<any>('/pricing');
          if (pricingRes?.data && Array.isArray(pricingRes.data)) {
            for (const p of productsCache) {
              const activePricing = pricingRes.data.find((r: any) => (r.productId === Number(p.id) || r.productCode === p.code) && r.status === 'Active');
              if (activePricing) {
                const activeMrp = activePricing.mrp ? String(activePricing.mrp) : p.mrp;
                const activePtr = activePricing.ptr ? String(activePricing.ptr) : p.ptr;
                const activePts = activePricing.pts ? String(activePricing.pts) : p.pts;
                
                if (activeMrp !== p.mrp || activePtr !== p.ptr || activePts !== p.pts) {
                  p.mrp = activeMrp;
                  p.ptr = activePtr;
                  p.pts = activePts;
                  
                  apiRequest(`/products/${p.id}`, {
                    method: 'PUT',
                    bodyData: p
                  }).catch(err => console.error(`Failed to auto-heal product ${p.code} Pricing:`, err));
                }
              }
            }
          }
        } catch (err) {
          console.error("Failed to auto-heal pricing revisions:", err);
        }

        localStorage.setItem("pharma_erp_products", JSON.stringify(productsCache));
      }
    } catch (err) {
      console.error("Failed to fetch products from backend, using cache:", err);
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
    localStorage.setItem("pharma_erp_products", JSON.stringify(productsCache));
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
    localStorage.setItem("pharma_erp_products", JSON.stringify(productsCache));
    return updated;
  },

  async deleteProduct(productId: string): Promise<boolean> {
    const response = await apiRequest<{ success: boolean }>(`/products/${productId}`, {
      method: 'DELETE',
    });
    if (response.success) {
      productsCache = productsCache.filter(p => p.id !== productId);
      localStorage.setItem("pharma_erp_products", JSON.stringify(productsCache));
    }
    return response.success;
  },

  saveProducts(products: Product[]) {
    productsCache = products;
    localStorage.setItem("pharma_erp_products", JSON.stringify(products));
  }
};