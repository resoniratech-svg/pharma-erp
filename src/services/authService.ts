import { apiRequest } from './apiClient';

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  mobile: string;
  employeeCode: string;
  department: string;
  roleId: string;
  avatarUrl?: string;
  linkedDistributorCode?: string;
}

export class AuthService {
  async login(email: string, password: string, force = false): Promise<UserRecord> {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('deviceId', deviceId);
    }

    const response = await apiRequest<{
      success: boolean;
      message: string;
      data: {
        token: string;
        user: {
          id: number;
          name: string;
          email: string;
          role: string;
        };
        mr: {
          id: number;
          mrCode: string;
          name: string;
          territory: string;
        } | null;
      };
    }>('/auth/login', {
      method: 'POST',
      bodyData: { email, password, deviceId, force },
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Login failed');
    }

    const { token, user, mr } = response.data;

    // Map backend user to frontend UserRecord format
    const userRecord: UserRecord = {
      id: String(user.id),
      fullName: user.name,
      email: user.email,
      roleId: user.role,
      mobile: '',
      employeeCode: mr ? mr.mrCode : ((user as any).linkedRetailerCode || ''),
      linkedDistributorCode: (user as any).linkedDistributorCode || '',
      department: mr ? 'Sales & Marketing' : 'Management',
      password: password, // Keep the entered password for compatibility with settings
    };

    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(userRecord));
    localStorage.setItem('activeRole', user.role);
    localStorage.setItem('userId', String(user.id));
    if (mr) {
      localStorage.setItem('mrId', String(mr.id));
      localStorage.setItem('mrCode', mr.mrCode);
      localStorage.setItem('mrTerritory', mr.territory || '');
    }

    return userRecord;
  }

  getCurrentUser(): UserRecord | null {
    return localStorage.getItem('authUser') ? JSON.parse(localStorage.getItem('authUser')!) : null;
  }

  async logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn("Failed to notify logout to backend:", e);
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('activeRole');
    localStorage.removeItem('workspaceRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('mrId');
    localStorage.removeItem('mrCode');
    localStorage.removeItem('mrTerritory');
  }

  async updateProfile(updatedData: any) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return null;

    const response = await apiRequest<{ success: boolean; data: any; message: string }>('/auth/profile', {
      method: 'PUT',
      bodyData: updatedData,
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to update profile');
    }

    const updatedUser = {
      ...currentUser,
      fullName: response.data?.name || updatedData.name || currentUser.fullName,
      email: response.data?.email || updatedData.email || currentUser.email,
      mobile: response.data?.mobile || updatedData.mobile || currentUser.mobile,
      profileImage: response.data?.profileImage || updatedData.profileImage || currentUser.profileImage,
      password: updatedData.newPassword || currentUser.password,
    };

    localStorage.setItem('authUser', JSON.stringify(updatedUser));

    return updatedUser;
  }

  changePassword(
    currentPassword: string,
    newPassword: string
  ) {
    const currentUser = this.getCurrentUser();

    if (!currentUser) {
      throw new Error('User not found');
    }

    if (currentUser.password !== currentPassword) {
      throw new Error('Current password is incorrect');
    }

    currentUser.password = newPassword;

    localStorage.setItem(
      'authUser',
      JSON.stringify(currentUser)
    );

    return true;
  }
}

const authService = new AuthService();

export default authService;