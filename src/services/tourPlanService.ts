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

const mapBackendToTourPlan = (tp: any): TourPlanRecord => {
  let uiStatus: TourPlanRecord['status'] = 'Draft';
  const rawStatus = (tp.status || '').toUpperCase();
  if (rawStatus === 'APPROVED') uiStatus = 'Approved';
  else if (rawStatus === 'REJECTED') uiStatus = 'Rejected';
  else if (rawStatus === 'COMPLETED') uiStatus = 'Completed';
  else if (rawStatus === 'PENDING' || rawStatus === 'PENDING_APPROVAL') uiStatus = 'Pending Approval';
  else uiStatus = 'Approved'; // default for active planned tours

  return {
    id: String(tp.id),
    planType: tp.planType || 'MTP',
    date: tp.tourDate ? tp.tourDate.split('T')[0] : (tp.date || new Date().toISOString().split('T')[0]),
    repName: tp.mr?.name || "Medical Representative",
    hq: tp.hq || tp.territory || "HQ",
    route: tp.route || tp.territory || "Route",
    beat: tp.beat || tp.territory || "Beat",
    startTime: tp.startTime || '09:00',
    endTime: tp.endTime || '18:00',
    objective: tp.objective || "",
    docCount: tp.tourPlanDoctors?.length || tp.docCount || 0,
    chemistCount: tp.tourPlanChemists?.length || tp.chemistCount || 0,
    doctorsList: (tp.tourPlanDoctors || []).map((d: any) => d.doctor?.name).filter(Boolean).join(', ') || tp.doctorsList || '',
    chemistsList: (tp.tourPlanChemists || []).map((c: any) => c.chemist?.name).filter(Boolean).join(', ') || tp.chemistsList || '',
    remarks: tp.remarks || '',
    status: uiStatus,
  };
};

export const tourPlanService = {
  getAll(): TourPlanRecord[] {
    return plansCache;
  },

  async loadTourPlans(mrId?: number): Promise<TourPlanRecord[]> {
    try {
      const endpoint = mrId ? `/tour-plans/mr/${mrId}` : '/tour-plans';
      const response = await apiRequest<{ success: boolean; data: any[] }>(endpoint);
      if (response.success && Array.isArray(response.data)) {
        plansCache = response.data.map(mapBackendToTourPlan);
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
      status: plan.status === 'Draft' ? 'DRAFT' : 'PLANNED',
      remarks: plan.remarks || '',
    };

    const response = await apiRequest<{ success: boolean; data: any }>('/tour-plans', {
      method: 'POST',
      bodyData: dbPayload,
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to create tour plan');
    }

    const created = mapBackendToTourPlan(response.data);
    plansCache = [created, ...plansCache];
    return created;
  },

  async updateTourPlan(id: string | number, updates: Partial<TourPlanRecord>): Promise<TourPlanRecord | null> {
    try {
      const dbPayload: any = {};
      if (updates.date) dbPayload.tourDate = new Date(updates.date).toISOString();
      if (updates.beat || updates.route || updates.hq) dbPayload.territory = updates.beat || updates.route || updates.hq;
      if (updates.objective !== undefined) dbPayload.objective = updates.objective;
      if (updates.remarks !== undefined) dbPayload.remarks = updates.remarks;
      if (updates.status) dbPayload.status = updates.status.toUpperCase();

      const response = await apiRequest<{ success: boolean; data: any }>(`/tour-plans/${id}`, {
        method: 'PUT',
        bodyData: dbPayload,
      });

      if (response.success && response.data) {
        const updated = mapBackendToTourPlan(response.data);
        plansCache = plansCache.map(p => p.id === String(id) ? updated : p);
        return updated;
      }
    } catch (err) {
      console.error("Failed to update tour plan:", err);
    }
    return null;
  },

  async deleteTourPlan(id: string | number): Promise<boolean> {
    try {
      const response = await apiRequest<{ success: boolean }>(`/tour-plans/${id}`, {
        method: 'DELETE',
      });
      if (response.success) {
        plansCache = plansCache.filter(p => p.id !== String(id));
        return true;
      }
    } catch (err) {
      console.error("Failed to delete tour plan:", err);
    }
    return false;
  },

  async approveTourPlan(id: string | number): Promise<boolean> {
    try {
      const response = await apiRequest<{ success: boolean }>(`/tour-plans/${id}/approve`, {
        method: 'PUT',
      });
      if (response.success) {
        plansCache = plansCache.map(p => p.id === String(id) ? { ...p, status: 'Approved' } : p);
        return true;
      }
    } catch (err) {
      console.error("Failed to approve tour plan:", err);
    }
    return false;
  },

  async completeTourPlan(id: string | number): Promise<boolean> {
    try {
      const response = await apiRequest<{ success: boolean }>(`/tour-plans/${id}/complete`, {
        method: 'PUT',
      });
      if (response.success) {
        plansCache = plansCache.map(p => p.id === String(id) ? { ...p, status: 'Completed' } : p);
        return true;
      }
    } catch (err) {
      console.error("Failed to complete tour plan:", err);
    }
    return false;
  }
};
