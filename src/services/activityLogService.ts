import { apiRequest } from './apiClient';

const STORAGE_KEY = 'activityLogs';

export interface ActivityLog {
  id?: string;
  userId?: string;
  userName?: string;
  action: string;
  module: string;
  status?: string;
  timestamp?: string;
  dateTime?: string;
  ipAddress?: string;
}

export class ActivityLogService {
  getLogs() {
    const logs = localStorage.getItem(STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
  }

  async loadLogs(): Promise<any[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/activity-logs');
      if (response && response.success && Array.isArray(response.data)) {
        const mappedLogs = response.data.map((l: any) => ({
          id: String(l.id),
          userName: l.user ? l.user.fullName : (l.userName || 'System'),
          userRole: l.user ? l.user.role : 'Super Admin',
          activityType: l.module || 'System',
          module: l.module || 'System',
          action: l.action,
          ipAddress: l.ipAddress || '127.0.0.1',
          dateTime: l.createdAt ? new Date(l.createdAt).toLocaleString('en-GB') : new Date().toLocaleString('en-GB'),
          status: l.status || 'Success',
          details: l.details || l.action
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mappedLogs));
        return mappedLogs;
      }
    } catch (e) {
      console.warn("Failed to load activity logs from backend API:", e);
    }
    return this.getLogs();
  }

  async addLog(log: {
    userId?: string;
    userName?: string;
    action: string;
    module: string;
    status?: string;
  }) {
    const logs = this.getLogs();

    const newLog = {
      id: Date.now().toString(),
      status: 'Success',
      ...log,
      timestamp: new Date().toISOString(),
    };

    logs.unshift(newLog);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(logs)
    );

    try {
      await apiRequest('/activity-logs', {
        method: 'POST',
        bodyData: {
          action: log.action,
          module: log.module,
          userId: log.userId ? parseInt(log.userId, 10) : undefined,
          userName: log.userName,
          status: log.status || 'Success',
          details: log.action
        }
      });
    } catch (e) {
      console.warn("Failed to sync activity log to backend", e);
    }
  }

  clearLogs() {
    localStorage.removeItem(STORAGE_KEY);
  }
}

const activityLogService =
  new ActivityLogService();

export default activityLogService;