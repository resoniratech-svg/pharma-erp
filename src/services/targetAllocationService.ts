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
  status: 'Active' | 'Inactive' | 'Cancelled';
}

const STORAGE_KEY = 'sales_allocations';

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
}

export const targetAllocationService = new TargetAllocationService();
