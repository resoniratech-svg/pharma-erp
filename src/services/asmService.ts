import { authService } from './authService';
import { employeeService } from './employeeService';
import { targetAllocationService } from './targetAllocationService';
import type { Employee } from '../modules/super-admin/sales-organization/types';
import type { TargetAllocationRecord } from './targetAllocationService';

export interface ASMTargetSummary {
  parentAllocation: TargetAllocationRecord;
  allocatedAmount: number;
  remainingAmount: number;
  allocations: TargetAllocationRecord[];
  achievement: number; // Initially 0 as requested
}

class ASMService {
  /**
   * Retrieves the current logged-in ASM employee record.
   * Throws an error if the user is not an ASM or employee link is missing.
   */
  getCurrentASM(): Employee {
    const user = authService.getCurrentUser();
    if (!user) throw new Error("No logged-in user found.");

    const employees = employeeService.getEmployees();
    const asm = employees.find(e => 
      e.employeeCode === user.employeeCode || 
      e.id === user.id || 
      e.employeeName === user.fullName
    );

    if (!asm) {
      const fallback = employees.find(e => e.designation === 'Area Sales Manager');
      if (fallback) return fallback;
      throw new Error("Logged-in user is not linked to a valid Sales Organization Employee.");
    }
    return asm;
  }

  /**
   * Gets all Medical Representatives that report directly to the current ASM.
   */
  getReportingMRs(): Employee[] {
    const asm = this.getCurrentASM();
    return employeeService.getEmployees().filter(
      e => e.designation === 'Medical Representative' && e.status === 'Active' && 
           (e.reportsToId === asm.id || e.reportsTo === asm.employeeName)
    );
  }

  /**
   * Retrieves all active allocations assigned to the current ASM by the RSM.
   * For the ASM, these are their "assigned targets".
   */
  getAssignedTargets(): TargetAllocationRecord[] {
    const asm = this.getCurrentASM();
    return targetAllocationService.getAllocationsToEmployee(asm.id)
      .filter(a => a.status === 'Active');
  }

  /**
   * Retrieves the target summaries for the current ASM, calculating how much 
   * they have allocated down to their MRs and how much remains.
   */
  getTargetSummaries(): ASMTargetSummary[] {
    const assignedAllocations = this.getAssignedTargets();
    
    return assignedAllocations.map(parentAlloc => {
      // Find the allocations made BY this ASM OUT OF this specific parent allocation
      const allAllocationsByAsm = targetAllocationService.getAllocationsByEmployee(this.getCurrentASM().id);
      const allocationsToMrs = allAllocationsByAsm.filter(
        a => a.sourceTargetId === parentAlloc.id && a.status === 'Active'
      );
      
      const allocatedAmount = allocationsToMrs.reduce((sum, a) => sum + a.targetAmount, 0);
      const remainingAmount = parentAlloc.targetAmount - allocatedAmount;

      return {
        parentAllocation: parentAlloc,
        allocatedAmount,
        remainingAmount,
        allocations: allocationsToMrs,
        achievement: 0 // As per rules, no downstream transactions yet
      };
    });
  }

