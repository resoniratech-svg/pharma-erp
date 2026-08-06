import { apiRequest } from './apiClient';

export interface DailyReportRecord {
  id: string;
  date: string;
  repName: string;
  attendanceStatus: string;
  workType: string;
  hq: string;
  route: string;
  beat: string;
  docCalls: number;
  chemCalls: number;
  totalCalls: number;
  orderCollected: number;
  sampleGiven: number;
  remarks: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  workingHours?: string;
  totalKmTravelled?: number;
  activityScore?: number;
  challenges?: string;
  nextDayPlan?: string;
}

let reportsCache: DailyReportRecord[] = [];

const mapBackendToDailyReport = (dr: any): DailyReportRecord => {
  let uiStatus: DailyReportRecord['status'] = 'Submitted';
  const rawStatus = (dr.status || '').toUpperCase();
  if (rawStatus === 'APPROVED') uiStatus = 'Approved';
  else if (rawStatus === 'REJECTED') uiStatus = 'Rejected';
  else if (rawStatus === 'DRAFT') uiStatus = 'Draft';
  else uiStatus = 'Submitted';

  const docCalls = dr.doctorVisits || dr.docCalls || 0;
  const chemCalls = dr.chemistVisits || dr.chemCalls || 0;

  return {
    id: String(dr.id),
    date: dr.reportDate ? dr.reportDate.split('T')[0] : (dr.date || new Date().toISOString().split('T')[0]),
    repName: dr.mr?.name || "Medical Representative",
    attendanceStatus: dr.attendanceStatus || 'Present',
    workType: dr.workType || 'Field Work',
    hq: dr.hq || 'HQ',
    route: dr.route || 'Route',
    beat: dr.beat || 'Beat',
    docCalls,
    chemCalls,
    totalCalls: docCalls + chemCalls,
    orderCollected: Number(dr.ordersCollected || dr.orderCollected || 0),
    sampleGiven: dr.samplesDistributed || dr.sampleGiven || 0,
    remarks: dr.remarks || "",
    status: uiStatus,
    workingHours: dr.workingHours || '8h 00m',
    totalKmTravelled: dr.totalKmTravelled || 0,
    activityScore: dr.activityScore || (docCalls * 3 + chemCalls * 2 + (Number(dr.ordersCollected || 0) > 0 ? 5 : 0)),
    challenges: dr.challenges || '',
    nextDayPlan: dr.nextDayPlan || '',
  };
};

export const dailyReportService = {
  getAll(): DailyReportRecord[] {
    return reportsCache;
  },

  async loadDailyReports(mrId?: number): Promise<DailyReportRecord[]> {
    try {
      const endpoint = mrId ? `/daily-reports/mr/${mrId}` : '/daily-reports';
      const response = await apiRequest<{ success: boolean; data: any[] }>(endpoint);
      if (response.success && Array.isArray(response.data)) {
        reportsCache = response.data.map(mapBackendToDailyReport);
      }
    } catch (err) {
      console.error("Failed to load daily reports from backend:", err);
    }
    return reportsCache;
  },

  async addDailyReport(mrId: number, report: Partial<DailyReportRecord>): Promise<DailyReportRecord> {
    const dbPayload = {
      mrId,
      reportDate: report.date ? new Date(report.date).toISOString() : new Date().toISOString(),
      doctorVisits: report.docCalls || 0,
      chemistVisits: report.chemCalls || 0,
      samplesDistributed: report.sampleGiven || 0,
      ordersCollected: report.orderCollected || 0,
      remarks: report.remarks || "",
      status: report.status || "Submitted",
    };

    const response = await apiRequest<{ success: boolean; data: any }>('/daily-reports', {
      method: 'POST',
      bodyData: dbPayload,
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to create daily report');
    }

    const created = mapBackendToDailyReport(response.data);
    reportsCache = [created, ...reportsCache];
    return created;
  },

  async updateDailyReport(id: string | number, updates: Partial<DailyReportRecord>): Promise<DailyReportRecord | null> {
    try {
      const dbPayload: any = {};
      if (updates.docCalls !== undefined) dbPayload.doctorVisits = updates.docCalls;
      if (updates.chemCalls !== undefined) dbPayload.chemistVisits = updates.chemCalls;
      if (updates.sampleGiven !== undefined) dbPayload.samplesDistributed = updates.sampleGiven;
      if (updates.orderCollected !== undefined) dbPayload.ordersCollected = updates.orderCollected;
      if (updates.remarks !== undefined) dbPayload.remarks = updates.remarks;
      if (updates.status) dbPayload.status = updates.status;

      const response = await apiRequest<{ success: boolean; data: any }>(`/daily-reports/${id}`, {
        method: 'PUT',
        bodyData: dbPayload,
      });

      if (response.success && response.data) {
        const updated = mapBackendToDailyReport(response.data);
        reportsCache = reportsCache.map(r => r.id === String(id) ? updated : r);
        return updated;
      }
    } catch (err) {
      console.error("Failed to update daily report:", err);
    }
    return null;
  },

  async deleteDailyReport(id: string | number): Promise<boolean> {
    try {
      const response = await apiRequest<{ success: boolean }>(`/daily-reports/${id}`, {
        method: 'DELETE',
      });
      if (response.success) {
        reportsCache = reportsCache.filter(r => r.id !== String(id));
        return true;
      }
    } catch (err) {
      console.error("Failed to delete daily report:", err);
    }
    return false;
  }
};
