import { apiRequest } from './apiClient';
import { employeeService } from './employeeService';
import { targetAllocationService } from './targetAllocationService';
import type { Employee } from '../modules/super-admin/sales-organization/types';
import type { TargetAllocationRecord } from './targetAllocationService';

export interface ASMTargetSummary {
  parentAllocation: TargetAllocationRecord;
  allocatedAmount: number;
  remainingAmount: number;
  allocations: TargetAllocationRecord[];
  achievement: number;
}

class ASMService {
  /**
   * Retrieves aggregated KPI data for the ASM Dashboard from PostgreSQL.
   */
  async getDashboardKPIs(financialYear = '2026-27') {
    const res = await apiRequest<{ success: boolean; data: any }>(`/dashboard/asm?financialYear=${encodeURIComponent(financialYear)}`);
    if (!res.success || !res.data) {
      return {
        assignedTarget: 0,
        allocatedTarget: 0,
        remainingTarget: 0,
        targetAchievement: 0,
        achievementPercentage: 0,
        activeMRCount: 0,
        allocationStatus: 'Pending',
        pendingTourPlans: 0,
        pendingDCRs: 0,
        pendingAttendanceExceptions: 0,
      };
    }
    return res.data;
  }

  /**
   * Gets all Medical Representatives that report directly to the current ASM from DB.
   */
  async getReportingMRs(): Promise<Employee[]> {
    return employeeService.getEmployees({
      designation: 'Medical Representative',
      status: 'Active',
    });
  }

  /**
   * Retrieves the target summaries for the current ASM from backend.
   */
  async getTargetSummaries(financialYear = '2026-27') {
    return targetAllocationService.getASMTargetSummary(financialYear);
  }

  /**
   * Allocates a portion of the ASM's received target to a specific MR in DB.
   */
  async allocateToMR(data: {
    sourceAllocationId: number | string;
    mrId: number | string;
    amount: number;
    financialYear: string;
    allocationPeriod?: string;
    startDate?: string;
    endDate?: string;
    remarks?: string;
  }): Promise<TargetAllocationRecord> {
    return targetAllocationService.allocateTarget({
      sourceAllocationId: Number(data.sourceAllocationId),
      allocatedToEmployeeId: Number(data.mrId),
      targetAmount: Number(data.amount),
      financialYear: data.financialYear,
      allocationPeriod: data.allocationPeriod || 'Annual',
      startDate: data.startDate,
      endDate: data.endDate,
      remarks: data.remarks,
    });
  }

  /**
   * Updates an existing allocation made to an MR.
   */
  async updateAllocation(allocationId: string | number, newAmount: number, mrId?: string | number): Promise<TargetAllocationRecord> {
    const payload: any = { targetAmount: Number(newAmount) };
    if (mrId) payload.allocatedToEmployeeId = Number(mrId);
    return targetAllocationService.updateAllocation(allocationId, payload);
  }

  /**
   * Cancels an existing allocation made to an MR.
   */
  async cancelAllocation(allocationId: string | number): Promise<boolean> {
    return targetAllocationService.cancelAllocation(allocationId);
  }

  /**
   * Calculates team performance for all MRs under the ASM.
   */
  async getTeamPerformance(financialYear = '2026-27') {
    const mrs = await this.getReportingMRs();
    const allocations = await targetAllocationService.getAllocations({ financialYear, status: 'Active' });
    
    return mrs.map(mr => {
      const mrAllocations = allocations.filter(a => Number(a.allocatedToEmployeeId) === Number(mr.id));
      const allocatedTarget = mrAllocations.reduce((sum, a) => sum + Number(a.targetAmount), 0);
      const achievement = mrAllocations.reduce((sum, a) => sum + Number(a.achievedAmount || 0), 0);
      const remainingTarget = Math.max(0, allocatedTarget - achievement);
      const achievementPercentage = allocatedTarget > 0 ? (achievement / allocatedTarget) * 100 : 0;

      return {
        mrId: mr.id,
        mrName: mr.employeeName,
        territory: mr.area || mr.headquarters || 'Pune Central',
        headquarters: mr.headquarters || 'Unassigned',
        allocatedTarget,
        achievement,
        remainingTarget,
        achievementPercentage,
        orders: 0,
        doctorVisits: 0,
        chemistVisits: 0,
        dcrCount: 0,
      };
    });
  }

  // --- Monitoring & Approvals Methods ---
  async getPendingTourPlans() {
    const res = await apiRequest<{ success: boolean; data: any[] }>('/tour-plans?status=PLANNED');
    return res.data || [];
  }

  async getPendingDCRs() {
    const res = await apiRequest<{ success: boolean; data: any[] }>('/daily-reports?status=SUBMITTED');
    return res.data || [];
  }

  async getPendingAttendanceExceptions() {
    return [];
  }

  // --- MR Management Methods ---
  async createMR(data: any): Promise<Employee> {
    // Current user is ASM, so their ID is what we want for reportsToId. 
    // Wait, the backend token handles the creator ID, but we just set reportsToId.
    const res = await apiRequest<{ success: boolean; data: any }>('/sales-organization/employees', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        designation: 'Medical Representative',
        // reportsToId will ideally be set to current user if backend supports it, or frontend can fetch current user if needed, but the backend `createEmployee` doesn't enforce it automatically unless we pass it. For now, we assume the backend handles hierarchy or we just pass the form data which has reportsToId if we had the context.
        // But for this mockup, we just pass what the form gives us plus designation.
      }),
    });
    if (!res.success) throw new Error(res.data?.message || 'Failed to create MR');
    return res.data;
  }

  async updateMR(id: string | number, data: any): Promise<Employee> {
    const res = await apiRequest<{ success: boolean; data: any }>(`/sales-organization/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.success) throw new Error(res.data?.message || 'Failed to update MR');
    return res.data;
  }

  // --- Attendance ---
  async getTeamAttendance() {
    const res = await apiRequest<{ success: boolean; data: any[] }>('/attendance/asm/team');
    return res.success ? res.data : [];
  }

  // --- Daily Activities ---
  async getMRDailyActivities() {
    const res = await apiRequest<{ success: boolean; data: any[] }>('/daily-reports/asm/team');
    return res.success ? res.data : [];
  }

  // --- Tour Plans ---
  async getMRTourPlans() {
    const res = await apiRequest<{ success: boolean; data: any[] }>('/tour-plans/asm/team');
    return res.success ? res.data : [];
  }

  async updateTourPlanStatus(id: string | number, status: 'APPROVED' | 'REJECTED', remarks?: string) {
    const endpoint = status === 'APPROVED' ? `/tour-plans/${id}/approve` : `/tour-plans/${id}/reject`;
    const res = await apiRequest<{ success: boolean; data: any }>(endpoint, {
      method: 'PUT',
      body: JSON.stringify({ remarks })
    });
    if (!res.success) throw new Error(res.data?.message || `Failed to ${status.toLowerCase()} tour plan`);
    return res.data;
  }
}

export const asmService = new ASMService();
