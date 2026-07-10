import { apiRequest } from './apiClient';

export interface TourPlanRecord {
  id: string;
  planType: 'MTP' | 'WTP' | 'DTP';
  date: string;
  repName: string;
  hq: string;
  route: string;
  beat: string;
  startTime: string;
  endTime: string;
  objective: string;
  docCount: number;
  chemistCount: number;
  doctorsList: string;
  chemistsList: string;
  remarks: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Completed';
}

let plansCache: TourPlanRecord[] = [];

try {
  const data = localStorage.getItem("@web_tour_plans");
  if (data) {
    plansCache = JSON.parse(data);
  }
} catch (e) {
  console.error("Failed to parse cached tour plans:", e);
}

export const tourPlanService = {
  getAll(): TourPlanRecord[] {
    return plansCache;
  },

  async loadTourPlans(mrId: number): Promise<TourPlanRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>(`/tour-plans/mr/${mrId}`);
      if (response.success && Array.isArray(response.data)) {
        plansCache = response.data.map(tp => ({
          id: String(tp.id),
          planType: 'MTP',
          date: tp.tourDate ? tp.tourDate.split('T')[0] : new Date().toISOString().split('T')[0],
          repName: tp.mr?.name || "Medical Representative",
          hq: tp.territory || "HQ",
          route: tp.territory || "Route",
          beat: tp.territory || "Beat",
          startTime: '09:00',
          endTime: '18:00',
          objective: tp.objective || "",
          docCount: tp.tourPlanDoctors?.length || 0,
          chemistCount: tp.tourPlanChemists?.length || 0,
          doctorsList: (tp.tourPlanDoctors || []).map((d: any) => d.doctor?.name).join(', '),
          chemistsList: (tp.tourPlanChemists || []).map((c: any) => c.chemist?.name).join(', '),
          remarks: '',
          status: 'Approved',
        }));
        localStorage.setItem("@web_tour_plans", JSON.stringify(plansCache));
      }
    } catch (err) {
      console.error("Failed to load tour plans from backend:", err);
    }
    return plansCache;
  },

  async addTourPlan(mrId: number, plan: Partial<TourPlanRecord>): Promise<TourPlanRecord> {
    const dbPayload = {
      mrId,
      tourDate: plan.date ? new Date(plan.date).toISOString() : new Date().toISOString(),
      territory: plan.beat || plan.route || plan.hq || "HQ",
      objective: plan.objective || "",
      status: "PLANNED",
    };

    const response = await apiRequest<{ success: boolean; data: any }>('/tour-plans', {
      method: 'POST',
      bodyData: dbPayload,
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to create tour plan');
    }

    const created = response.data;
    const mapped: TourPlanRecord = {
      id: String(created.id),
      planType: 'MTP',
      date: created.tourDate ? created.tourDate.split('T')[0] : new Date().toISOString().split('T')[0],
      repName: created.mr?.name || plan.repName || "Medical Representative",
      hq: created.territory,
      route: created.territory,
      beat: created.territory,
      startTime: plan.startTime || '09:00',
      endTime: plan.endTime || '18:00',
      objective: created.objective || "",
      docCount: plan.docCount || 0,
      chemistCount: plan.chemistCount || 0,
      doctorsList: plan.doctorsList || '',
      chemistsList: plan.chemistsList || '',
      remarks: plan.remarks || '',
      status: 'Approved',
    };

    plansCache = [mapped, ...plansCache];
    localStorage.setItem("@web_tour_plans", JSON.stringify(plansCache));
    return mapped;
  }
};
