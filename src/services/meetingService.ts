import { apiRequest } from './apiClient';

export interface MRMeeting {
  id: string;
  title: string;
  type: string;
  organizer: string;
  location: string;
  meetingMode: 'Offline' | 'Online' | 'Hybrid';
  date: string;
  time: string;
  rawTime: string;
  priority: 'High' | 'Medium' | 'Low';
  reminder: '15 Minutes' | '30 Minutes' | '1 Hour' | '1 Day' | 'None';
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  agenda: string;
  participants: string;
  attendeesCount: number;
  followUpDate: string;
  outcome: string;
}

const STORAGE_KEY = 'crm_meetings';

function getLocalMeetings(): MRMeeting[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as MRMeeting[];
  } catch {
    return [];
  }
}

function saveLocalMeetings(meetings: MRMeeting[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
}

export const meetingService = {
  getAll(): MRMeeting[] {
    return getLocalMeetings();
  },

  async loadMeetings(mrId: number): Promise<MRMeeting[]> {
    try {
      const res = await apiRequest<{ success: boolean; data: MRMeeting[] }>(`/meetings?mrId=${mrId}`);
      if (res.success && res.data) {
        saveLocalMeetings(res.data);
        return res.data;
      }
    } catch (e) {
      console.error(e);
    }
    return getLocalMeetings();
  },

  async addMeeting(mrId: number, meeting: Partial<MRMeeting> & { doctorId?: number; chemistId?: number }): Promise<MRMeeting> {
    try {
      const res = await apiRequest<{ success: boolean; data: MRMeeting }>('/meetings', {
        method: 'POST',
        bodyData: { ...meeting, mrId }
      });
      if (res.success && res.data) {
        const meetings = getLocalMeetings();
        meetings.push(res.data);
        saveLocalMeetings(meetings);
        return res.data;
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
    throw new Error('Failed to create meeting');
  },

  async updateMeeting(id: number | string, data: Partial<MRMeeting>): Promise<boolean> {
    try {
      const res = await apiRequest<{ success: boolean; data: MRMeeting }>(`/meetings/${id}`, {
        method: 'PUT',
        bodyData: data
      });
      if (res.success && res.data) {
        const meetings = getLocalMeetings();
        const index = meetings.findIndex(m => String(m.id) === String(id));
        if (index !== -1) {
          meetings[index] = res.data;
          saveLocalMeetings(meetings);
        }
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  },

  async deleteMeeting(id: number | string): Promise<boolean> {
    try {
      const res = await apiRequest<{ success: boolean }>(`/meetings/${id}`, { method: 'DELETE' });
      if (res.success) return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  },

  async completeMeeting(id: number | string): Promise<boolean> {
    return this.updateMeeting(id, { status: 'Completed' });
  },

  async cancelMeeting(id: number | string): Promise<boolean> {
    return this.updateMeeting(id, { status: 'Cancelled' });
  }
};
