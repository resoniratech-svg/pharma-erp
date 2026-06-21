const STORAGE_KEY = 'activityLogs';

export interface ActivityLog {
  id?: string;
  userId?: string;
  userName?: string;
  action: string;
  module: string;
}


export class ActivityLogService {
  getLogs() {
    const logs = localStorage.getItem(STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
  }

  addLog(log: {
    userId?: string;
    userName?: string;
    action: string;
    module: string;
  }) {
    const logs = this.getLogs();

    const newLog = {
      id: Date.now().toString(),
      ...log,
      timestamp: new Date().toISOString(),
      status: 'Success',
    };

    logs.unshift(newLog);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(logs)
    );
  }

  clearLogs() {
    localStorage.removeItem(STORAGE_KEY);
  }
}

const activityLogService =
  new ActivityLogService();

export default activityLogService;