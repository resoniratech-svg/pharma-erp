export interface TargetAllocationRecord {
  id: string;
  sourceTargetId: string; // ID of the parent target/allocation being drawn from
  financialYear: string;
  allocationPeriod: string;
  allocatedToEmployeeId: string;
  allocatedToEmployeeName: string;
  allocatedToDesignation: string;
  allocatedByEmployeeId: string;
  targetAmount: number;
  startDate: string;
  endDate: string;
  allocationDate: string;
  remarks?: string;
  status: 'Active' | 'Inactive' | 'Cancelled' | 'Draft' | 'Validated' | 'Allocated' | 'Pending';
}

export interface NationalTargetRecord {
  id: string;
  financialYear: string;
  planningPeriod?: 'Annual' | 'Quarterly' | 'Monthly';
  targetType?: 'Sales Value' | 'Sales Volume' | 'Both';
  targetAmount: number;
  startDate: string;
  endDate: string;
  remarks?: string;
  createdByEmployeeId: string;
  status: 'Draft' | 'Active' | 'Inactive';
}

const STORAGE_KEY = 'sales_allocations';
const NATIONAL_TARGETS_KEY = 'national_targets';

class TargetAllocationService {
  getAllocations(): TargetAllocationRecord[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  // Get all allocations made out of a specific parent target
  getAllocationsFromSource(sourceTargetId: string): TargetAllocationRecord[] {
    return this.getAllocations().filter(a => a.sourceTargetId === sourceTargetId);
  }

  // Get all allocations assigned to a specific employee
  getAllocationsToEmployee(employeeId: string): TargetAllocationRecord[] {
    return this.getAllocations().filter(a => a.allocatedToEmployeeId === employeeId);
  }

  // Get allocations assigned by a specific manager
  getAllocationsByEmployee(employeeId: string): TargetAllocationRecord[] {
    return this.getAllocations().filter(a => a.allocatedByEmployeeId === employeeId);
  }

  allocateTarget(record: Omit<TargetAllocationRecord, 'id' | 'allocationDate'>): TargetAllocationRecord {
    const allocations = this.getAllocations();

    // Prevent duplicate active allocations for the same source, FY, and employee
    const duplicate = allocations.find(
      a => 
        a.sourceTargetId === record.sourceTargetId && 
        a.allocatedToEmployeeId === record.allocatedToEmployeeId && 
        a.financialYear === record.financialYear && 
        a.status === 'Active'
    );

    if (duplicate) {
      throw new Error(`An active allocation already exists for this employee for the given target and financial year.`);
    }

    if (record.targetAmount <= 0) {
      throw new Error("Allocation amount must be greater than zero.");
    }

    const newAlloc: TargetAllocationRecord = {
      ...record,
      id: `ALL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      allocationDate: new Date().toISOString(),
    };

    allocations.unshift(newAlloc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allocations));
    return newAlloc;
  }

  updateAllocation(id: string, updated: Partial<TargetAllocationRecord>): TargetAllocationRecord | null {
    const allocations = this.getAllocations();
    const index = allocations.findIndex(a => a.id === id);
    if (index === -1) return null;

    if (updated.targetAmount !== undefined && updated.targetAmount <= 0) {
      throw new Error("Allocation amount must be greater than zero.");
    }

    allocations[index] = { ...allocations[index], ...updated };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allocations));
    return allocations[index];
  }

  cancelAllocation(id: string): boolean {
    const updated = this.updateAllocation(id, { status: 'Cancelled' });
    return !!updated;
  }

  // --- National Targets ---
  getNationalTargets(): NationalTargetRecord[] {
    const data = localStorage.getItem(NATIONAL_TARGETS_KEY);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  createNationalTarget(record: Omit<NationalTargetRecord, 'id'>): NationalTargetRecord {
    const targets = this.getNationalTargets();
    
    // Ensure only one active national target per financial year
    const active = targets.find(t => t.financialYear === record.financialYear && (t.status === 'Active' || t.status === 'Draft'));
    if (active) {
      throw new Error(`An active or draft National Target already exists for ${record.financialYear}.`);
    }

    if (record.targetAmount <= 0) {
      throw new Error("Target amount must be greater than zero.");
    }

    const newTarget: NationalTargetRecord = {
      ...record,
      id: `NAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    targets.unshift(newTarget);
    localStorage.setItem(NATIONAL_TARGETS_KEY, JSON.stringify(targets));
    return newTarget;
  }

  updateNationalTarget(id: string, updated: Partial<NationalTargetRecord>): NationalTargetRecord | null {
    const targets = this.getNationalTargets();
    const index = targets.findIndex(t => t.id === id);
    if (index === -1) return null;

    targets[index] = { ...targets[index], ...updated };
    localStorage.setItem(NATIONAL_TARGETS_KEY, JSON.stringify(targets));
    return targets[index];
  }
}

export const targetAllocationService = new TargetAllocationService();
