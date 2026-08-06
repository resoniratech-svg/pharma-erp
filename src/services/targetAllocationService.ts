import { apiRequest } from './apiClient';

export interface TargetAllocationRecord {
  id: string | number;
  sourceTargetId?: string | number; // ID of the parent target/allocation being drawn from
  nationalTargetId?: number;
  sourceAllocationId?: number | null;
  targetAllocationCode?: string;
  financialYear: string;
  allocationPeriod?: string;
  allocatedToEmployeeId: number | string;
  allocatedToEmployeeName?: string;
  allocatedToDesignation?: string;
  allocatedByEmployeeId?: number | string;
  targetAmount: number;
  allocatedAmount?: number;
  remainingAmount?: number;
  startDate?: string;
  endDate?: string;
  allocationDate?: string;
  remarks?: string;
  status: 'Active' | 'Inactive' | 'Cancelled' | 'Draft' | 'Validated' | 'Allocated' | 'Pending';
  employee?: {
    id: number;
    employeeCode: string;
    name: string;
    designation: string;
    states?: string[];
    headquarters?: string;
  };
  allocatedBy?: {
    id: number;
    employeeCode: string;
    name: string;
    designation: string;
  };
  nationalTarget?: {
    id: number;
    targetCode: string;
    financialYear: string;
    targetAmount: number;
    allocatedAmount: number;
    remainingAmount: number;
  };
}

export interface NationalTargetRecord {
  id: string | number;
  targetCode?: string;
  financialYear: string;
  planningPeriod?: 'Annual' | 'Quarterly' | 'Monthly';
  targetType?: 'Sales Value' | 'Sales Volume' | 'Both';
  targetAmount: number;
  allocatedAmount?: number;
  remainingAmount?: number;
  startDate?: string;
  endDate?: string;
  remarks?: string;
  createdByEmployeeId?: number | string;
  status: 'Draft' | 'Active' | 'Inactive';
}

class TargetAllocationService {
  // --- National Targets ---
  async getNationalTargets(financialYear?: string): Promise<NationalTargetRecord[]> {
    const url = financialYear 
      ? `/target-allocations/national-targets?financialYear=${encodeURIComponent(financialYear)}`
      : `/target-allocations/national-targets`;
    const res = await apiRequest<{ success: boolean; data: any[] }>(url);
    if (!res.success || !res.data) return [];
    return res.data.map(item => ({
      id: item.id,
      targetCode: item.targetCode,
      financialYear: item.financialYear,
      planningPeriod: item.planningPeriod,
      targetType: item.targetType,
      targetAmount: Number(item.targetAmount),
      allocatedAmount: Number(item.allocatedAmount || 0),
      remainingAmount: Number(item.remainingAmount ?? item.targetAmount),
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : '',
      remarks: item.remarks || '',
      status: item.status,
    }));
  }

  async createNationalTarget(record: Partial<NationalTargetRecord>): Promise<NationalTargetRecord> {
    const res = await apiRequest<{ success: boolean; data: any }>('/target-allocations/national-targets', {
      method: 'POST',
      bodyData: {
        financialYear: record.financialYear,
        planningPeriod: record.planningPeriod || 'Annual',
        targetType: record.targetType || 'Sales Value',
        targetAmount: Number(record.targetAmount),
        startDate: record.startDate,
        endDate: record.endDate,
        remarks: record.remarks,
        status: record.status || 'Active',
      }
    });

    if (!res.success || !res.data) {
      throw new Error((res as any).message || 'Failed to create national target');
    }
    return res.data;
  }

  async updateNationalTarget(id: string | number, updated: Partial<NationalTargetRecord>): Promise<NationalTargetRecord> {
    const res = await apiRequest<{ success: boolean; data: any }>(`/target-allocations/national-targets/${id}`, {
      method: 'PUT',
      bodyData: updated,
    });
    if (!res.success || !res.data) {
      throw new Error((res as any).message || 'Failed to update national target');
    }
    return res.data;
  }

