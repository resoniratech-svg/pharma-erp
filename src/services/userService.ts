import { apiRequest } from './apiClient';

export interface BackendUserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  currentDeviceId: string | null;
  mobile: string | null;
  profileImage: string | null;
  linkedDistributorCode: string | null;
  linkedRetailerCode: string | null;
}

export const userService = {
  async getUsers(): Promise<BackendUserRecord[]> {
    const response = await apiRequest<{ success: boolean; data: BackendUserRecord[] }>('/users');
    return response.success ? response.data : [];
  },

  async getUserById(id: number): Promise<BackendUserRecord | null> {
    const response = await apiRequest<{ success: boolean; data: BackendUserRecord }>(`/users/${id}`);
    return response.success ? response.data : null;
  },

  async createUser(data: any): Promise<BackendUserRecord> {
    // The registration API handles password hashing and basic user setup securely
    const response = await apiRequest<{ success: boolean; data: BackendUserRecord; message: string }>('/auth/register', {
      method: 'POST',
      bodyData: data,
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create user');
    }
    return response.data;
  },

  async updateUser(id: number, data: any): Promise<BackendUserRecord> {
    const response = await apiRequest<{ success: boolean; data: BackendUserRecord; message: string }>(`/users/${id}`, {
      method: 'PUT',
      bodyData: data,
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update user');
    }
    return response.data;
  },

  async deleteUser(id: number): Promise<void> {
    await apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  }
};
