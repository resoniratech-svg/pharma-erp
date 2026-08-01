import { apiRequest } from './apiClient';

export interface Activity {
  id: string;
  mrId: number;
  activityType: string;
  title: string;
  description: string;
  activityDate: string;
  status: string;
  createdAt: string;
}

export interface FollowUp {
  id: string;
  mrId: number;
  doctorId?: number | null;
  chemistId?: number | null;
  title: string;
  remarks?: string;
  followUpDate: string;
  status: string;
  createdAt: string;
}

export const crmService = {
  async getActivities(): Promise<Activity[]> {
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>('/activities');
      if (res && res.success && Array.isArray(res.data)) {
        return res.data.map((item: any) => ({
          id: String(item.id),
          mrId: item.mrId,
          activityType: item.activityType || 'Meeting',
          title: item.title || 'Unknown Activity',
          description: item.description || '',
          activityDate: item.activityDate,
          status: item.status || 'PENDING',
          createdAt: item.createdAt,
        }));
      }
      return [];
    } catch (err) {
      console.error('Failed to load activities', err);
      return [];
    }
  },

  async getFollowUps(): Promise<FollowUp[]> {
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>('/follow-ups');
      if (res && res.success && Array.isArray(res.data)) {
        return res.data.map((item: any) => ({
          id: String(item.id),
          mrId: item.mrId,
          doctorId: item.doctorId,
          chemistId: item.chemistId,
          title: item.title,
          remarks: item.remarks,
          followUpDate: item.followUpDate,
          status: item.status,
          createdAt: item.createdAt,
        }));
      }
      return [];
    } catch (err) {
      console.error('Failed to load follow-ups', err);
      return [];
    }
  }
};
