import { apiRequest } from './apiClient';

export interface FollowUp {
  id: string;
  title: string;
  remarks: string;
  followUpDate: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  mrId: number;
  doctorId?: number;
  chemistId?: number;
  meetingId?: number;
  leadId?: number;
  type?: string;
  method?: string;
  createdAt: string;
}

function mapToUi(f: any): FollowUp {
  return {
    id: String(f.id),
    title: f.title || '',
    remarks: f.remarks || '',
    followUpDate: f.followUpDate
      ? new Date(f.followUpDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    status: (f.status as FollowUp['status']) || 'PENDING',
    mrId: f.mrId,
    doctorId: f.doctorId || undefined,
    chemistId: f.chemistId || undefined,
    meetingId: f.meetingId || undefined,
    leadId: f.leadId || undefined,
    type: f.type || '',
    method: f.method || '',
    createdAt: f.createdAt || new Date().toISOString(),
  };
}

export const followUpService = {
  async getAll(): Promise<FollowUp[]> {
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>('/follow-ups');
      return res.success && Array.isArray(res.data) ? res.data.map(mapToUi) : [];
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
      return [];
    }
  },

  async getByMr(mrId: number): Promise<FollowUp[]> {
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>(`/follow-ups/mr/${mrId}`);
      return res.success && Array.isArray(res.data) ? res.data.map(mapToUi) : [];
    } catch {
      return [];
    }
  },

  async create(data: {
    mrId: number;
    title: string;
    remarks?: string;
    followUpDate: string;
    doctorId?: number;
    chemistId?: number;
    meetingId?: number;
    leadId?: number;
    type?: string;
    method?: string;
  }): Promise<FollowUp> {
    const res = await apiRequest<{ success: boolean; data: any }>('/follow-ups', {
      method: 'POST',
      bodyData: { ...data, status: 'PENDING' },
    });
    if (!res.success || !res.data) throw new Error('Failed to create follow-up');
    return mapToUi(res.data);
  },

  async update(id: string, updates: Partial<FollowUp>): Promise<FollowUp | null> {
    try {
      const res = await apiRequest<{ success: boolean; data: any }>(`/follow-ups/${id}`, {
        method: 'PUT',
        bodyData: updates,
      });
      return res.success && res.data ? mapToUi(res.data) : null;
    } catch {
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await apiRequest<{ success: boolean }>(`/follow-ups/${id}`, { method: 'DELETE' });
      return res.success;
    } catch {
      return false;
    }
  },
};
