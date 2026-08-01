import { apiRequest } from './apiClient';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'ASSIGNED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';

export interface Lead {
  id: string;
  leadCode: string;
  name: string;
  type: string;          // 'Doctor' | 'Chemist' | 'Hospital' | 'Distributor'
  mobile: string;
  email: string;
  address: string;
  territory: string;
  source: string;
  status: LeadStatus;
  assignedMrId: number | null;
  assignedMrName: string;
  createdAt: string;
}

function mapToUi(l: any): Lead {
  return {
    id: String(l.id),
    leadCode: l.leadCode || `LEAD-${l.id}`,
    name: l.name || '',
    type: l.type || 'Doctor',
    mobile: l.mobile || '',
    email: l.email || '',
    address: l.address || '',
    territory: l.territory || '',
    source: l.source || '',
    status: (l.status as LeadStatus) || 'NEW',
    assignedMrId: l.assignedMrId || null,
    assignedMrName: l.assignedMr?.user?.name || l.assignedMr?.name || '',
    createdAt: l.createdAt || new Date().toISOString(),
  };
}

export const leadService = {
  async getAll(): Promise<Lead[]> {
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>('/leads');
      return res.success && Array.isArray(res.data) ? res.data.map(mapToUi) : [];
    } catch (err) {
      console.error('Failed to load leads:', err);
      return [];
    }
  },

  async getById(id: string): Promise<Lead | null> {
    try {
      const res = await apiRequest<{ success: boolean; data: any }>(`/leads/${id}`);
      return res.success && res.data ? mapToUi(res.data) : null;
    } catch {
      return null;
    }
  },

  async create(data: {
    name: string;
    type: string;
    mobile?: string;
    email?: string;
    address?: string;
    territory?: string;
    source?: string;
  }): Promise<Lead> {
    const leadCode = `LEAD-${Date.now()}`;
    const res = await apiRequest<{ success: boolean; data: any }>('/leads', {
      method: 'POST',
      bodyData: { ...data, leadCode, status: 'NEW' },
    });
    if (!res.success || !res.data) throw new Error('Failed to create lead');
    return mapToUi(res.data);
  },

  async update(id: string, updates: Partial<Lead>): Promise<Lead | null> {
    try {
      const res = await apiRequest<{ success: boolean; data: any }>(`/leads/${id}`, {
        method: 'PUT',
        bodyData: updates,
      });
      return res.success && res.data ? mapToUi(res.data) : null;
    } catch {
      return null;
    }
  },

  async updateStatus(id: string, status: LeadStatus): Promise<Lead | null> {
    return this.update(id, { status });
  },

  async assign(id: string, mrId: number): Promise<Lead | null> {
    try {
      const res = await apiRequest<{ success: boolean; data: any }>(`/leads/${id}/assign`, {
        method: 'PUT',
        bodyData: { mrId },
      });
      return res.success && res.data ? mapToUi(res.data) : null;
    } catch {
      return null;
    }
  },

  async convert(id: string): Promise<Lead | null> {
    try {
      const res = await apiRequest<{ success: boolean; data: any }>(`/leads/${id}/convert`, {
        method: 'PUT',
        bodyData: {},
      });
      return res.success && res.data ? mapToUi(res.data) : null;
    } catch {
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await apiRequest<{ success: boolean }>(`/leads/${id}`, { method: 'DELETE' });
      return res.success;
    } catch {
      return false;
    }
  },
};
