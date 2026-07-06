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
}

export class AuthService {
  async login(email: string, password: string): Promise<UserRecord> {
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
      bodyData: { email, password },
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
      employeeCode: mr ? mr.mrCode : '',
      department: mr ? 'Sales & Marketing' : 'Management',
      password: password, // Keep the entered password for compatibility with settings
    };

    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(userRecord));
    localStorage.setItem('activeRole', user.role);
    localStorage.setItem('userId', String(user.id));

    return userRecord;
  }

  getCurrentUser(): UserRecord | null {
    const user = localStorage.getItem('authUser');
    return user ? JSON.parse(user) : null;
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('activeRole');
    localStorage.removeItem('workspaceRole');
    localStorage.removeItem('userId');
  }

  updateProfile(updatedData: any) {
    const currentUser = this.getCurrentUser();

    if (!currentUser) return null;

    const updatedUser = {
      ...currentUser,
      ...updatedData,
    };

    localStorage.setItem(
      'authUser',
      JSON.stringify(updatedUser)
    );

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