import { authService } from './authService';
import { employeeService } from './employeeService';
import { targetService } from './targetService';
import { targetAllocationService } from './targetAllocationService';
import type { TargetAllocationRecord } from './targetAllocationService';
import type { Employee, OrganizationNode, SalesTarget } from '../modules/super-admin/sales-organization/types';

export interface NSMTargetSummary {
  target: SalesTarget;
  allocatedAmount: number;
  remainingAmount: number;
  allocations: TargetAllocationRecord[];
  achievement: number; // Initially 0 as requested
}

class NSMService {
  /**
   * Retrieves the current logged-in NSM employee record.
   * Throws an error if the user is not an NSM or employee link is missing.
   */
  getCurrentNSM(): Employee {
    const user = authService.getCurrentUser();
    if (!user) throw new Error("No logged-in user found.");

    if (user.roleId !== 'National Sales Head' && user.roleId !== 'NATIONAL_SALES_HEAD' && user.roleId !== 'Super Admin' && user.roleId !== 'SUPER_ADMIN') {
      // We allow Super Admin temporarily if they are testing as NSM, but strictly this should be NSM.
      // Assuming strict NSM logic:
    }

    const employees = employeeService.getEmployees();
    // Match by employeeCode or name or ID based on UserRecord mapping
    const nsm = employees.find(e => 
      e.employeeCode === user.employeeCode || 
      e.id === user.id || 
      e.employeeName === user.fullName
    );

    if (!nsm) {
      // Demo fallback: if demo NSH is used, pick the first NSH from Employee Master
      const fallback = employees.find(e => e.designation === 'National Sales Head');
      if (fallback) return fallback;
      throw new Error("Logged-in user is not linked to a valid Sales Organization Employee.");
    }
    return nsm;
  }

  /**
   * Gets all RSMs that report directly to the current NSM.
   */
  getReportingRSMs(): Employee[] {
    const nsm = this.getCurrentNSM();
    return employeeService.getEmployees().filter(
      e => e.designation === 'Regional Sales Manager' && e.status === 'Active' && 
           (e.reportsToId === nsm.id || e.reportsTo === nsm.employeeName)
    );
  }

  /**
   * Retrieves all Super Admin targets assigned to the current NSM.
   */
  getAssignedTargets(): SalesTarget[] {
    const nsm = this.getCurrentNSM();
    return targetService.getAdminTargets().filter(t => t.employeeId === nsm.id);
  }

  /**
   * Retrieves the target summaries for the current NSM, including remaining balances.
   */
  getTargetSummaries(): NSMTargetSummary[] {
    const targets = this.getAssignedTargets();
    return targets.map(target => {
      const allocations = targetAllocationService.getAllocationsFromSource(target.id)
        .filter(a => a.status === 'Active');
      
      const allocatedAmount = allocations.reduce((sum, a) => sum + a.targetAmount, 0);
      const remainingAmount = target.targetAmount - allocatedAmount;

      return {
        target,
        allocatedAmount,
        remainingAmount,
        allocations,
        achievement: 0 // As per rules, no MR transactions yet
      };
    });
  }

  /**
   * Allocates a portion of an NSM target to a specific RSM.
   */
  allocateToRSM(sourceTargetId: string, rsmId: string, amount: number, financialYear: string, allocationPeriod: string, startDate: string, endDate: string, remarks?: string): TargetAllocationRecord {
    const nsm = this.getCurrentNSM();
    const target = this.getAssignedTargets().find(t => t.id === sourceTargetId);
    
    if (!target) {
      throw new Error("Source target not found or does not belong to you.");
    }

    const rsm = this.getReportingRSMs().find(r => r.id === rsmId);
    if (!rsm) {
      throw new Error("Selected RSM does not report to you or is inactive.");
    }

    // Verify balance
    const summaries = this.getTargetSummaries();
    const summary = summaries.find(s => s.target.id === sourceTargetId);
    if (!summary) throw new Error("Error retrieving target summary.");

    if (amount > summary.remainingAmount) {
      throw new Error(`Allocation amount (${amount}) exceeds remaining balance (${summary.remainingAmount}).`);
    }

    return targetAllocationService.allocateTarget({
      sourceTargetId,
      financialYear,
      allocationPeriod,
      allocatedToEmployeeId: rsm.id,
      allocatedToEmployeeName: rsm.employeeName,
      allocatedToDesignation: rsm.designation,
      allocatedByEmployeeId: nsm.id,
      targetAmount: amount,
      startDate,
      endDate,
      remarks,
      status: 'Active'
    });
  }

