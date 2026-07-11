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

let meetingsCache: MRMeeting[] = [];

try {
  // Memory cache only, localStorage removed to prevent state mismatch
} catch (e) {
  console.error("Failed to parse cached meetings:", e);
}

export const meetingService = {
  getAll(): MRMeeting[] {
    return meetingsCache;
  },

  async loadMeetings(mrId: number): Promise<MRMeeting[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>(`/meetings/mr/${mrId}`);
      if (response.success && Array.isArray(response.data)) {
        meetingsCache = response.data.map(m => ({
          id: String(m.id),
          title: m.title || "Meeting",
          type: 'Cycle Meeting',
          organizer: m.mr?.name || "Medical Representative",
          location: 'Office',
          meetingMode: 'Offline',
          date: m.meetingDate ? m.meetingDate.split('T')[0] : new Date().toISOString().split('T')[0],
          time: m.meetingDate ? new Date(m.meetingDate).toTimeString().slice(0, 5) : "10:00",
          rawTime: '10:00',
          priority: 'Medium',
          reminder: '15 Minutes',
          status: m.status ? m.status.charAt(0).toUpperCase() + m.status.slice(1).toLowerCase() as any : 'Scheduled',
          agenda: m.description || "",
          participants: '',
          attendeesCount: 0,
          followUpDate: '',
          outcome: '',
        }));
      }
    } catch (err) {
      console.error("Failed to load meetings from backend:", err);
    }
    return meetingsCache;
  },

  async addMeeting(mrId: number, meeting: Partial<MRMeeting> & { doctorId?: number; chemistId?: number }): Promise<MRMeeting> {
    const dbPayload = {
      mrId,
      doctorId: meeting.doctorId || null,
      chemistId: meeting.chemistId || null,
      title: meeting.title || "Meeting",
      description: meeting.agenda || "",
      meetingDate: meeting.date ? new Date(meeting.date + 'T' + (meeting.time || '10:00') + ':00').toISOString() : new Date().toISOString(),
    };

    const response = await apiRequest<{ success: boolean; data: any }>('/meetings', {
      method: 'POST',
      bodyData: dbPayload,
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to create meeting');
    }

    const created = response.data;
    const mapped: MRMeeting = {
      id: String(created.id),
      title: created.title,
      type: meeting.type || 'Cycle Meeting',
      organizer: created.mr?.name || meeting.organizer || "Medical Representative",
      location: meeting.location || 'Office',
      meetingMode: meeting.meetingMode || 'Offline',
      date: created.meetingDate ? created.meetingDate.split('T')[0] : new Date().toISOString().split('T')[0],
      time: created.meetingDate ? new Date(created.meetingDate).toTimeString().slice(0, 5) : "10:00",
      rawTime: meeting.time || '10:00',
      priority: meeting.priority || 'Medium',
      reminder: meeting.reminder || '15 Minutes',
      status: 'Scheduled',
      agenda: created.description || "",
      participants: meeting.participants || '',
      attendeesCount: meeting.attendeesCount || 0,
      followUpDate: meeting.followUpDate || '',
      outcome: meeting.outcome || '',
    };

    meetingsCache = [mapped, ...meetingsCache];
    return mapped;
  },

  async completeMeeting(id: number | string): Promise<boolean> {
    const response = await apiRequest<{ success: boolean }>(`/meetings/${id}/complete`, {
      method: 'PATCH',
    });
    if (response.success) {
      meetingsCache = meetingsCache.map(m => m.id === String(id) ? { ...m, status: 'Completed' } : m);
    }
    return response.success;
  },

  async cancelMeeting(id: number | string): Promise<boolean> {
    const response = await apiRequest<{ success: boolean }>(`/meetings/${id}/cancel`, {
      method: 'PATCH',
    });
    if (response.success) {
      meetingsCache = meetingsCache.map(m => m.id === String(id) ? { ...m, status: 'Cancelled' } : m);
    }
    return response.success;
  }
};
