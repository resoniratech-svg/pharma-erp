import { authService } from './authService';
import { employeeService } from './employeeService';
import { targetAllocationService } from './targetAllocationService';
import { targetService } from './targetService';
import type { Employee } from '../modules/super-admin/sales-organization/types';
import type { TargetAllocationRecord } from './targetAllocationService';

export interface ZSMTargetSummary {
  parentAllocation: TargetAllocationRecord;
  parentTargetCode: string;
  allocatedAmount: number;
  remainingAmount: number;
  allocations: TargetAllocationRecord[];
  achievement: number; // Initially 0 as requested
}

class ZSMService {
  /**
   * Retrieves the current logged-in ZSM employee record.
   * Throws an error if the user is not a ZSM or employee link is missing.
   */
  getCurrentZSM(): Employee {
    const user = authService.getCurrentUser();
    if (!user) throw new Error("No logged-in user found.");

    const employees = employeeService.getEmployees();
    const zsm = employees.find(e => 
      e.employeeCode === user.employeeCode || 
      e.id === user.id || 
      e.employeeName === user.fullName
    );

    if (!zsm) {
      const fallback = employees.find(e => e.designation === 'Zonal Sales Manager');
      if (fallback) return fallback;
      throw new Error("Logged-in user is not linked to a valid Sales Organization Employee.");
    }
    return zsm;
  }

  /**
   * Gets all RSMs that report directly to the current ZSM.
   */
  getReportingRSMs(): Employee[] {
    const zsm = this.getCurrentZSM();
    return employeeService.getEmployees().filter(
      e => e.designation === 'Regional Sales Manager' && e.status === 'Active' && 
           (e.reportsToId === zsm.id || e.reportsTo === zsm.employeeName)
    );
  }

  /**
   * Retrieves all active allocations assigned to the current ZSM by the NSM.
   * For the ZSM, these are their "assigned targets".
   */
  getAssignedTargets(): TargetAllocationRecord[] {
    const zsm = this.getCurrentZSM();
    return targetAllocationService.getAllocationsToEmployee(zsm.id)
      .filter(a => a.status === 'Active');
  }

  /**
   * Retrieves the target summaries for the current ZSM, calculating how much 
   * they have allocated down to their RSMs and how much remains.
   */
  getTargetSummaries(): ZSMTargetSummary[] {
    const assignedAllocations = this.getAssignedTargets();
    
    return assignedAllocations.map(parentAlloc => {
      // Find the allocations made BY this ZSM OUT OF this specific parent allocation
      const allAllocationsByZsm = targetAllocationService.getAllocationsByEmployee(this.getCurrentZSM().id);
      const allocationsToRsms = allAllocationsByZsm.filter(
        a => a.sourceTargetId === parentAlloc.id && a.status === 'Active'
      );
      
      const allocatedAmount = allocationsToRsms.reduce((sum, a) => sum + a.targetAmount, 0);
      const remainingAmount = parentAlloc.targetAmount - allocatedAmount;
      
      // Attempt to resolve the top-level parent target code for UI clarity
      const topLevelTargets = targetService.getAdminTargets();
      const topTarget = topLevelTargets.find(t => t.id === parentAlloc.sourceTargetId);

      return {
        parentAllocation: parentAlloc,
        parentTargetCode: topTarget ? topTarget.targetCode : parentAlloc.sourceTargetId,
        allocatedAmount,
        remainingAmount,
        allocations: allocationsToRsms,
        achievement: 0 // As per rules, no downstream transactions yet
      };
    });
  }

