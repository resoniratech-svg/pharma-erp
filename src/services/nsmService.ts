import { apiRequest } from './apiClient';
import { employeeService } from './employeeService';
import { targetAllocationService } from './targetAllocationService';
import type { TargetAllocationRecord, NationalTargetRecord } from './targetAllocationService';
import type { Employee } from '../modules/super-admin/sales-organization/types';

export interface NSMTargetSummary {
  target: NationalTargetRecord;
  allocatedAmount: number;
  remainingAmount: number;
  allocations: TargetAllocationRecord[];
  achievement: number;
}

class NSMService {
  /**
   * Retrieves live dashboard KPIs from backend PostgreSQL
   */
  async getDashboardKPIs(financialYear = '2026-27') {
    const res = await apiRequest<{ success: boolean; data: any }>(`/dashboard/nsm?financialYear=${encodeURIComponent(financialYear)}`);
    if (!res.success || !res.data) {
      return {
        nationalTarget: 0,
        achievedTarget: 0,
        remainingTarget: 0,
        activeRSMCount: 0,
        stateCoverage: 0,
        pendingApprovals: 0,
        monthlyData: [],
        productData: [],
      };
    }
    return res.data;
  }

  /**
   * Gets all RSMs that report directly to NSM from DB
   */
  async getReportingRSMs(): Promise<Employee[]> {
    return employeeService.getEmployees({
      designation: 'Regional Sales Manager',
      status: 'Active',
    });
  }

  /**
   * Retrieves all National Targets
   */
  async getNationalTargets(financialYear?: string): Promise<NationalTargetRecord[]> {
    return targetAllocationService.getNationalTargets(financialYear);
  }

  /**
   * Retrieves target summary for NSM (National Target, Allocated to RSMs, Remaining Pool)
   */
  async getTargetSummaries(financialYear = '2026-27') {
    return targetAllocationService.getNationalTargetSummary(financialYear);
  }

  /**
   * Allocates a portion of an NSM target to a specific RSM in PostgreSQL
   */
  async allocateToRSM(data: {
    nationalTargetId: number | string;
    rsmId: number | string;
    amount: number;
    financialYear: string;
    allocationPeriod?: string;
    startDate?: string;
    endDate?: string;
    remarks?: string;
  }): Promise<TargetAllocationRecord> {
    return targetAllocationService.allocateTarget({
      nationalTargetId: Number(data.nationalTargetId),
      allocatedToEmployeeId: Number(data.rsmId),
      targetAmount: Number(data.amount),
      financialYear: data.financialYear,
      allocationPeriod: data.allocationPeriod || 'Annual',
      startDate: data.startDate,
      endDate: data.endDate,
      remarks: data.remarks,
    });
  }

  /**
   * Updates an existing allocation in PostgreSQL
   */
  async updateAllocation(allocationId: string | number, newAmount: number, rsmId?: string | number): Promise<TargetAllocationRecord> {
    const payload: any = { targetAmount: Number(newAmount) };
    if (rsmId) payload.allocatedToEmployeeId = Number(rsmId);
    return targetAllocationService.updateAllocation(allocationId, payload);
  }

  /**
   * Cancels an existing allocation
   */
  async cancelAllocation(allocationId: string | number): Promise<boolean> {
    return targetAllocationService.cancelAllocation(allocationId);
  }

  /**
   * Get team performance metrics for RSMs
   */
  async getTeamPerformance(financialYear = '2026-27') {
    const rsms = await this.getReportingRSMs();
    const allocations = await targetAllocationService.getAllocations({ financialYear, status: 'Active' });

    return rsms.map(rsm => {
      const rsmAllocs = allocations.filter(a => String(a.allocatedToEmployeeId) === String(rsm.id));
      const totalAllocated = rsmAllocs.reduce((sum, a) => sum + a.targetAmount, 0);
      const totalAchievement = 0; // Downstream transaction data from MRs
      return {
        rsmId: rsm.id,
        rsmName: rsm.employeeName,
        states: (rsm as any).states || [rsm.area || rsm.region || 'Assigned Territory'],
        totalAllocated,
        totalAchievement,
        achievementPercentage: totalAllocated > 0 ? (totalAchievement / totalAllocated) * 100 : 0,
      };
    });
  }
}

export const nsmService = new NSMService();
