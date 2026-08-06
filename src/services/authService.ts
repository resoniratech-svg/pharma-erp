import { apiRequest } from './apiClient';

import { seedUsers } from '../data/seedUsers';

export const DEMO_CREDENTIALS: Record<string, string> = {
  'superadmin@pharmaerp.com': 'Super Admin',
  'warehouse@pharmaerp.com': 'Warehouse Manager',
  'accountant@pharmaerp.com': 'Accountant',
  'accounts@pharmaerp.com': 'Accountant',
  'distributor@pharmaerp.com': 'Distributor',
  'retailer@pharmaerp.com': 'Retailer',
  'mr@pharmaerp.com': 'Medical Representative',
  'nsh@pharmaerp.com': 'National Sales Head',
  'nsm@pharmaerp.com': 'National Sales Head',
  'rsm@pharmaerp.com': 'Regional Sales Manager',
  'asm@pharmaerp.com': 'Area Sales Manager',
};

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
  profileImage?: string;
  linkedDistributorCode?: string;
}

export class AuthService {
  mapRoleToId(roleName: string) {
    const map: Record<string, string> = {
      'Super Admin': 'SUPER_ADMIN',
      'Warehouse Manager': 'WAREHOUSE_MANAGER',
      'Accountant': 'ACCOUNTANT',
      'Distributor': 'DISTRIBUTOR',
      'Retailer': 'RETAILER',
      'National Sales Head': 'NATIONAL_SALES_HEAD',

      'Regional Sales Manager': 'REGIONAL_SALES_MANAGER',
      'Area Sales Manager': 'AREA_SALES_MANAGER',
      'Medical Representative': 'MEDICAL_REPRESENTATIVE',
      'COMPANY_ADMIN': 'COMPANY_ADMIN'
    };
    if (map[roleName]) return map[roleName];
    return roleName ? roleName.toUpperCase().replace(/\s+/g, '_') : '';
  }

  async localLogin(email: string, password: string): Promise<any> {
    const cleanInput = email.trim().toLowerCase();

    // 1. Sync and load users
    const storedUsers = localStorage.getItem('users');
    let users: any[] = [];
    try {
      users = storedUsers ? JSON.parse(storedUsers) : [];
    } catch (e) {
      users = [];
    }

    if (!Array.isArray(users) || users.length === 0) {
      users = [...seedUsers];
      localStorage.setItem('users', JSON.stringify(seedUsers));
    } else {
      let updated = false;
      for (const su of seedUsers) {
        const index = users.findIndex(
          (u: any) => u && (u.id === su.id || (u.email && u.email.toLowerCase() === su.email.toLowerCase()))
        );
        if (index !== -1) {
          if (users[index].id !== su.id || users[index].name !== su.name || users[index].role !== su.role) {
            users[index] = { ...users[index], id: su.id, name: su.name, role: su.role };
            updated = true;
          }
        } else {
          users.push(su);
          updated = true;
        }
      }
      if (updated) {
        localStorage.setItem('users', JSON.stringify(users));
      }
    }

    const cleanPassword = password.trim();

    // 2. Validate against User Management users
    let user = users.find((u: any) => {
      if (!u) return false;
      const matchEmail = u.email && String(u.email).trim().toLowerCase() === cleanInput;
      const matchUsername = u.username && String(u.username).trim().toLowerCase() === cleanInput;
      const matchId = u.id && String(u.id).trim().toLowerCase() === cleanInput;
      const matchPass = u.password && String(u.password).trim() === cleanPassword;
      return (matchEmail || matchUsername || matchId) && matchPass;
    });

    // 3. Demo Credentials Interceptor
    if (!user && password === '1234' && DEMO_CREDENTIALS[cleanInput]) {
      const targetRoleName = DEMO_CREDENTIALS[cleanInput];
      
      // Try to find an existing user with this role
      user = users.find((u: any) => u.role === targetRoleName);
      
      if (user) {
        // If a real user is found but they are not active, 
        // we'll clone them and force 'Active' status for the demo session
        // so the demo login is never blocked.
        user = { ...user, status: 'Active' };
      }
      
      // If no user exists for this role, generate a demo user session
      if (!user) {
        user = {
          id: 'DEMO_' + Date.now(),
          name: 'Demo ' + targetRoleName,
          email: cleanInput,
          role: targetRoleName,
          status: 'Active',
          password: '1234'
        };
      }
    }

    // 4. Company Admin Fallback (Tenant)
    if (!user) {
      try {
        const storedAdmins = localStorage.getItem('companyAdmins');
        const companyAdmins = storedAdmins ? JSON.parse(storedAdmins) : [];
        const companyAdmin = companyAdmins.find((a: any) => 
          a && a.email && a.email.toLowerCase() === cleanInput && 
          (a.passwordHash === password || a.password === password)
        );
        
        if (companyAdmin) {
          user = {
            id: companyAdmin.id,
            email: companyAdmin.email,
            name: companyAdmin.adminName,
            password: password,
            role: 'COMPANY_ADMIN',
            status: 'Active',
            tenantId: companyAdmin.id,
            purchasedModules: companyAdmin.subscription?.purchasedModules || []
          };
        }
      } catch (e) {
        console.error('Error reading companyAdmins:', e);
      }
    }

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (user.status !== 'Active') {
      throw new Error('Your account is not active.');
    }

    const mappedRoleId = this.mapRoleToId(user.role);

    // Update last login
    const now = new Date();
    user.lastLogin = now.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
    
    // Only save back to localStorage if it's not a temporary DEMO user
    if (!user.id.startsWith('DEMO_')) {
      const userIndex = users.findIndex((u: any) => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex] = user;
        localStorage.setItem('users', JSON.stringify(users));
      }
    }

