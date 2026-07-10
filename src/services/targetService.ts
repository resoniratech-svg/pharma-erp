import { apiRequest } from './apiClient';

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

export const targetService = {
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
  }
};
