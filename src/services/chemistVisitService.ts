import { apiRequest } from './apiClient';

export interface ChemistVisit {
  id: string;
  chemistName: string;
  mobile?: string;
  address?: string;
  visitDate: string;
  visitTime: string;
  visitType: 'Routine Visit' | 'Payment Collection' | 'New Chemist';
  productsDiscussed: string;
  orderValue: string;
  remarks?: string;
  status: 'Completed' | 'Scheduled' | 'Missed';
  mrId?: number;
  latitude?: string;
  longitude?: string;
  distanceVerified?: string;
  nextFollowUp?: string;
}

let visitsCache: ChemistVisit[] = [];

try {
  const data = localStorage.getItem("chemist_visits");
  if (data) {
    visitsCache = JSON.parse(data);
  }
} catch (e) {
  console.error("Failed to parse cached chemist visits:", e);
}

export const chemistVisitService = {
  getAll(): ChemistVisit[] {
    return visitsCache;
  },

  async loadChemistVisits(mrId: number): Promise<ChemistVisit[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>(`/chemist-visits/mr/${mrId}`);
      if (response.success && Array.isArray(response.data)) {
        visitsCache = response.data.map(v => ({
          id: String(v.id),
          mrId: v.mrId,
          chemistName: v.chemist?.name || "Chemist",
          mobile: v.chemist?.mobile || "",
          address: v.chemist?.address || "",
          visitDate: v.visitDate ? v.visitDate.split('T')[0] : new Date().toISOString().split('T')[0],
          visitTime: v.visitDate ? new Date(v.visitDate).toTimeString().slice(0, 5) : "10:00",
          visitType: 'Routine Visit',
          productsDiscussed: v.productsDiscussed || "",
          orderValue: String(v.orderValue || 0),
          remarks: v.remarks || "",
          status: 'Completed',
          latitude: v.latitude ? String(v.latitude) : undefined,
          longitude: v.longitude ? String(v.longitude) : undefined,
          nextFollowUp: v.nextFollowUpDate ? v.nextFollowUpDate.split('T')[0] : "",
        }));
        localStorage.setItem("chemist_visits", JSON.stringify(visitsCache));
      }
    } catch (err) {
      console.error("Failed to load chemist visits from backend:", err);
    }
    return visitsCache;
  },

  async loadAllChemistVisits(): Promise<ChemistVisit[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>(`/chemist-visits`);
      if (response.success && Array.isArray(response.data)) {
        visitsCache = response.data.map(v => ({
          id: String(v.id),
          mrId: v.mrId,
          chemistName: v.chemist?.name || "Chemist",
          mobile: v.chemist?.mobile || "",
          address: v.chemist?.address || "",
          visitDate: v.visitDate ? v.visitDate.split('T')[0] : new Date().toISOString().split('T')[0],
          visitTime: v.visitDate ? new Date(v.visitDate).toTimeString().slice(0, 5) : "10:00",
          visitType: 'Routine Visit',
          productsDiscussed: v.productsDiscussed || "",
          orderValue: String(v.orderValue || 0),
          remarks: v.remarks || "",
          status: 'Completed',
          latitude: v.latitude ? String(v.latitude) : undefined,
          longitude: v.longitude ? String(v.longitude) : undefined,
          nextFollowUp: v.nextFollowUpDate ? v.nextFollowUpDate.split('T')[0] : "",
        }));
        localStorage.setItem("chemist_visits", JSON.stringify(visitsCache));
      }
    } catch (err) {
      console.error("Failed to load all chemist visits from backend:", err);
    }
    return visitsCache;
  },

  async addChemistVisit(mrId: number, visit: Partial<ChemistVisit> & { chemistId: number }): Promise<ChemistVisit> {
    const dbPayload = {
      mrId,
      chemistId: visit.chemistId,
      remarks: visit.remarks || "",
      productsDiscussed: visit.productsDiscussed || "",
      orderValue: visit.orderValue ? Number(visit.orderValue) : 0,
      latitude: visit.latitude ? Number(visit.latitude) : null,
      longitude: visit.longitude ? Number(visit.longitude) : null,
      nextFollowUpDate: visit.nextFollowUp ? new Date(visit.nextFollowUp).toISOString() : null,
      visitDate: new Date().toISOString(),
    };

    const response = await apiRequest<{ success: boolean; data: any }>('/chemist-visits', {
      method: 'POST',
      bodyData: dbPayload,
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to save chemist visit');
    }

    const created = response.data;
    const mapped: ChemistVisit = {
      id: String(created.id),
      mrId: created.mrId || mrId,
      chemistName: created.chemist?.name || visit.chemistName || "Chemist",
      mobile: created.chemist?.mobile || visit.mobile || "",
      address: created.chemist?.address || visit.address || "",
      visitDate: created.visitDate ? created.visitDate.split('T')[0] : new Date().toISOString().split('T')[0],
      visitTime: created.visitDate ? new Date(created.visitDate).toTimeString().slice(0, 5) : "10:00",
      visitType: visit.visitType || 'Routine Visit',
      productsDiscussed: created.productsDiscussed || "",
      orderValue: String(created.orderValue || 0),
      remarks: created.remarks || "",
      status: 'Completed',
      latitude: created.latitude ? String(created.latitude) : undefined,
      longitude: created.longitude ? String(created.longitude) : undefined,
    };

    visitsCache = [mapped, ...visitsCache];
    localStorage.setItem("chemist_visits", JSON.stringify(visitsCache));
    return mapped;
  },

  async deleteChemistVisit(id: string): Promise<boolean> {
    const response = await apiRequest<{ success: boolean }>(`/chemist-visits/${id}`, {
      method: 'DELETE',
    });
    if (response.success) {
      visitsCache = visitsCache.filter(v => v.id !== id);
      localStorage.setItem("chemist_visits", JSON.stringify(visitsCache));
    }
    return response.success;
  }
};
