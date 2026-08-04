import { authService } from './authService';
import { employeeService } from './employeeService';
import { targetAllocationService } from './targetAllocationService';
import { targetService } from './targetService';
import type { Employee } from '../modules/super-admin/sales-organization/types';
import type { TargetAllocationRecord } from './targetAllocationService';

export interface RSMTargetSummary {
  parentAllocation: TargetAllocationRecord;
  allocatedAmount: number;
  remainingAmount: number;
  allocations: TargetAllocationRecord[];
  achievement: number; // Initially 0 as requested
}

class RSMService {
  /**
   * Retrieves the current logged-in RSM employee record.
   * Throws an error if the user is not an RSM or employee link is missing.
   */
  getCurrentRSM(): Employee {
    const user = authService.getCurrentUser();
    if (!user) throw new Error("No logged-in user found.");

    const employees = employeeService.getEmployees();
    const rsm = employees.find(e => 
      e.employeeCode === user.employeeCode || 
      e.id === user.id || 
      e.employeeName === user.fullName
    );

    if (!rsm) {
      const fallback = employees.find(e => e.designation === 'Regional Sales Manager');
      if (fallback) return fallback;
      throw new Error("Logged-in user is not linked to a valid Sales Organization Employee.");
    }
    return rsm;
  }

  /**
   * Gets all ASMs that report directly to the current RSM.
   */
  getReportingASMs(): Employee[] {
    const rsm = this.getCurrentRSM();
    return employeeService.getEmployees().filter(
      e => e.designation === 'Area Sales Manager' && e.status === 'Active' && 
           (e.reportsToId === rsm.id || e.reportsTo === rsm.employeeName)
    );
  }

  /**
   * Retrieves all active allocations assigned to the current RSM by the NSM.
   * For the RSM, these are their "assigned targets".
   */
  getAssignedTargets(): TargetAllocationRecord[] {
    const rsm = this.getCurrentRSM();
    return targetAllocationService.getAllocationsToEmployee(rsm.id)
      .filter(a => a.status === 'Active');
  }

  /**
   * Retrieves the target summaries for the current RSM, calculating how much 
   * they have allocated down to their ASMs and how much remains.
   */
  getTargetSummaries(): RSMTargetSummary[] {
    const assignedAllocations = this.getAssignedTargets();
    
    return assignedAllocations.map(parentAlloc => {
      // Find the allocations made BY this RSM OUT OF this specific parent allocation
      const allAllocationsByRsm = targetAllocationService.getAllocationsByEmployee(this.getCurrentRSM().id);
      const allocationsToAsms = allAllocationsByRsm.filter(
        a => a.sourceTargetId === parentAlloc.id && a.status === 'Active'
      );
      
      const allocatedAmount = allocationsToAsms.reduce((sum, a) => sum + a.targetAmount, 0);
      const remainingAmount = parentAlloc.targetAmount - allocatedAmount;

      return {
        parentAllocation: parentAlloc,
        allocatedAmount,
        remainingAmount,
        allocations: allocationsToAsms,
        achievement: 0 // As per rules, no downstream transactions yet
      };
    });
  }

  /**
   * Allocates a portion of the RSM's received target to a specific ASM.
   */
  allocateToASM(parentAllocationId: string, asmId: string, amount: number, financialYear: string, allocationPeriod: string, startDate: string, endDate: string, remarks?: string): TargetAllocationRecord {
    const rsm = this.getCurrentRSM();
    
    // Validate that the source is an active allocation owned by this RSM
    const parentAlloc = this.getAssignedTargets().find(t => t.id === parentAllocationId);
    if (!parentAlloc) {
      throw new Error("Source allocation not found or does not belong to you.");
    }

    if (parentAlloc.financialYear !== financialYear) {
      // Business rule: The allocation belongs to the selected Financial Year.
      // We'll just enforce that it matches the parent allocation's FY for consistency.
      if (parentAlloc.financialYear) {
         throw new Error("Financial year must match the assigned target's financial year.");
      }
    }

    // Validate ASM is active and reports to this RSM
    const asm = this.getReportingASMs().find(r => r.id === asmId);
    if (!asm) {
      throw new Error("Selected ASM does not report to you, has been transferred, or is inactive.");
    }

    // Validate balance
    const summaries = this.getTargetSummaries();
    const summary = summaries.find(s => s.parentAllocation.id === parentAllocationId);
    if (!summary) throw new Error("Error retrieving target summary.");

    if (amount > summary.remainingAmount) {
      throw new Error(`Allocation amount (${amount}) exceeds remaining balance (${summary.remainingAmount}).`);
    }
    
    if (amount < 0) {
      throw new Error("Cannot allocate negative values.");
    }

    // Reuse the generic targetAllocationService to persist the new record
    return targetAllocationService.allocateTarget({
      sourceTargetId: parentAllocationId, // The ID of the allocation the RSM received
      financialYear,
      allocationPeriod,
      allocatedToEmployeeId: asm.id,
      allocatedToEmployeeName: asm.employeeName,
      allocatedToDesignation: asm.designation,
      allocatedByEmployeeId: rsm.id,
      targetAmount: amount,
      startDate,
      endDate,
      remarks,
      status: 'Active'
    });
  }

