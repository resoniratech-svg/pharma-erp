import { apiRequest } from './apiClient';
import type { SalesTarget } from '../modules/super-admin/sales-organization/types';

export interface TargetRecord {
  id: number;
  mrId: number;
  month: number;
  year: number;
  doctorVisitTarget: number;
  chemistVisitTarget: number;
  orderTarget: number;
  achievedDoctorVisits: number;
  achievedChemistVisits: number;
  achievedOrderValue: number;
  status: string;
}

const STORAGE_KEY_ADMIN = 'sales_org_targets';

export const targetService = {
  // --- MR Specific Async Targets (Existing) ---
  async getTargetsByMR(mrId: number): Promise<TargetRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>(`/targets/mr/${mrId}`);
      if (response.success && Array.isArray(response.data)) {
        return response.data.map(t => ({
          id: t.id,
          mrId: t.mrId,
          month: t.month,
          year: t.year,
          doctorVisitTarget: t.doctorVisitTarget,
          chemistVisitTarget: t.chemistVisitTarget,
          orderTarget: Number(t.orderTarget || 0),
          achievedDoctorVisits: t.achievedDoctorVisits,
          achievedChemistVisits: t.achievedChemistVisits,
          achievedOrderValue: Number(t.achievedOrderValue || 0),
          status: t.status,
        }));
      }
    } catch (e) {
      console.error("Failed to load targets from backend:", e);
    }
    return [];
  },

  // --- Super Admin Initial Targets (New) ---
  getAdminTargets(): SalesTarget[] {
    const data = localStorage.getItem(STORAGE_KEY_ADMIN);
    return data ? JSON.parse(data) : [];
  },

  addAdminTarget(tgt: Omit<SalesTarget, 'id'>): SalesTarget {
    const targets = this.getAdminTargets();
    
    // Prevent duplicate active targets for the same financial year for this employee
    const duplicate = targets.find(
      t => t.employeeId === tgt.employeeId && t.financialYear === tgt.financialYear && t.status === 'Active'
    );
    if (duplicate) {
      throw new Error(`An active target already exists for this employee in ${tgt.financialYear}.`);
    }

    if (tgt.targetAmount <= 0) {
      throw new Error("Target amount must be greater than zero.");
    }

    const newTgt: SalesTarget = {
      ...tgt,
      id: `tgt-${Date.now()}`,
    };
    targets.unshift(newTgt);
    localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(targets));
    return newTgt;
  },

  updateAdminTarget(id: string, updated: Partial<SalesTarget>): SalesTarget | null {
    const targets = this.getAdminTargets();
    const index = targets.findIndex((t) => t.id === id);
    if (index === -1) return null;

    if (updated.targetAmount !== undefined && updated.targetAmount <= 0) {
      throw new Error("Target amount must be greater than zero.");
    }

    targets[index] = { ...targets[index], ...updated };
    localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(targets));
    return targets[index];
  },

  deactivateAdminTarget(id: string): boolean {
    const tgt = this.updateAdminTarget(id, { status: 'Inactive' });
    return !!tgt;
  }
};
