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

const ACTIVITIES_KEY = 'crm_activities';
const FOLLOWUPS_KEY = 'crm_followups';

function getLocalActivities(): Activity[] {
  const stored = localStorage.getItem(ACTIVITIES_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as Activity[];
  } catch {
    return [];
  }
}

function getLocalFollowUps(): FollowUp[] {
  const stored = localStorage.getItem(FOLLOWUPS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as FollowUp[];
  } catch {
    return [];
  }
}

export const crmService = {
  async getActivities(): Promise<Activity[]> {
    return getLocalActivities();
  },

  async getFollowUps(): Promise<FollowUp[]> {
    return getLocalFollowUps();
  }
};
