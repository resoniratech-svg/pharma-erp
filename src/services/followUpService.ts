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
    return getLocalFollowUps();
  },

  async getByMr(mrId: number): Promise<FollowUp[]> {
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
  }): Promise<FollowUp> {
    const items = getLocalFollowUps();
    const newId = String(Date.now());
    
    const newFollowUp: FollowUp = {
      id: newId,
      title: data.title || '',
      remarks: data.remarks || '',
      followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: 'PENDING',
      mrId: data.mrId,
      doctorId: data.doctorId,
      chemistId: data.chemistId,
      meetingId: data.meetingId,
      leadId: data.leadId,
      type: data.type || '',
      method: data.method || '',
      createdAt: new Date().toISOString(),
    };
    
    items.push(newFollowUp);
    saveLocalFollowUps(items);
    return newFollowUp;
  },

  async update(id: string, updates: Partial<FollowUp>): Promise<FollowUp | null> {
    const items = getLocalFollowUps();
    const index = items.findIndex(f => f.id === id);
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updates };
    saveLocalFollowUps(items);
    return items[index];
  },

  async delete(id: string): Promise<boolean> {
    const items = getLocalFollowUps();
    const filtered = items.filter(f => f.id !== id);
    if (items.length === filtered.length) return false;
    
    saveLocalFollowUps(filtered);
    return true;
  },
};
