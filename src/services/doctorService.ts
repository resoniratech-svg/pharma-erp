import { apiRequest } from './apiClient';

export interface DoctorRecord {
  id: number;
  doctorCode: string;
  name: string;
  specialization: string;
  hospital: string;
  mobile: string;
  email: string;
  address: string;
  territory: string;
  isActive: boolean;
}

export const doctorService = {
  async getDoctors(): Promise<DoctorRecord[]> {
    const response = await apiRequest<{ success: boolean; data: DoctorRecord[] }>('/doctors');
    return response.success ? response.data : [];
  },

  async addDoctor(doctor: Omit<DoctorRecord, 'id' | 'doctorCode' | 'isActive'>): Promise<DoctorRecord> {
    const doctorCode = 'DOC-' + Math.floor(100000 + Math.random() * 900000);
    const response = await apiRequest<{ success: boolean; data: DoctorRecord }>('/doctors', {
      method: 'POST',
      bodyData: { ...doctor, doctorCode, isActive: true }
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to create doctor');
    }
    return response.data;
  }
};