  /**
   * Allocates a portion of the ASM's received target to a specific MR.
   */
  allocateToMR(parentAllocationId: string, mrId: string, amount: number, financialYear: string, allocationPeriod: string, startDate: string, endDate: string, remarks?: string): TargetAllocationRecord {
    const asm = this.getCurrentASM();
    
    // Validate that the source is an active allocation owned by this ASM
    const parentAlloc = this.getAssignedTargets().find(t => t.id === parentAllocationId);
    if (!parentAlloc) {
      throw new Error("Source allocation not found or does not belong to you.");
    }

    if (parentAlloc.financialYear !== financialYear) {
      if (parentAlloc.financialYear) {
         throw new Error("Financial year must match the assigned target's financial year.");
      }
    }

    // Validate MR is active and reports to this ASM
    const mr = this.getReportingMRs().find(r => r.id === mrId);
    if (!mr) {
      throw new Error("Selected Medical Representative does not report to you, has been transferred, or is inactive.");
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
      sourceTargetId: parentAllocationId, // The ID of the allocation the ASM received
      financialYear,
      allocationPeriod,
      allocatedToEmployeeId: mr.id,
      allocatedToEmployeeName: mr.employeeName,
      allocatedToDesignation: mr.designation,
      allocatedByEmployeeId: asm.id,
      targetAmount: amount,
      startDate,
      endDate,
      remarks,
      status: 'Active'
    });
  }

  /**
   * Updates an existing allocation made to an MR.
   */
  updateAllocation(allocationId: string, newAmount: number, mrId?: string): TargetAllocationRecord {
    const asm = this.getCurrentASM();
    const allocs = targetAllocationService.getAllocationsByEmployee(asm.id);
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

    if (mrId && mrId !== existing.allocatedToEmployeeId) {
      const mr = this.getReportingMRs().find(r => r.id === mrId);
      if (!mr) throw new Error("Selected Medical Representative does not report to you or is inactive.");
      updates.allocatedToEmployeeId = mr.id;
      updates.allocatedToEmployeeName = mr.employeeName;
      updates.allocatedToDesignation = mr.designation;
    }

    const updated = targetAllocationService.updateAllocation(allocationId, updates);
    if (!updated) throw new Error("Update failed.");
    return updated;
  }

  /**
   * Cancels an existing allocation made to an MR.
   */
  cancelAllocation(allocationId: string): void {
    const asm = this.getCurrentASM();
    const allocs = targetAllocationService.getAllocationsByEmployee(asm.id);
    const existing = allocs.find(a => a.id === allocationId);
    
    if (!existing) {
      throw new Error("Allocation not found or you do not have permission to cancel it.");
    }

    targetAllocationService.cancelAllocation(allocationId);
  }

  /**
   * Retrieves aggregated KPI data for the ASM Dashboard.
   */
  getDashboardKPIs() {
    const summaries = this.getTargetSummaries();
    
    const assignedTarget = summaries.reduce((sum, s) => sum + s.parentAllocation.targetAmount, 0);
    const allocatedTarget = summaries.reduce((sum, s) => sum + s.allocatedAmount, 0);
    const remainingTarget = summaries.reduce((sum, s) => sum + s.remainingAmount, 0);
    const targetAchievement = summaries.reduce((sum, s) => sum + s.achievement, 0);
    
    const achievementPercentage = assignedTarget > 0 ? (targetAchievement / assignedTarget) * 100 : 0;
    
    const activeMRCount = this.getReportingMRs().length;

    let allocationStatus = 'Pending';
    if (remainingTarget === 0 && assignedTarget > 0) allocationStatus = 'Fully Allocated';
    else if (allocatedTarget > 0) allocationStatus = 'Partially Allocated';

    return {
      assignedTarget,
      allocatedTarget,
      remainingTarget,
      targetAchievement,
      achievementPercentage,
      activeMRCount,
      allocationStatus,
      pendingTourPlans: this.getPendingTourPlans().length,
      pendingDCRs: this.getPendingDCRs().length,
      pendingAttendanceExceptions: this.getPendingAttendanceExceptions().length
    };
  }

  /**
   * Calculates team performance for all MRs under the ASM.
   */
  getTeamPerformance() {
    const mrs = this.getReportingMRs();
    const asmId = this.getCurrentASM().id;
    
    // Get all allocations made by this ASM
    const allAllocations = targetAllocationService.getAllocationsByEmployee(asmId)
      .filter(a => a.status === 'Active');
    
    return mrs.map(mr => {
      // Find all allocations assigned to this specific MR
      const mrAllocations = allAllocations.filter(a => a.allocatedToEmployeeId === mr.id);
      
      const allocatedTarget = mrAllocations.reduce((sum, a) => sum + a.targetAmount, 0);
      const achievement = 0; // Downstream transaction data not yet available
      const remainingTarget = allocatedTarget - achievement;
      const achievementPercentage = allocatedTarget > 0 ? (achievement / allocatedTarget) * 100 : 0;

      return {
        mrId: mr.id,
        mrName: mr.employeeName,
        territory: mr.territory || 'Unassigned',
        headquarters: mr.headquarters || 'Unassigned',
        allocatedTarget,
        achievement,
        remainingTarget,
        achievementPercentage,
        orders: 0,
        doctorVisits: 0,
        chemistVisits: 0,
        dcrCount: 0
      };
    });
  }

  // --- Monitoring & Approvals Stubs ---
  getPendingTourPlans() {
    return []; // Stub for future MR workflow integration
  }

  getPendingDCRs() {
    return []; // Stub for future MR workflow integration
  }

  getPendingAttendanceExceptions() {
    return []; // Stub for future MR workflow integration
  }
}

export const asmService = new ASMService();