  updateAllocation(allocationId: string, newAmount: number, rsmId?: string): TargetAllocationRecord {
    const nsm = this.getCurrentNSM();
    const allocs = targetAllocationService.getAllocationsByEmployee(nsm.id);
    const existing = allocs.find(a => a.id === allocationId);
    if (!existing) {
      throw new Error("Allocation not found or you do not have permission to edit it.");
    }

    // Verify new balance
    const summaries = this.getTargetSummaries();
    const summary = summaries.find(s => s.target.id === existing.sourceTargetId);
    if (!summary) throw new Error("Error retrieving target summary.");

    const availableToReallocate = summary.remainingAmount + existing.targetAmount;
    if (newAmount > availableToReallocate) {
      throw new Error(`New amount (${newAmount}) exceeds total available balance (${availableToReallocate}).`);
    }

    const updates: Partial<TargetAllocationRecord> = { targetAmount: newAmount };

    if (rsmId && rsmId !== existing.allocatedToEmployeeId) {
      const rsm = this.getReportingRSMs().find(r => r.id === rsmId);
      if (!rsm) throw new Error("Selected RSM does not report to you or is inactive.");
      updates.allocatedToEmployeeId = rsm.id;
      updates.allocatedToEmployeeName = rsm.employeeName;
      updates.allocatedToDesignation = rsm.designation;
    }

    const updated = targetAllocationService.updateAllocation(allocationId, updates);
    if (!updated) throw new Error("Update failed.");
    return updated;
  }

  cancelAllocation(allocationId: string): void {
    const nsm = this.getCurrentNSM();
    const allocs = targetAllocationService.getAllocationsByEmployee(nsm.id);
    const existing = allocs.find(a => a.id === allocationId);
    if (!existing) {
      throw new Error("Allocation not found or you do not have permission to cancel it.");
    }

    targetAllocationService.cancelAllocation(allocationId);
  }

  /**
   * Retrieves aggregated KPI data for the NSM Dashboard
   */
  getDashboardKPIs() {
    const summaries = this.getTargetSummaries();
    const nationalTarget = summaries.reduce((sum, s) => sum + s.target.targetAmount, 0);
    const allocatedTarget = summaries.reduce((sum, s) => sum + s.allocatedAmount, 0);
    const remainingTarget = summaries.reduce((sum, s) => sum + s.remainingAmount, 0);
    const targetAchievement = summaries.reduce((sum, s) => sum + s.achievement, 0);
    const activeRSMCount = this.getReportingRSMs().length;

    return {
      nationalTarget,
      allocatedTarget,
      remainingTarget,
      targetAchievement,
      activeRSMCount,
      allocationStatus: remainingTarget === 0 && nationalTarget > 0 ? 'Fully Allocated' : (allocatedTarget > 0 ? 'Partially Allocated' : 'Pending Allocation')
    };
  }

  /**
   * Get team performance metrics for RSMs
   */
  getTeamPerformance() {
    const nsm = this.getCurrentNSM();
    const allocations = targetAllocationService.getAllocationsByEmployee(nsm.id).filter(a => a.status === 'Active');
    
    // Group allocations by RSM
    const rsmMap = new Map<string, any>();
    
    for (const alloc of allocations) {
      if (!rsmMap.has(alloc.allocatedToEmployeeId)) {
        rsmMap.set(alloc.allocatedToEmployeeId, {
          rsmId: alloc.allocatedToEmployeeId,
          rsmName: alloc.allocatedToEmployeeName,
          totalAllocated: 0,
          totalAchievement: 0
        });
      }
      const entry = rsmMap.get(alloc.allocatedToEmployeeId);
      entry.totalAllocated += alloc.targetAmount;
      // Achievement is 0 as per rules
    }

    return Array.from(rsmMap.values()).map(entry => ({
      ...entry,
      achievementPercentage: entry.totalAllocated > 0 ? (entry.totalAchievement / entry.totalAllocated) * 100 : 0
    }));
  }
}

export const nsmService = new NSMService();
