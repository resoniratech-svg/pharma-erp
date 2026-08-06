import { apiRequest } from './apiClient';
import { employeeService } from './employeeService';
import { targetAllocationService } from './targetAllocationService';
import type { TargetAllocationRecord } from './targetAllocationService';
import type { Employee } from '../modules/super-admin/sales-organization/types';

export interface RSMTargetSummary {
  parentAllocation: TargetAllocationRecord;
  allocatedAmount: number;
  remainingAmount: number;
  allocations: TargetAllocationRecord[];
  achievement: number;
}

class RSMService {
  /**
   * Retrieves aggregated KPI data for the RSM Dashboard from PostgreSQL
   */
  async getDashboardKPIs(financialYear = '2026-27') {
    const res = await apiRequest<{ success: boolean; data: any }>(`/dashboard/rsm?financialYear=${encodeURIComponent(financialYear)}`);
    if (!res.success || !res.data) {
      return {
        assignedTarget: 0,
        allocatedTarget: 0,
        remainingTarget: 0,
        targetAchievement: 0,
        achievementPercentage: 0,
        activeAsmCount: 0,
        allocationStatus: 'Pending',
        pendingActivities: 0,
      };
    }
    return res.data;
  }

  /**
   * Gets all ASMs that report directly to the current RSM from DB
   */
  async getReportingASMs(): Promise<Employee[]> {
    return employeeService.getEmployees({
      designation: 'Area Sales Manager',
      status: 'Active',
    });
  }

  /**
   * Retrieves the target summaries for the current RSM from backend
   */
  async getTargetSummaries(financialYear = '2026-27') {
    return targetAllocationService.getRSMTargetSummary(financialYear);
  }

  /**
   * Allocates a portion of the RSM's received target to a specific ASM in DB
   */
  async allocateToASM(data: {
    sourceAllocationId: number | string;
    asmId: number | string;
    amount: number;
    financialYear: string;
    allocationPeriod?: string;
    startDate?: string;
    endDate?: string;
    remarks?: string;
  }): Promise<TargetAllocationRecord> {
    return targetAllocationService.allocateTarget({
      sourceAllocationId: Number(data.sourceAllocationId),
      allocatedToEmployeeId: Number(data.asmId),
      targetAmount: Number(data.amount),
      financialYear: data.financialYear,
      allocationPeriod: data.allocationPeriod || 'Annual',
      startDate: data.startDate,
      endDate: data.endDate,
      remarks: data.remarks,
    });
  }

  /**
   * Updates an existing allocation made to an ASM
   */
  async updateAllocation(allocationId: string | number, newAmount: number, asmId?: string | number): Promise<TargetAllocationRecord> {
    const payload: any = { targetAmount: Number(newAmount) };
    if (asmId) payload.allocatedToEmployeeId = Number(asmId);
    return targetAllocationService.updateAllocation(allocationId, payload);
  }

  /**
   * Cancels an existing allocation made to an ASM
   */
  async cancelAllocation(allocationId: string | number): Promise<boolean> {
    return targetAllocationService.cancelAllocation(allocationId);
  }

  /**
   * Calculates team performance for all ASMs under the RSM
   */
  async getTeamPerformance(financialYear = '2026-27') {
    const asms = await this.getReportingASMs();
    const allocations = await targetAllocationService.getAllocations({ financialYear, status: 'Active' });

    return asms.map(asm => {
      const asmAllocs = allocations.filter(a => String(a.allocatedToEmployeeId) === String(asm.id));
      const allocatedTarget = asmAllocs.reduce((sum, a) => sum + a.targetAmount, 0);
      const achievement = 0; // Downstream transaction data from MRs
      const remainingTarget = allocatedTarget - achievement;
      const achievementPercentage = allocatedTarget > 0 ? (achievement / allocatedTarget) * 100 : 0;

      return {
        asmId: asm.id,
        asmName: asm.employeeName,
        territory: asm.area || asm.region || asm.zone || 'Unassigned',
        headquarters: asm.headquarters || 'Unassigned',
        allocatedTarget,
        achievement,
        remainingTarget,
        achievementPercentage,
      };
    });
  }
}

export const rsmService = new RSMService();
