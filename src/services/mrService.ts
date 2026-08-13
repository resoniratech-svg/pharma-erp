import { apiRequest } from './apiClient';

export interface MRRecord {
  id: number;
  mrCode: string;
  name: string;
  mobile: string;
  email: string;
  territory: string;
  joiningDate: string;
  status: string;
}

export interface MRDashboardKPIs {
  mr: {
    id: number;
    mrId?: number;
    employeeCode: string;
    name: string;
    headquarters: string;
    area: string;
  };
  financialYear: string;
  assignedTarget: number;
  targetAchievement: number;
  remainingTarget: number;
  achievementPercentage: number;
  totalOrdersBooked: number;
  totalOrderValue: number;
  doctorVisitCount: number;
  chemistVisitCount: number;
  pendingDCRs: number;
  pendingTourPlans: number;
  attendanceStatus: string;
  todayAttendance: any;
}

export const mrService = {
  async getMRs(): Promise<MRRecord[]> {
    const response = await apiRequest<{ success: boolean; data: MRRecord[] }>('/mrs');
    return response.success ? response.data : [];
  },

  async getMRById(id: number): Promise<MRRecord | null> {
    const response = await apiRequest<{ success: boolean; data: MRRecord }>(`/mrs/${id}`);
    return response.success ? response.data : null;
  },

  async ensureMR(employeeName: string, employeeId?: string): Promise<number | null> {
    try {
      const mrs = await this.getMRs();
      const existing = mrs.find(m => m.name.toLowerCase() === employeeName.toLowerCase());
      if (existing) {
        return existing.id;
      }
      
      // Auto-create MR record if not found
      const newMR = {
        mrCode: `MR-${Date.now().toString().slice(-6)}`,
        name: employeeName,
        mobile: '0000000000',
        territory: 'Unassigned',
        status: 'ACTIVE'
      };
      
      const response = await apiRequest<{ success: boolean; data: MRRecord; message?: string }>('/mrs', {
        method: 'POST',
        bodyData: newMR
      });
      
      if (response.success && response.data) {
        return response.data.id;
      } else {
        alert(`MR Sync Error: The backend refused to create ${employeeName}. Reason: ` + (response.message || JSON.stringify(response)));
        return null;
      }
    } catch (e: any) {
      console.error('Failed to ensure MR exists:', e);
      alert(`MR Sync Critical Error: ${e.message || String(e)}`);
      return null;
    }
  },

  async getDashboardKPIs(financialYear = '2026-27', employeeId?: number): Promise<MRDashboardKPIs | null> {
    const url = `/dashboard/mr?financialYear=${encodeURIComponent(financialYear)}${employeeId ? `&employeeId=${employeeId}` : ''}`;
    const response = await apiRequest<{ success: boolean; data: MRDashboardKPIs }>(url);
    return response.success ? response.data : null;
  },
};

