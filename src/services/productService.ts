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
  barcode?: string;

  packingType: string;
  unitsPerPack: string;
  packsInBox?: string;
  totalUnits?: string;

  mrp: string;
  ptr: string;
  pts: string;

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

const STORAGE_KEY = "products";

export const productService = {
  getProducts(): Product[] {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveProducts(products: Product[]) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(products),
    );
  },

  addProduct(product: Product) {
    const products = this.getProducts();

    products.unshift(product);

    this.saveProducts(products);
  },

  updateProduct(
    productId: string,
    updatedProduct: Product,
  ) {
    const products = this.getProducts();

    const updated = products.map((product) =>
      product.id === productId
        ? updatedProduct
        : product,
    );

    this.saveProducts(updated);
  },

  deleteProduct(productId: string) {
    const products = this.getProducts();

    const filtered = products.filter(
      (product) => product.id !== productId,
    );

    this.saveProducts(filtered);
  },
};