import { apiRequest } from './apiClient';
import type { Employee, Designation, OrganizationNode } from '../modules/super-admin/sales-organization/types';

const STORAGE_KEY = 'sales_org_employees';

// Default seeded list (moved from salesOrganizationService)
const SEED_EMPLOYEES: Employee[] = [
  { id: 'emp-nsm-1', employeeCode: 'EMP-NSM-001', employeeName: 'Rajesh Sharma', designation: 'National Sales Head', reportsTo: 'Owner / Super Admin', zone: 'All India', region: 'National', state: 'Delhi', territory: 'HQ', area: 'All India Headquarters', headquarters: 'Delhi', joiningDate: '2020-01-15', status: 'Active' },
  { id: 'emp-rsm-1', employeeCode: 'EMP-RSM-001', employeeName: 'Amitabh Verma', designation: 'Regional Sales Manager', reportsTo: 'Rajesh Sharma', reportsToId: 'emp-nsm-1', zone: 'North-East Zone', region: 'North Region', state: 'Delhi', territory: 'Delhi NCR', area: 'Delhi Metro', headquarters: 'Delhi NCR', joiningDate: '2022-01-10', status: 'Active' },
  { id: 'emp-asm-1', employeeCode: 'EMP-ASM-001', employeeName: 'Gaurav Kapoor', designation: 'Area Sales Manager', reportsTo: 'Amitabh Verma', reportsToId: 'emp-rsm-1', zone: 'North-East Zone', region: 'North Region', state: 'Delhi', territory: 'South Delhi & Gurugram', area: 'South Delhi', headquarters: 'Gurugram', joiningDate: '2022-06-01', status: 'Active' },
  { id: 'emp-mr-1', employeeCode: 'EMP-MR-001', employeeName: 'Deepak Tyagi', designation: 'Medical Representative', reportsTo: 'Gaurav Kapoor', reportsToId: 'emp-asm-1', zone: 'North-East Zone', region: 'North Region', state: 'Delhi', territory: 'South Delhi & Gurugram', area: 'Saket & Vasant Kunj', headquarters: 'Gurugram', joiningDate: '2023-03-01', status: 'Active' },
];
export const DESIGNATION_HIERARCHY: Record<Designation | 'Owner / Super Admin', number> = {
  'Owner / Super Admin': 6,
  'National Sales Head': 5,
  'Regional Sales Manager': 4,
  'Area Sales Manager': 3,
  'Medical Representative': 2,
};

class EmployeeService {
  // --- Local Cache Helpers ---
  private getLocalEmployees(): Employee[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : SEED_EMPLOYEES;
  }
  