    return { user, mappedRoleId };
  }
  async login(email: string, password: string, force = false): Promise<UserRecord> {
    try {
      const response = await apiRequest<{ success: boolean; data: any }>('/auth/login', {
        method: 'POST',
        bodyData: { email, password }
      });

      if (!response.success || !response.data) {
        throw new Error('Invalid email or password.');
      }

      const { token, user, mr, employee } = response.data;

      // Map backend user to frontend UserRecord format
      const mappedRole = user.role === 'ADMIN' ? 'COMPANY_ADMIN' : user.role;
      const userRecord: UserRecord = {
        id: String(user.id),
        fullName: user.name,
        email: user.email,
        roleId: mappedRole,
        mobile: '',
        employeeCode: employee ? employee.employeeCode : (mr ? mr.mrCode : ((user as any).linkedRetailerCode || '')),
        linkedDistributorCode: (user as any).linkedDistributorCode || '',
        department: employee ? 'Sales Hierarchy' : (mr ? 'Sales & Marketing' : 'Management'),
        password: password, // Keep the entered password for compatibility with settings
      };

      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(userRecord));
      localStorage.setItem('activeRole', mappedRole);
      localStorage.setItem('userId', String(user.id));
      if (employee) {
        localStorage.setItem('employeeId', String(employee.id));
        localStorage.setItem('employeeCode', employee.employeeCode || '');
        localStorage.setItem('employeeDesignation', employee.designation || '');
      }
      if (mr) {
        localStorage.setItem('mrId', String(mr.id));
        localStorage.setItem('mrCode', mr.mrCode);
        localStorage.setItem('mrTerritory', mr.territory || '');
      }

      return userRecord;
    } catch (err: any) {
      throw err;
    }
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
    localStorage.removeItem('employeeId');
    localStorage.removeItem('employeeCode');
    localStorage.removeItem('employeeDesignation');
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

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest<{ success: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      bodyData: { email },
    });
    return response;
  }

  async resetPassword(id: string, token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      bodyData: { id, token, newPassword },
    });
    return response;
  }
}

export const authService = new AuthService();

export default authService;