import { apiRequest } from './apiClient';

export interface MRRecord {
  id: number;
  mrCode: string;
  name: string;
  mobile: string;
  email: string;
  territory: string;
  joiningDate: string;
  status: string;
}

export const mrService = {
  async getMRs(): Promise<MRRecord[]> {
    const response = await apiRequest<{ success: boolean; data: MRRecord[] }>('/mrs');
    return response.success ? response.data : [];
  },

  async getMRById(id: number): Promise<MRRecord | null> {
    const response = await apiRequest<{ success: boolean; data: MRRecord }>(`/mrs/${id}`);
    return response.success ? response.data : null;
  }
};
