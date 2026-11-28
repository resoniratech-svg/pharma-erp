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
  gstNumber?: string;
  address?: string;
  licenseNumber?: string;
  upiId?: string;
  upiQrScanner?: string;
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
      const matchId = (u.id && String(u.id).trim().toLowerCase() === cleanInput) ||
                      (u.empId && String(u.empId).trim().toLowerCase() === cleanInput) ||
                      (u.employeeCode && String(u.employeeCode).trim().toLowerCase() === cleanInput);
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

    // 3.5 Dynamic Employees Fallback (from sales_org_employees)
    if (!user) {
      try {
        const storedEmployees = localStorage.getItem('sales_org_employees');
        const employees = storedEmployees ? JSON.parse(storedEmployees) : [];
        const employee = employees.find((e: any) => 
          e && e.email && e.email.toLowerCase() === cleanInput && 
          e.password === password
        );
        
        if (employee) {
          user = {
            id: employee.id,
            name: employee.employeeName,
            email: employee.email,
            password: employee.password,
            role: employee.designation,
            status: employee.status || 'Active',
            mobile: employee.mobile || '',
            employeeCode: employee.employeeCode,
            department: 'Sales Hierarchy',
            territory: employee.territory || '',
          };
        }
      } catch (e) {
        console.error('Error reading sales_org_employees:', e);
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

    // Enrich user with extended metadata
    const userMetaMap: Record<string, any> = {};
    try {
      const storedMeta = localStorage.getItem('pharma_users_extended_meta');
      if (storedMeta) Object.assign(userMetaMap, JSON.parse(storedMeta));
    } catch (_) {}
    const userMeta = userMetaMap[user.email?.toLowerCase()] || userMetaMap[String(user.id)] || {};
    user.employeeCode = userMeta.empId || user.employeeCode || user.empId || String(user.id);
    user.gstNumber = userMeta.gstNumber || user.gstNumber || '';
    user.address = userMeta.address || user.address || '';
    user.licenseNumber = userMeta.licenseNumber || user.licenseNumber || '';
    user.upiId = userMeta.upiId || user.upiId || '';
    user.upiQrScanner = userMeta.upiQrScanner || user.upiQrScanner || '';

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

      // Load extended meta (GST, Address, License, UPI, Scanner QR, User/Employee Code)
      const userMetaMap: Record<string, any> = {};
      try {
        const storedMeta = localStorage.getItem('pharma_users_extended_meta');
        if (storedMeta) Object.assign(userMetaMap, JSON.parse(storedMeta));
      } catch (_) {}

      const userMeta = userMetaMap[user.email?.toLowerCase()] || userMetaMap[String(user.id)] || {};

      // Map backend user to frontend UserRecord format
      const mappedRole = user.role === 'ADMIN' ? 'COMPANY_ADMIN' : user.role;
      const userRecord: UserRecord = {
        id: String(user.id),
        fullName: user.name,
        email: user.email,
        roleId: mappedRole,
        mobile: user.mobile || userMeta.mobile || '',
        employeeCode: userMeta.empId || (employee ? employee.employeeCode : (mr ? mr.mrCode : ((user as any).linkedRetailerCode || (user as any).linkedDistributorCode || ''))),
        linkedDistributorCode: (user as any).linkedDistributorCode || '',
        department: employee ? 'Sales Hierarchy' : (mr ? 'Sales & Marketing' : 'Management'),
        password: password, // Keep the entered password for compatibility with settings
        gstNumber: userMeta.gstNumber || '',
        address: userMeta.address || '',
        licenseNumber: userMeta.licenseNumber || '',
        upiId: userMeta.upiId || '',
        upiQrScanner: userMeta.upiQrScanner || ''
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
      if ((user as any).linkedRetailerCode) {
        localStorage.setItem('retailerCode', (user as any).linkedRetailerCode);
      }

      return userRecord;
    } catch (err: any) {
      // Fallback: check local users if backend call fails
      try {
        const localRes = await this.localLogin(email, password);
        if (localRes?.user) {
          const u = localRes.user;
          const userMetaMap: Record<string, any> = {};
          try {
            const storedMeta = localStorage.getItem('pharma_users_extended_meta');
            if (storedMeta) Object.assign(userMetaMap, JSON.parse(storedMeta));
          } catch (_) {}
          const userMeta = userMetaMap[u.email?.toLowerCase()] || userMetaMap[String(u.id)] || {};

          const fallbackRecord: UserRecord = {
            id: String(u.id),
            fullName: u.name || u.fullName,
            email: u.email,
            roleId: localRes.mappedRoleId || u.role,
            mobile: u.mobile || userMeta.mobile || '',
            employeeCode: userMeta.empId || u.employeeCode || u.empId || String(u.id),
            linkedDistributorCode: u.linkedDistributorCode || '',
            department: u.department || 'Management',
            password: password,
            gstNumber: userMeta.gstNumber || u.gstNumber || '',
            address: userMeta.address || u.address || '',
            licenseNumber: userMeta.licenseNumber || u.licenseNumber || '',
            upiId: userMeta.upiId || u.upiId || '',
            upiQrScanner: userMeta.upiQrScanner || u.upiQrScanner || ''
          };

          localStorage.setItem('authToken', 'local_token_' + Date.now());
          localStorage.setItem('authUser', JSON.stringify(fallbackRecord));
          localStorage.setItem('activeRole', fallbackRecord.roleId);
          localStorage.setItem('userId', String(fallbackRecord.id));
          return fallbackRecord;
        }
      } catch (_) {}
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

    let responseData: any = null;
    try {
      const response = await apiRequest<{ success: boolean; data: any; message: string }>('/auth/profile', {
        method: 'PUT',
        bodyData: updatedData,
      });

      if (response && response.success) {
        responseData = response.data;
      }
    } catch (e) {
      console.warn("Backend profile update fallback to local:", e);
    }

    const updatedUser: UserRecord = {
      ...currentUser,
      fullName: responseData?.name || updatedData.name || currentUser.fullName,
      email: responseData?.email || updatedData.email || currentUser.email,
      mobile: responseData?.mobile || updatedData.mobile || currentUser.mobile,
      profileImage: responseData?.profileImage || updatedData.profileImage || currentUser.profileImage,
      password: updatedData.newPassword || currentUser.password,
      gstNumber: updatedData.gstNumber !== undefined ? updatedData.gstNumber : currentUser.gstNumber,
      licenseNumber: updatedData.licenseNumber !== undefined ? updatedData.licenseNumber : currentUser.licenseNumber,
      address: updatedData.address !== undefined ? updatedData.address : currentUser.address,
      upiId: updatedData.upiId !== undefined ? updatedData.upiId : currentUser.upiId,
      upiQrScanner: updatedData.upiQrScanner !== undefined ? updatedData.upiQrScanner : currentUser.upiQrScanner,
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