  // --- Target Allocations ---
  async getAllocations(params?: { financialYear?: string; allocatedToEmployeeId?: number | string; status?: string }): Promise<TargetAllocationRecord[]> {
    const query = new URLSearchParams();
    if (params?.financialYear) query.append('financialYear', params.financialYear);
    if (params?.allocatedToEmployeeId) query.append('allocatedToEmployeeId', String(params.allocatedToEmployeeId));
    if (params?.status) query.append('status', params.status);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await apiRequest<{ success: boolean; data: any[] }>(`/target-allocations${queryString}`);
    if (!res.success || !res.data) return [];
    
    return res.data.map(item => ({
      id: item.id,
      targetAllocationCode: item.targetAllocationCode,
      sourceTargetId: item.nationalTargetId || item.sourceAllocationId,
      nationalTargetId: item.nationalTargetId,
      sourceAllocationId: item.sourceAllocationId,
      financialYear: item.financialYear,
      allocationPeriod: item.allocationPeriod,
      allocatedToEmployeeId: item.allocatedToEmployeeId,
      allocatedToEmployeeName: item.employee?.name || `Employee #${item.allocatedToEmployeeId}`,
      allocatedToDesignation: item.employee?.designation || '',
      allocatedByEmployeeId: item.allocatedByEmployeeId,
      targetAmount: Number(item.targetAmount),
      allocatedAmount: Number(item.allocatedAmount || 0),
      remainingAmount: Number(item.remainingAmount ?? item.targetAmount),
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : '',
      allocationDate: item.createdAt,
      remarks: item.remarks || '',
      status: item.status,
      employee: item.employee,
      allocatedBy: item.allocatedBy,
      nationalTarget: item.nationalTarget,
    }));
  }

  async getAllocationsFromSource(sourceTargetId: string | number): Promise<TargetAllocationRecord[]> {
    const all = await this.getAllocations();
    return all.filter(a => String(a.sourceTargetId) === String(sourceTargetId));
  }

  async getAllocationsToEmployee(employeeId: string | number): Promise<TargetAllocationRecord[]> {
    return this.getAllocations({ allocatedToEmployeeId: employeeId, status: 'Active' });
  }

  async getAllocationsByEmployee(employeeId: string | number): Promise<TargetAllocationRecord[]> {
    const all = await this.getAllocations();
    return all.filter(a => String(a.allocatedByEmployeeId) === String(employeeId));
  }

  async allocateTarget(record: {
    nationalTargetId?: number | string;
    sourceAllocationId?: number | string;
    sourceTargetId?: number | string;
    allocatedToEmployeeId: number | string;
    targetAmount: number;
    financialYear: string;
    allocationPeriod?: string;
    startDate?: string;
    endDate?: string;
    remarks?: string;
    status?: string;
  }): Promise<TargetAllocationRecord> {
    const body: any = {
      allocatedToEmployeeId: Number(record.allocatedToEmployeeId),
      targetAmount: Number(record.targetAmount),
      financialYear: record.financialYear,
      allocationPeriod: record.allocationPeriod || 'Annual',
      startDate: record.startDate,
      endDate: record.endDate,
      remarks: record.remarks,
    };

    if (record.nationalTargetId) {
      body.nationalTargetId = Number(record.nationalTargetId);
    } else if (record.sourceAllocationId) {
      body.sourceAllocationId = Number(record.sourceAllocationId);
    } else if (record.sourceTargetId) {
      // Intelligently map sourceTargetId
      if (typeof record.sourceTargetId === 'number' || !isNaN(Number(record.sourceTargetId))) {
        body.nationalTargetId = Number(record.sourceTargetId);
      }
    }

    const res = await apiRequest<{ success: boolean; data: any }>('/target-allocations/allocate', {
      method: 'POST',
      bodyData: body,
    });

    if (!res.success || !res.data) {
      throw new Error((res as any).message || 'Failed to allocate target');
    }
    return res.data;
  }

  async updateAllocation(id: string | number, updated: Partial<TargetAllocationRecord>): Promise<TargetAllocationRecord> {
    const res = await apiRequest<{ success: boolean; data: any }>(`/target-allocations/${id}`, {
      method: 'PUT',
      bodyData: updated,
    });
    if (!res.success || !res.data) {
      throw new Error((res as any).message || 'Failed to update allocation');
    }
    return res.data;
  }

  async cancelAllocation(id: string | number): Promise<boolean> {
    const res = await apiRequest<{ success: boolean }>(`/target-allocations/${id}`, {
      method: 'DELETE',
    });
    return res.success;
  }

  // --- Summaries ---
  async getNationalTargetSummary(financialYear = '2026-27') {
    const res = await apiRequest<{ success: boolean; data: any }>(`/target-allocations/summary?financialYear=${encodeURIComponent(financialYear)}`);
    return res.data;
  }

  async getRSMTargetSummary(financialYear = '2026-27') {
    const res = await apiRequest<{ success: boolean; data: any }>(`/target-allocations/rsm-summary?financialYear=${encodeURIComponent(financialYear)}`);
    return res.data;
  }

  async getASMTargetSummary(financialYear = '2026-27') {
    const res = await apiRequest<{ success: boolean; data: any }>(`/target-allocations/asm-summary?financialYear=${encodeURIComponent(financialYear)}`);
    return res.data;
  }
}

export const targetAllocationService = new TargetAllocationService();