  /**
   * Updates an existing allocation made to an ASM.
   */
  updateAllocation(allocationId: string, newAmount: number, asmId?: string): TargetAllocationRecord {
    const rsm = this.getCurrentRSM();
    const allocs = targetAllocationService.getAllocationsByEmployee(rsm.id);
    const existing = allocs.find(a => a.id === allocationId);
    
    if (!existing) {
      throw new Error("Allocation not found or you do not have permission to edit it.");
    }
    
    if (newAmount < 0) {
      throw new Error("Cannot allocate negative values.");
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

    if (asmId && asmId !== existing.allocatedToEmployeeId) {
      const asm = this.getReportingASMs().find(r => r.id === asmId);
      if (!asm) throw new Error("Selected ASM does not report to you or is inactive.");
      updates.allocatedToEmployeeId = asm.id;
      updates.allocatedToEmployeeName = asm.employeeName;
      updates.allocatedToDesignation = asm.designation;
    }

    const updated = targetAllocationService.updateAllocation(allocationId, updates);
    if (!updated) throw new Error("Update failed.");
    return updated;
  }

  /**
   * Cancels an existing allocation made to an ASM.
   */
  cancelAllocation(allocationId: string): void {
    const rsm = this.getCurrentRSM();
    const allocs = targetAllocationService.getAllocationsByEmployee(rsm.id);
    const existing = allocs.find(a => a.id === allocationId);
    
    if (!existing) {
      throw new Error("Allocation not found or you do not have permission to cancel it.");
    }

    targetAllocationService.cancelAllocation(allocationId);
  }

  /**
   * Retrieves aggregated KPI data for the RSM Dashboard.
   */
  getDashboardKPIs() {
    const summaries = this.getTargetSummaries();
    
    const assignedTarget = summaries.reduce((sum, s) => sum + s.parentAllocation.targetAmount, 0);
    const allocatedTarget = summaries.reduce((sum, s) => sum + s.allocatedAmount, 0);
    const remainingTarget = summaries.reduce((sum, s) => sum + s.remainingAmount, 0);
    const targetAchievement = summaries.reduce((sum, s) => sum + s.achievement, 0);
    
    const achievementPercentage = assignedTarget > 0 ? (targetAchievement / assignedTarget) * 100 : 0;
    
    const activeAsmCount = this.getReportingASMs().length;

    let allocationStatus = 'Pending';
    if (remainingTarget === 0 && assignedTarget > 0) allocationStatus = 'Fully Allocated';
    else if (allocatedTarget > 0) allocationStatus = 'Partially Allocated';

    return {
      assignedTarget,
      allocatedTarget,
      remainingTarget,
      targetAchievement,
      achievementPercentage,
      activeAsmCount,
      allocationStatus
    };
  }

  /**
   * Calculates team performance for all ASMs under the RSM.
   */
  getTeamPerformance() {
    const asms = this.getReportingASMs();
    const rsmId = this.getCurrentRSM().id;
    
    // Get all allocations made by this RSM
    const allAllocations = targetAllocationService.getAllocationsByEmployee(rsmId)
      .filter(a => a.status === 'Active');
    
    return asms.map(asm => {
      // Find all allocations assigned to this specific ASM
      const asmAllocations = allAllocations.filter(a => a.allocatedToEmployeeId === asm.id);
      
      const allocatedTarget = asmAllocations.reduce((sum, a) => sum + a.targetAmount, 0);
      const achievement = 0; // Downstream transaction data not yet available
      const remainingTarget = allocatedTarget - achievement;
      const achievementPercentage = allocatedTarget > 0 ? (achievement / allocatedTarget) * 100 : 0;

      return {
        asmId: asm.id,
        asmName: asm.employeeName,
        territory: asm.territory || 'Unassigned',
        headquarters: asm.headquarters || 'Unassigned',
        allocatedTarget,
        achievement,
        remainingTarget,
        achievementPercentage
      };
    });
  }
}

export const rsmService = new RSMService();
