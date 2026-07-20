import { apiRequest } from './apiClient';

export interface DoctorVisit {
  id: string;
  doctorName: string;
  specialty: string;
  clinic: string;
  mobile?: string;
  visitDate: string;
  visitTime: string;
  visitType: 'Routine Visit' | 'Follow Up' | 'New Doctor';
  doctorClass: 'A' | 'B' | 'C';
  productsDiscussed: string;
  samplesGiven: string;
  prescriptionPotential: 'High' | 'Medium' | 'Low';
  nextFollowUp: string;
  remarks?: string;
  status: 'Completed' | 'Scheduled' | 'Missed';
  mrId?: number;
  latitude?: string;  
  longitude?: string;
  distanceVerified?: string;
}

let visitsCache: DoctorVisit[] = [];

try {
  const data = localStorage.getItem("doctor_visits");
  if (data) {
    visitsCache = JSON.parse(data);
  }
} catch (e) {
  console.error("Failed to parse cached doctor visits:", e);
}

export const doctorVisitService = {
  getAll(): DoctorVisit[] {
    return visitsCache;
  },

  async loadDoctorVisits(mrId: number): Promise<DoctorVisit[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>(`/doctor-visits/mr/${mrId}`);
      if (response.success && Array.isArray(response.data)) {
        visitsCache = response.data.map(v => ({
          id: String(v.id),
          mrId: v.mrId,
          doctorName: v.doctor?.name || "Dr. Unknown",
          specialty: v.doctor?.specialization || "General",
          clinic: v.doctor?.hospital || v.doctor?.address || "Clinic",
          mobile: v.doctor?.mobile || "",
          visitDate: v.visitDate ? v.visitDate.split('T')[0] : new Date().toISOString().split('T')[0],
          visitTime: v.visitDate ? new Date(v.visitDate).toTimeString().slice(0, 5) : "10:00",
          visitType: 'Routine Visit',
          doctorClass: 'B',
          productsDiscussed: v.productsDiscussed || "",
          samplesGiven: String(v.samplesGiven || 0),
          prescriptionPotential: 'Medium',
          nextFollowUp: '',
          remarks: v.remarks || "",
          status: 'Completed',
          latitude: v.latitude ? String(v.latitude) : undefined,
          longitude: v.longitude ? String(v.longitude) : undefined,
        }));
        localStorage.setItem("doctor_visits", JSON.stringify(visitsCache));
      }
    } catch (err) {
      console.error("Failed to load doctor visits from backend:", err);
    }
    return visitsCache;
  },

  async loadAllDoctorVisits(): Promise<DoctorVisit[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>(`/doctor-visits`);
      if (response.success && Array.isArray(response.data)) {
        visitsCache = response.data.map(v => ({
          id: String(v.id),
          mrId: v.mrId,
          doctorName: v.doctor?.name || "Dr. Unknown",
          specialty: v.doctor?.specialization || "General",
          clinic: v.doctor?.hospital || v.doctor?.address || "Clinic",
          mobile: v.doctor?.mobile || "",
          visitDate: v.visitDate ? v.visitDate.split('T')[0] : new Date().toISOString().split('T')[0],
          visitTime: v.visitDate ? new Date(v.visitDate).toTimeString().slice(0, 5) : "10:00",
          visitType: 'Routine Visit',
          doctorClass: 'B',
          productsDiscussed: v.productsDiscussed || "",
          samplesGiven: String(v.samplesGiven || 0),
          prescriptionPotential: 'Medium',
          nextFollowUp: '',
          remarks: v.remarks || "",
          status: 'Completed',
          latitude: v.latitude ? String(v.latitude) : undefined,
          longitude: v.longitude ? String(v.longitude) : undefined,
        }));
        localStorage.setItem("doctor_visits", JSON.stringify(visitsCache));
      }
    } catch (err) {
      console.error("Failed to load all doctor visits from backend:", err);
    }
    return visitsCache;
  },

  async addDoctorVisit(mrId: number, visit: Partial<DoctorVisit> & { doctorId: number }): Promise<DoctorVisit> {
    const dbPayload = {
      mrId,
      doctorId: visit.doctorId,
      remarks: visit.remarks || "",
      productsDiscussed: visit.productsDiscussed || "",
      samplesGiven: visit.samplesGiven ? Number(visit.samplesGiven) : 0,
      latitude: visit.latitude ? Number(visit.latitude) : null,
      longitude: visit.longitude ? Number(visit.longitude) : null,
      visitDate: new Date().toISOString(),
    };

    const response = await apiRequest<{ success: boolean; data: any }>('/doctor-visits', {
      method: 'POST',
      bodyData: dbPayload,
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to save doctor visit');
    }

    const created = response.data;
    const mapped: DoctorVisit = {
      id: String(created.id),
      mrId: created.mrId || mrId,
      doctorName: created.doctor?.name || visit.doctorName || "Doctor",
      specialty: created.doctor?.specialization || visit.specialty || "General",
      clinic: created.doctor?.hospital || created.doctor?.address || visit.clinic || "Clinic",
      mobile: created.doctor?.mobile || visit.mobile || "",
      visitDate: created.visitDate ? created.visitDate.split('T')[0] : new Date().toISOString().split('T')[0],
      visitTime: created.visitDate ? new Date(created.visitDate).toTimeString().slice(0, 5) : "10:00",
      visitType: visit.visitType || 'Routine Visit',
      doctorClass: visit.doctorClass || 'B',
      productsDiscussed: created.productsDiscussed || "",
      samplesGiven: String(created.samplesGiven || 0),
      prescriptionPotential: visit.prescriptionPotential || 'Medium',
      nextFollowUp: visit.nextFollowUp || '',
      remarks: created.remarks || "",
      status: 'Completed',
      latitude: created.latitude ? String(created.latitude) : undefined,
      longitude: created.longitude ? String(created.longitude) : undefined,
    };

    visitsCache = [mapped, ...visitsCache];
    localStorage.setItem("doctor_visits", JSON.stringify(visitsCache));
    return mapped;
  },

  async deleteDoctorVisit(id: string): Promise<boolean> {
    const response = await apiRequest<{ success: boolean }>(`/doctor-visits/${id}`, {
      method: 'DELETE',
    });
    if (response.success) {
      visitsCache = visitsCache.filter(v => v.id !== id);
      localStorage.setItem("doctor_visits", JSON.stringify(visitsCache));
    }
    return response.success;
  }
};
