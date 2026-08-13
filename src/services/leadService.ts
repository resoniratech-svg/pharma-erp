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
  createdByEmpId?: string;
  createdByRole?: string;
  createdByName?: string;
  contactPerson?: string;
  leadDate?: string;
  state?: string;
  district?: string;
  city?: string;
  priority?: string;
  followUpDate?: string;
  conversionDate?: string;
  convertedBy?: string;
}

const STORAGE_KEY = 'local_leads';

function getLocalLeads(): Lead[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as Lead[];
  } catch {
    return [];
  }
}

function saveLocalLeads(leads: Lead[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

function normalizeLead(lead: any): Lead {
  let createdByEmpId = lead.createdByEmpId;
  let createdByRole = lead.createdByRole;
  let createdByName = lead.createdByName;

  if (lead.creatorInfo && typeof lead.creatorInfo === 'string') {
    try {
      const parsed = JSON.parse(lead.creatorInfo);
      createdByEmpId = parsed.empId || createdByEmpId;
      createdByRole = parsed.role || createdByRole;
      createdByName = parsed.name || createdByName;
    } catch (e) {
      // ignore
    }
  }

  const assignedMrName = lead.assignedMrName || lead.assignedTo || (lead.assignedMr ? lead.assignedMr.name : '');

  return {
    ...lead,
    createdByEmpId,
    createdByRole,
    createdByName,
    assignedMrName,
    assignedTo: assignedMrName,
  };
}

export const leadService = {
  async getAll(): Promise<Lead[]> {
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>('/leads');
      if (res.success && res.data) {
        const normalized = res.data.map(normalizeLead);
        saveLocalLeads(normalized);
        return normalized;
      }
    } catch (e) {
      console.error(e);
    }
    return getLocalLeads();
  },

  async getById(id: string): Promise<Lead | null> {
    try {
      const res = await apiRequest<{ success: boolean; data: any }>(`/leads/${id}`);
      if (res.success && res.data) return normalizeLead(res.data);
    } catch (e) {
      console.error(e);
    }
    const leads = getLocalLeads();
    return leads.find(l => String(l.id) === String(id)) || null;
  },

  async create(data: {
    name: string;
    type: string;
    mobile?: string;
    email?: string;
    address?: string;
    territory?: string;
    source?: string;
    contactPerson?: string;
    leadDate?: string;
    state?: string;
    district?: string;
    city?: string;
    priority?: string;
    followUpDate?: string;
    assignedTo?: string;
    creatorInfo?: {
      empId: string;
      role: string;
      name: string;
    };
  }): Promise<Lead> {
    try {
      const res = await apiRequest<{ success: boolean; data: any }>('/leads', {
        method: 'POST',
        bodyData: data
      });
      if (res.success && res.data) {
        const normalized = normalizeLead(res.data);
        const leads = getLocalLeads();
        leads.push(normalized);
        saveLocalLeads(leads);
        return normalized;
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
    throw new Error('Failed to create lead');
  },

  async update(id: string, updates: Partial<Lead>): Promise<Lead | null> {
    try {
      const res = await apiRequest<{ success: boolean; data: Lead }>(`/leads/${id}`, {
        method: 'PUT',
        bodyData: updates
      });
      if (res.success && res.data) {
        const leads = getLocalLeads();
        const idx = leads.findIndex(l => String(l.id) === String(id));
        if (idx !== -1) {
          leads[idx] = res.data;
          saveLocalLeads(leads);
        }
        return res.data;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  },

  async updateStatus(id: string, status: LeadStatus): Promise<Lead | null> {
    return this.update(id, { status });
  },

  async assign(id: string, mrId: number): Promise<Lead | null> {
    try {
      const res = await apiRequest<{ success: boolean; data: Lead }>(`/leads/${id}/assign`, {
        method: 'PATCH',
        bodyData: { mrId }
      });
      if (res.success && res.data) return res.data;
    } catch (e) {
      console.error(e);
    }
    return this.update(id, { assignedMrId: mrId, assignedMrName: `MR-${mrId}` }); // Fallback
  },

  async convert(id: string, convertedTo: string, stockistId?: number): Promise<Lead | null> {
    try {
      const res = await apiRequest<{ success: boolean; data: Lead }>(`/leads/${id}/convert`, {
        method: 'PATCH',
        bodyData: { convertedTo, stockistId }
      });
      if (res.success && res.data) return res.data;
      throw new Error("Backend rejected conversion");
    } catch (e) {
      console.error(e);
      throw new Error("Failed to convert lead in database. Check backend constraints.");
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await apiRequest<{ success: boolean }>(`/leads/${id}`, { method: 'DELETE' });
      if (res.success) return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  },
};

