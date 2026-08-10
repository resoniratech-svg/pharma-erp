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
    return getLocalMeetings();
  },

  async addMeeting(mrId: number, meeting: Partial<MRMeeting> & { doctorId?: number; chemistId?: number }): Promise<MRMeeting> {
    const meetings = getLocalMeetings();
    const newId = String(Date.now());
    
    const mapped: MRMeeting = {
      id: newId,
      title: meeting.title || "Meeting",
      type: meeting.type || 'Cycle Meeting',
      organizer: meeting.organizer || "Medical Representative",
      location: meeting.location || 'Office',
      meetingMode: meeting.meetingMode || 'Offline',
      date: meeting.date || new Date().toISOString().split('T')[0],
      time: meeting.time || "10:00",
      rawTime: meeting.rawTime || meeting.time || '10:00',
      priority: meeting.priority || 'Medium',
      reminder: meeting.reminder || '15 Minutes',
      status: 'Scheduled',
      agenda: meeting.agenda || "",
      participants: meeting.participants || '',
      attendeesCount: meeting.attendeesCount || 0,
      followUpDate: meeting.followUpDate || '',
      outcome: meeting.outcome || '',
    };
    
    meetings.push(mapped);
    saveLocalMeetings(meetings);
    return mapped;
  },

  async updateMeeting(id: number | string, data: Partial<MRMeeting>): Promise<boolean> {
    const meetings = getLocalMeetings();
    const index = meetings.findIndex(m => m.id === String(id));
    if (index === -1) return false;
    
    meetings[index] = { ...meetings[index], ...data };
    saveLocalMeetings(meetings);
    return true;
  },

  async deleteMeeting(id: number | string): Promise<boolean> {
    const meetings = getLocalMeetings();
    const filtered = meetings.filter(m => m.id !== String(id));
    if (meetings.length === filtered.length) return false;
    
    saveLocalMeetings(filtered);
    return true;
  },

  async completeMeeting(id: number | string): Promise<boolean> {
    return this.updateMeeting(id, { status: 'Completed' });
  },

  async cancelMeeting(id: number | string): Promise<boolean> {
    return this.updateMeeting(id, { status: 'Cancelled' });
  }
};