  private updateLocalCache(newOrUpdatedEmp: Employee) {
    const emps = this.getLocalEmployees();
    const idx = emps.findIndex(e => e.id === newOrUpdatedEmp.id);
    if (idx !== -1) emps[idx] = newOrUpdatedEmp;
    else emps.unshift(newOrUpdatedEmp);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emps));
  }

  generateNextEmployeeCode(designation: Designation): string {
    const prefixMap: Record<Designation, string> = {
      'National Sales Head': 'EMP-NSM-',
      'Regional Sales Manager': 'EMP-RSM-',
      'Area Sales Manager': 'EMP-ASM-',
      'Medical Representative': 'EMP-MR-',
    };
    const prefix = prefixMap[designation];
    const emps = this.getLocalEmployees();
    let maxNum = 0;
    for (const emp of emps) {
      if (emp.employeeCode.startsWith(prefix)) {
        const numPart = parseInt(emp.employeeCode.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    }
    return `${prefix}${(maxNum + 1).toString().padStart(3, '0')}`;
  }

  async getEmployees(params?: { designation?: string; reportsToId?: string | number; status?: string }): Promise<Employee[]> {
    try {
      const qs = new URLSearchParams();
      if (params?.designation) qs.append('designation', params.designation);
      if (params?.reportsToId) qs.append('reportsToId', String(params.reportsToId));
      if (params?.status) qs.append('status', params.status);

      const response = await apiRequest<{ success: boolean; data: Employee[] }>(`/sales-organization/employees?${qs.toString()}`);
      if (response.success && response.data) {
        // Sync local cache with backend data to keep sync functions working
        localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data));
        return response.data;
      }
    } catch (error) {
      console.warn('Failed to fetch from backend, falling back to local cache', error);
    }
    
    // Fallback logic
    let emps = this.getLocalEmployees();
    let madeFixes = false;

    // Self-healing routine for existing data missing strict relational ID
    emps.forEach(e => {
       if (!e.reportsToId && e.reportsTo && e.reportsTo !== 'Owner / Super Admin') {
          const manager = emps.find(m => m.employeeName === e.reportsTo);
          if (manager) {
             e.reportsToId = String(manager.id);
             madeFixes = true;
          }
       }
    });

    if (madeFixes) {
       localStorage.setItem(STORAGE_KEY, JSON.stringify(emps));
    }

    if (params?.designation) {
      emps = emps.filter(e => e.designation === params.designation);
    }
    if (params?.reportsToId) {
      emps = emps.filter(e => String(e.reportsToId) === String(params.reportsToId));
    }
    if (params?.status) {
      emps = emps.filter(e => e.status === params.status);
    }
    return emps;
  }

  async getEmployeeById(id: string | number): Promise<Employee | undefined> {
    try {
      const response = await apiRequest<{ success: boolean; data: Employee }>(`/sales-organization/employees/${id}`);
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.warn('Failed to fetch from backend, falling back to local cache', error);
    }
    const emps = this.getLocalEmployees();
    return emps.find(e => String(e.id) === String(id));
  }

  async addEmployee(emp: {
    employeeName: string;
    designation: Designation;
    email?: string;
    mobile?: string;
    password?: string;
    reportsToId?: string | number;
    reportsTo?: string;
    states?: string[];
    state?: string;
    territory?: string;
    headquarters?: string;
    zone?: string;
    region?: string;
    area?: string;
    joiningDate?: string;
    status?: 'Active' | 'Inactive';
    employeeCode?: string;
  }): Promise<Employee> {
    try {
      const response = await apiRequest<{ success: boolean; data: Employee }>('/sales-organization/employees', {
        method: 'POST',
        bodyData: emp
      });
      
      if (response.success && response.data) {
        this.updateLocalCache(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Failed to create employee on backend:', error);
      throw error;
    }

    throw new Error('Failed to create employee');
  }

  buildOrganizationTree(): OrganizationNode {
    const employees = this.getLocalEmployees();

    const root: OrganizationNode = {
      id: 'root-owner',
      employeeCode: 'OWNER-001',
      employeeName: 'Owner / Super Admin',
      designation: 'Owner / Super Admin',
      reportsTo: 'Board',
      zone: 'All India',
      region: 'National',
      state: 'All States',
      territory: 'National',
      area: 'Headquarters',
      status: 'Active',
      children: [],
    };

    const map = new Map<string, OrganizationNode>();
    
    // First map all employees to nodes
    employees.forEach((emp) => {
      map.set(emp.id, {
        id: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: emp.employeeName,
        designation: emp.designation,
        reportsTo: emp.reportsTo,
        zone: emp.zone,
        region: emp.region,
        state: (emp as any).state,
        territory: (emp as any).territory,
        area: emp.area,
        headquarters: emp.headquarters || 'Main HQ',
        status: emp.status,
        children: [],
      });
    });

    // Build hierarchy
    employees.forEach((emp) => {
      const node = map.get(emp.id);
      if (!node) return;

      if (emp.reportsTo === 'Owner / Super Admin' || !emp.reportsTo) {
        root.children.push(node);
      } else {
        // Try finding by reportsToId first (strong relation), fallback to name
        let parentNode = undefined;
        if (emp.reportsToId) {
          parentNode = map.get(emp.reportsToId);
        }
        if (!parentNode) {
          const parentEmp = employees.find(e => e.employeeName === emp.reportsTo);
          if (parentEmp) parentNode = map.get(parentEmp.id);
        }

        if (parentNode) {
          parentNode.children.push(node);
        } else {
          // Fallback to root if parent not found or inactive
          root.children.push(node);
        }
      }
    });

    return root;
  }

  async updateEmployee(id: string | number, updated: Partial<Employee & { email?: string; mobile?: string; states?: string[]; password?: string }>): Promise<Employee | null> {
    try {
      const response = await apiRequest<{ success: boolean; data: Employee }>(`/sales-organization/employees/${id}`, {
        method: 'PUT',
        bodyData: updated
      });

      if (response.success && response.data) {
        this.updateLocalCache(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Failed to update employee on backend:', error);
      throw error;
    }

    return null;
  }

  async deactivateEmployee(id: string | number): Promise<boolean> {
    const emps = this.getLocalEmployees();
    const idx = emps.findIndex(e => String(e.id) === String(id));
    if (idx === -1) return false;
    
    emps[idx].status = 'Inactive';
    this.updateLocalCache(emps[idx]);
    return true;
  }

  async getOrganizationTree(): Promise<OrganizationNode[]> {
    return [this.buildOrganizationTree()];
  }

  async getMyTeam(): Promise<Employee[]> {
    const { currentName } = this.getLoggedInEmployee();
    const emps = this.getLocalEmployees();
    return emps.filter(e => e.reportsTo === currentName);
  }

  private mapBackendToEmployee(item: any): Employee {
    return {
      id: String(item.id),
      employeeCode: item.employeeCode || '',
      employeeName: item.name || item.employeeName || '',
      designation: item.designation as Designation,
      reportsTo: item.manager ? item.manager.name : (item.reportsTo || 'Owner / Super Admin'),
      reportsToId: item.reportsToId ? String(item.reportsToId) : undefined,
      zone: item.zone || '',
      region: item.region || '',
      state: item.state || '',
      territory: item.territory || '',
      area: item.area || '',
      headquarters: item.headquarters || '',
      joiningDate: item.joiningDate ? item.joiningDate.split('T')[0] : '',
      status: (item.status === 'Active' || item.status === true) ? 'Active' : 'Inactive',
      email: item.email || item.user?.email || '',
      mobile: item.mobile || item.user?.mobile || '',
      ...(item.states ? { states: item.states } : {}),
    } as any;
  }

  // --- Centralized Hierarchy & Auth Helpers ---

  getLoggedInEmployee() {
    const activeRole = localStorage.getItem('activeRole');
    const authUserStr = localStorage.getItem('authUser');
    const authUser = authUserStr ? JSON.parse(authUserStr) : null;
    const allEmployees = this.getLocalEmployees();
    
    let currentRole = 'Super Admin';
    let currentName = 'Super Admin';
    let currentEmpId = '';

    if (authUser) {
      currentRole = authUser.roleId || authUser.role || 'SUPER_ADMIN';
      currentName = authUser.fullName || authUser.name || authUser.adminName || 'Super Admin';
      currentEmpId = authUser.employeeId || '';
    } else if (activeRole) {
      currentRole = activeRole;
      if (activeRole === 'SUPER_ADMIN' || activeRole === 'Super Admin') {
        currentName = 'Super Admin';
      } else {
        // Fallback for mocked roles
        let targetDesignation = 'National Sales Head';
        if (activeRole === 'RSM') targetDesignation = 'Regional Sales Manager';
        else if (activeRole === 'ASM') targetDesignation = 'Area Sales Manager';
        else if (activeRole === 'MR') targetDesignation = 'Medical Representative';

        const mockEmp = allEmployees.find(e => e.designation === targetDesignation && e.status === 'Active');
        if (mockEmp) {
          currentName = mockEmp.employeeName;
          currentEmpId = mockEmp.id;
        }
      }
    }

    if (currentName !== 'Super Admin') {
      const loggedInEmp = allEmployees.find(e => e.employeeName === currentName);
      if (loggedInEmp) currentEmpId = String(loggedInEmp.id);
    }

    const employee = allEmployees.find(e => e.id === currentEmpId);

    return { 
      currentRole, 
      currentName, 
      currentEmpId, 
      isSuperAdmin: currentRole === 'SUPER_ADMIN' || currentRole === 'Super Admin',
      employee
    };
  }

  getSubordinates(managerId: string, managerName: string, isSuperAdmin: boolean, targetDesignation?: Designation): Employee[] {
    let allEmployees = this.getLocalEmployees();
    if (targetDesignation) {
      allEmployees = allEmployees.filter(emp => emp.designation === targetDesignation);
    }
    
    if (isSuperAdmin) {
      return allEmployees;
    }

    return allEmployees.filter(emp => 
      (emp.reportsToId && emp.reportsToId === managerId) || 
      (emp.reportsTo && emp.reportsTo === managerName)
    );
  }

  async getAllSubordinates(managerId: string, managerName: string, isSuperAdmin: boolean): Promise<Employee[]> {
    let allEmployees = this.getLocalEmployees();
    
    // Fetch live employees from backend
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>('/sales-organization/employees');
      if (res.success && res.data) {
        allEmployees = res.data.map(item => this.mapBackendToEmployee(item));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allEmployees));
      }
    } catch (err) {
      console.error("Failed to fetch live employees from backend", err);
    }
    
    if (isSuperAdmin) {
      return allEmployees;
    }

    const subordinates: Employee[] = [];
    const visited = new Set<string>();

    const traverse = (currentId: string, currentName: string) => {
      // Use both ID and name as key to avoid loops
      const key = `${currentId}-${currentName}`;
      if (visited.has(key)) return;
      visited.add(key);

      const directReports = allEmployees.filter(emp => 
        (emp.reportsToId && String(emp.reportsToId) === String(currentId)) || 
        (!emp.reportsToId && emp.reportsTo && emp.reportsTo === currentName)
      );

      for (const emp of directReports) {
        if (!subordinates.find(s => String(s.id) === String(emp.id))) {
          subordinates.push(emp);
          traverse(emp.id, emp.employeeName);
        }
      }
    };

    traverse(managerId, managerName);
    return subordinates;
  }

  getInheritedTerritory(managerId: string | undefined): { zone: string; region: string; state: string; territory: string; area: string; headquarters: string } {
    const defaultTerritory = { zone: 'All India', region: 'National', state: '', territory: '', area: '', headquarters: '' };
    if (!managerId) return defaultTerritory;
    
    const allEmployees = this.getLocalEmployees();
    const manager = allEmployees.find(e => e.id === managerId);
    if (!manager) return defaultTerritory;

    return {
      zone: manager.zone || defaultTerritory.zone,
      region: manager.region || defaultTerritory.region,
      state: manager.state || '',
      territory: manager.territory || '',
      area: manager.area || '',
      headquarters: manager.headquarters || ''
    };
  }
}

export const employeeService = new EmployeeService();
