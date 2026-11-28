import { apiRequest } from './apiClient';

export interface LinkedProductSummary {
  id: string;
  name: string;
  code: string;
  brandName?: string;
  mrp?: string | number;
  status?: string;
}

export interface CompositionRecord {
  id: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  therapeuticClass: string;
  schedule: string;
  description: string;
  associatedProducts: number;
  linkedProducts?: LinkedProductSummary[];
  status: 'Active' | 'Inactive';
  createdBy: string;
  createdDate: string;
}

function mapToUi(c: any): CompositionRecord {
  const productsList = Array.isArray(c.products) ? c.products.map((p: any) => ({
    id: String(p.id),
    name: p.name || '',
    code: p.code || '',
    brandName: p.brandName || '',
    mrp: p.mrp !== undefined ? p.mrp : '',
    status: p.status || 'Active',
  })) : [];

  return {
    id: String(c.id),
    genericName: c.genericName || '',
    strength: c.strength || '',
    dosageForm: c.dosageForm || '',
    therapeuticClass: c.therapeuticClass || '',
    schedule: c.schedule || '',
    description: c.description || '',
    associatedProducts: typeof c.associatedProducts === 'number' ? c.associatedProducts : productsList.length,
    linkedProducts: productsList,
    status: c.status === 'Inactive' ? 'Inactive' : 'Active',
    createdBy: c.createdBy || 'System',
    createdDate: c.createdAt ? c.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

export const compositionService = {
  async getAll(): Promise<CompositionRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/compositions');
      if (response.success && Array.isArray(response.data)) {
        return response.data.map(mapToUi);
      }
      return [];
    } catch (err) {
      console.error('Failed to load compositions:', err);
      return [];
    }
  },

  async add(record: Omit<CompositionRecord, 'id' | 'associatedProducts' | 'createdDate'>): Promise<CompositionRecord> {
    const response = await apiRequest<{ success: boolean; data: any }>('/compositions', {
      method: 'POST',
      bodyData: {
        genericName: record.genericName,
        strength: record.strength,
        dosageForm: record.dosageForm,
        therapeuticClass: record.therapeuticClass,
        schedule: record.schedule,
        description: record.description,
        status: record.status,
        createdBy: record.createdBy,
      },
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to create composition');
    }
    return mapToUi(response.data);
  },

  async update(id: string, record: Partial<CompositionRecord>): Promise<CompositionRecord> {
    const response = await apiRequest<{ success: boolean; data: any }>(`/compositions/${id}`, {
      method: 'PUT',
      bodyData: {
        genericName: record.genericName,
        strength: record.strength,
        dosageForm: record.dosageForm,
        therapeuticClass: record.therapeuticClass,
        schedule: record.schedule,
        description: record.description,
        status: record.status,
      },
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to update composition');
    }
    return mapToUi(response.data);
  },

  async delete(id: string): Promise<boolean> {
    const response = await apiRequest<{ success: boolean }>(`/compositions/${id}`, {
      method: 'DELETE',
    });
    return response.success;
  },

  // Keep for backward compat - now async wrapper
  saveAll(_compositions: any[]) {
    // No-op: data is saved via add/update directly to DB
  },
};