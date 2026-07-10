import { apiRequest } from './apiClient';

export interface ChemistRecord {
  id: number;
  chemistCode: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
  territory: string;
  gstNumber: string;
  drugLicenseNumber: string;
  isActive: boolean;
}

export const chemistService = {
  async getChemists(): Promise<ChemistRecord[]> {
    const response = await apiRequest<{ success: boolean; data: ChemistRecord[] }>('/chemists');
    return response.success ? response.data : [];
  },

  async addChemist(chemist: Omit<ChemistRecord, 'id' | 'chemistCode' | 'isActive'>): Promise<ChemistRecord> {
    const chemistCode = 'CHM-' + Math.floor(100000 + Math.random() * 900000);
    const response = await apiRequest<{ success: boolean; data: ChemistRecord }>('/chemists', {
      method: 'POST',
      bodyData: { ...chemist, chemistCode, isActive: true }
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to create chemist');
    }
    return response.data;
  }
};
