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
  status: 'Draft' | 'Submitted' | 'Approved';
}

let reportsCache: DailyReportRecord[] = [];

try {
  const data = localStorage.getItem("web_daily_reports");
  if (data) {
    reportsCache = JSON.parse(data);
  }
} catch (e) {
  console.error("Failed to parse cached daily reports:", e);
}

export const dailyReportService = {
  getAll(): DailyReportRecord[] {
    return reportsCache;
  },

  async loadDailyReports(mrId: number): Promise<DailyReportRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>(`/daily-reports/mr/${mrId}`);
      if (response.success && Array.isArray(response.data)) {
        reportsCache = response.data.map(dr => ({
          id: String(dr.id),
          date: dr.reportDate ? dr.reportDate.split('T')[0] : new Date().toISOString().split('T')[0],
          repName: dr.mr?.name || "Medical Representative",
          attendanceStatus: 'Present',
          workType: 'Field Work',
          hq: 'HQ',
          route: 'Route',
          beat: 'Beat',
          docCalls: dr.doctorVisits || 0,
          chemCalls: dr.chemistVisits || 0,
          totalCalls: (dr.doctorVisits || 0) + (dr.chemistVisits || 0),
          orderCollected: Number(dr.ordersCollected || 0),
          sampleGiven: dr.samplesDistributed || 0,
          remarks: dr.remarks || "",
          status: 'Submitted',
        }));
        localStorage.setItem("web_daily_reports", JSON.stringify(reportsCache));
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
      status: "SUBMITTED",
    };

    const response = await apiRequest<{ success: boolean; data: any }>('/daily-reports', {
      method: 'POST',
      bodyData: dbPayload,
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to create daily report');
    }

    const created = response.data;
    const mapped: DailyReportRecord = {
      id: String(created.id),
      date: created.reportDate ? created.reportDate.split('T')[0] : new Date().toISOString().split('T')[0],
      repName: created.mr?.name || report.repName || "Medical Representative",
      attendanceStatus: report.attendanceStatus || 'Present',
      workType: report.workType || 'Field Work',
      hq: report.hq || 'HQ',
      route: report.route || 'Route',
      beat: report.beat || 'Beat',
      docCalls: created.doctorVisits,
      chemCalls: created.chemistVisits,
      totalCalls: created.doctorVisits + created.chemistVisits,
      orderCollected: Number(created.ordersCollected),
      sampleGiven: created.samplesDistributed,
      remarks: created.remarks || "",
      status: 'Submitted',
    };

    reportsCache = [mapped, ...reportsCache];
    localStorage.setItem("web_daily_reports", JSON.stringify(reportsCache));
    return mapped;
  }
};
