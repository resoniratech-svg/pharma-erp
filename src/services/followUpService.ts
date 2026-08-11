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
  nextFollowUpDate?: string;
  createdAt: string;
}

const STORAGE_KEY = 'crm_followups';

function getLocalFollowUps(): FollowUp[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as FollowUp[];
  } catch {
    return [];
  }
}

function saveLocalFollowUps(items: FollowUp[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const followUpService = {
  async getAll(): Promise<FollowUp[]> {
    try {
      const res = await apiRequest<{ success: boolean; data: FollowUp[] }>('/follow-ups');
      if (res.success && res.data) {
        saveLocalFollowUps(res.data);
        return res.data;
      }
    } catch (e) {
      console.error(e);
    }
    return getLocalFollowUps();
  },

  async getByMr(mrId: number): Promise<FollowUp[]> {
    try {
      const res = await apiRequest<{ success: boolean; data: FollowUp[] }>(`/follow-ups?mrId=${mrId}`);
      if (res.success && res.data) return res.data;
    } catch (e) {
      console.error(e);
    }
    return getLocalFollowUps().filter(f => f.mrId === mrId);
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
    nextFollowUpDate?: string;
  }): Promise<FollowUp> {
    try {
      const res = await apiRequest<{ success: boolean; data: FollowUp }>('/follow-ups', {
        method: 'POST',
        bodyData: data
      });
      if (res.success && res.data) {
        const items = getLocalFollowUps();
        items.push(res.data);
        saveLocalFollowUps(items);
        return res.data;
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
    throw new Error('Failed to create follow-up');
  },

  async update(id: string, updates: Partial<FollowUp>): Promise<FollowUp | null> {
    try {
      const res = await apiRequest<{ success: boolean; data: FollowUp }>(`/follow-ups/${id}`, {
        method: 'PUT',
        bodyData: updates
      });
      if (res.success && res.data) {
        const items = getLocalFollowUps();
        const index = items.findIndex(f => String(f.id) === String(id));
        if (index !== -1) {
          items[index] = res.data;
          saveLocalFollowUps(items);
        }
        return res.data;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await apiRequest<{ success: boolean }>(`/follow-ups/${id}`, { method: 'DELETE' });
      if (res.success) return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  },
};
