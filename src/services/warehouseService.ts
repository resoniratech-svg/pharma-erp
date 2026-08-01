import { apiRequest } from './apiClient';

export interface WarehouseRecord {
  id: string;

  code: string;
  name: string;
  type: string;

  branch: string;

  contactPerson: string;
  phone: string;
  email: string;

  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;

  gstNumber: string;
  licenseNumber: string;

  remarks: string;

  status: "Active" | "Inactive";

  createdAt: string;
  createdBy: string;
  lastModified: string;
}

let warehousesCache: WarehouseRecord[] = [];

function mapToUi(w: any): WarehouseRecord {
  return {
    id: String(w.id),
    code: w.code,
    name: w.name,
    address: w.address || "",
    type: w.type || "Main Warehouse",
    branch: w.branch || "Default Branch",
    contactPerson: w.contactPerson || "N/A",
    phone: w.phone || "N/A",
    email: w.email || "N/A",
    city: w.city || "",
    state: w.state || "",
    country: w.country || "",
    pinCode: w.pinCode || "",
    gstNumber: w.gstNumber || "",
    licenseNumber: w.licenseNumber || "",
    remarks: w.remarks || "",
    status: w.status === "Inactive" ? "Inactive" : "Active",
    createdAt: w.createdAt || new Date().toISOString(),
    createdBy: w.createdBy || "System",
    lastModified: w.updatedAt || new Date().toISOString(),
  };
}

function mapToDb(w: any): any {
  return {
    name: w.name,
    code: w.code,
    address: w.address,
    type: w.type,
    branch: w.branch,
    contactPerson: w.contactPerson,
    phone: w.phone,
    email: w.email,
    city: w.city,
    state: w.state,
    country: w.country,
    pinCode: w.pinCode,
    gstNumber: w.gstNumber,
    licenseNumber: w.licenseNumber,
    remarks: w.remarks,
    status: w.status,
    createdBy: w.createdBy,
    companyId: 1, // Default company
  };
}



export const warehouseService = {
  // Synchronous method for backward compatibility
  getAll(): WarehouseRecord[] {
    return warehousesCache;
  },

  // Asynchronous method to load warehouses from database and refresh cache
  async loadWarehouses(): Promise<WarehouseRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/warehouses');
      if (response.success && Array.isArray(response.data)) {
        warehousesCache = response.data.map(mapToUi);
      }
    } catch (err) {
      console.error("Failed to fetch warehouses from backend:", err);
      throw err;
    }
    return warehousesCache;
  },

  async addWarehouse(record: WarehouseRecord): Promise<WarehouseRecord> {
    const dbData = mapToDb(record);
    const response = await apiRequest<{ success: boolean; data: any }>('/warehouses', {
      method: 'POST',
      bodyData: dbData,
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to create warehouse');
    }
    const created = mapToUi(response.data);
    warehousesCache = [created, ...warehousesCache];
    return created;
  },

  async updateWarehouse(id: string, updatedRecord: WarehouseRecord): Promise<WarehouseRecord> {
    const dbData = mapToDb(updatedRecord);
    const response = await apiRequest<{ success: boolean; data: any }>(`/warehouses/${id}`, {
      method: 'PUT',
      bodyData: dbData,
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to update warehouse');
    }
    const updated = mapToUi(response.data);
    warehousesCache = warehousesCache.map(w => w.id === id ? updated : w);
    return updated;
  },

  async deleteWarehouse(id: string): Promise<boolean> {
    const response = await apiRequest<{ success: boolean }>(`/warehouses/${id}`, {
      method: 'DELETE',
    });
    if (response.success) {
      warehousesCache = warehousesCache.filter(w => w.id !== id);
    }
    return response.success;
  },

  saveAll(records: WarehouseRecord[]): void {
    warehousesCache = records;
  }
};