  /**
   * Allocates a portion of the ZSM's received target to a specific RSM.
   */
  allocateToRSM(parentAllocationId: string, rsmId: string, amount: number, financialYear: string, allocationPeriod: string, startDate: string, endDate: string, remarks?: string): TargetAllocationRecord {
    const zsm = this.getCurrentZSM();
    
    // Validate that the source is an active allocation owned by this ZSM
    const parentAlloc = this.getAssignedTargets().find(t => t.id === parentAllocationId);
    if (!parentAlloc) {
      throw new Error("Source allocation not found or does not belong to you.");
    }

    // Validate RSM is active and reports to this ZSM
    const rsm = this.getReportingRSMs().find(r => r.id === rsmId);
    if (!rsm) {
      throw new Error("Selected RSM does not report to you or is inactive.");
    }

    // Validate balance
    const summaries = this.getTargetSummaries();
    const summary = summaries.find(s => s.parentAllocation.id === parentAllocationId);
    if (!summary) throw new Error("Error retrieving target summary.");

    if (amount > summary.remainingAmount) {
      throw new Error(`Allocation amount (${amount}) exceeds remaining balance (${summary.remainingAmount}).`);
    }

    // Reuse the generic targetAllocationService to persist the new record
    return targetAllocationService.allocateTarget({
      sourceTargetId: parentAllocationId, // The ID of the allocation the ZSM received
      financialYear,
      allocationPeriod,
      allocatedToEmployeeId: rsm.id,
      allocatedToEmployeeName: rsm.employeeName,
      allocatedToDesignation: rsm.designation,
      allocatedByEmployeeId: zsm.id,
      targetAmount: amount,
      startDate,
      endDate,
      remarks,
      status: 'Active'
    });
  }

  /**
   * Updates an existing allocation made to an RSM.
   */
  updateAllocation(allocationId: string, newAmount: number, rsmId?: string): TargetAllocationRecord {
    const zsm = this.getCurrentZSM();
    const allocs = targetAllocationService.getAllocationsByEmployee(zsm.id);
    const existing = allocs.find(a => a.id === allocationId);
    
    if (!existing) {
      throw new Error("Allocation not found or you do not have permission to edit it.");
    }

    // Verify new balance
    const summaries = this.getTargetSummaries();
    const summary = summaries.find(s => s.parentAllocation.id === existing.sourceTargetId);
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

  /**
   * Cancels an existing allocation made to an RSM.
   */
  cancelAllocation(allocationId: string): void {
    const zsm = this.getCurrentZSM();
    const allocs = targetAllocationService.getAllocationsByEmployee(zsm.id);
    const existing = allocs.find(a => a.id === allocationId);
    
    if (!existing) {
      throw new Error("Allocation not found or you do not have permission to cancel it.");
    }

    targetAllocationService.cancelAllocation(allocationId);
  }

  /**
   * Retrieves aggregated KPI data for the ZSM Dashboard.
   */
  getDashboardKPIs() {
    const summaries = this.getTargetSummaries();
    
    const assignedTarget = summaries.reduce((sum, s) => sum + s.parentAllocation.targetAmount, 0);
    const allocatedTarget = summaries.reduce((sum, s) => sum + s.allocatedAmount, 0);
    const remainingTarget = summaries.reduce((sum, s) => sum + s.remainingAmount, 0);
    const targetAchievement = summaries.reduce((sum, s) => sum + s.achievement, 0);
    
    const activeRSMCount = this.getReportingRSMs().length;

    let allocationStatus = 'Pending Allocation';
    if (remainingTarget === 0 && assignedTarget > 0) {
      allocationStatus = 'Fully Allocated';
    } else if (allocatedTarget > 0) {
      allocationStatus = 'Partially Allocated';
    }

    const achievementPercentage = assignedTarget > 0 ? (targetAchievement / assignedTarget) * 100 : 0;

    return {
      assignedTarget,
      allocatedTarget,
      remainingTarget,
      targetAchievement,
      achievementPercentage,
      activeRSMCount,
      allocationStatus
    };
  }

  /**
   * Get team performance metrics for direct RSMs.
   */
  getTeamPerformance() {
    const zsm = this.getCurrentZSM();
    const allocations = targetAllocationService.getAllocationsByEmployee(zsm.id).filter(a => a.status === 'Active');
    
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
      // Future: add achievement logic here
    }

    return Array.from(rsmMap.values()).map(entry => ({
      ...entry,
      achievementPercentage: entry.totalAllocated > 0 ? (entry.totalAchievement / entry.totalAllocated) * 100 : 0
    }));
  }
}

export const zsmService = new ZSMService();
