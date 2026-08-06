import { apiRequest } from './apiClient';
import type { Employee, Designation, OrganizationNode } from '../modules/super-admin/sales-organization/types';

export const DESIGNATION_HIERARCHY: Record<Designation | 'Owner / Super Admin', number> = {
  'Owner / Super Admin': 6,
  'National Sales Head': 5,
  'Regional Sales Manager': 4,
  'Area Sales Manager': 3,
  'Medical Representative': 2,
};

class EmployeeService {
  async getEmployees(params?: { designation?: string; reportsToId?: string | number; status?: string }): Promise<Employee[]> {
    const query = new URLSearchParams();
    if (params?.designation) query.append('designation', params.designation);
    if (params?.reportsToId) query.append('reportsToId', String(params.reportsToId));
    if (params?.status) query.append('status', params.status);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await apiRequest<{ success: boolean; data: any[] }>(`/sales-organization/employees${queryString}`);
    
    if (!res.success || !res.data) return [];
    
    return res.data.map(item => this.mapBackendToEmployee(item));
  }

  async getEmployeeById(id: string | number): Promise<Employee | undefined> {
    const res = await apiRequest<{ success: boolean; data: any }>(`/sales-organization/employees/${id}`);
    if (!res.success || !res.data) return undefined;
    return this.mapBackendToEmployee(res.data);
  }

  async addEmployee(emp: {
    employeeName: string;
    designation: Designation;
    email?: string;
    mobile?: string;
    password?: string;
    reportsToId?: string | number;
    states?: string[];
    headquarters?: string;
    zone?: string;
    region?: string;
    area?: string;
    joiningDate?: string;
    status?: 'Active' | 'Inactive';
  }): Promise<Employee> {
    const res = await apiRequest<{ success: boolean; data: any }>('/sales-organization/employees', {
      method: 'POST',
      bodyData: {
        employeeName: emp.employeeName,
        designation: emp.designation,
        email: emp.email,
        mobile: emp.mobile,
        password: emp.password,
        reportsToId: emp.reportsToId ? Number(emp.reportsToId) : null,
        states: emp.states || [],
        headquarters: emp.headquarters,
        zone: emp.zone,
        region: emp.region,
        area: emp.area,
        joiningDate: emp.joiningDate,
        status: emp.status || 'Active',
      }
    });

    if (!res.success || !res.data) {
      throw new Error((res as any).message || 'Failed to create employee');
    }
    return this.mapBackendToEmployee(res.data);
  }

  async updateEmployee(id: string | number, updated: Partial<Employee & { email?: string; mobile?: string; states?: string[]; password?: string }>): Promise<Employee | null> {
    const res = await apiRequest<{ success: boolean; data: any }>(`/sales-organization/employees/${id}`, {
      method: 'PUT',
      bodyData: {
        employeeName: updated.employeeName,
        designation: updated.designation,
        email: updated.email,
        mobile: updated.mobile,
        password: updated.password,
        reportsToId: updated.reportsToId ? Number(updated.reportsToId) : undefined,
        states: updated.states,
        headquarters: updated.headquarters,
        zone: updated.zone,
        region: updated.region,
        area: updated.area,
        joiningDate: updated.joiningDate,
        status: updated.status,
      }
    });

    if (!res.success || !res.data) {
      throw new Error((res as any).message || 'Failed to update employee');
    }
    return this.mapBackendToEmployee(res.data);
  }

  async deactivateEmployee(id: string | number): Promise<boolean> {
    const res = await apiRequest<{ success: boolean }>(`/sales-organization/employees/${id}`, {
      method: 'DELETE',
    });
    return res.success;
  }

  async getOrganizationTree(): Promise<OrganizationNode> {
    const res = await apiRequest<{ success: boolean; data: any }>('/sales-organization/tree');
    if (!res.success || !res.data) {
      return {
        id: 'root',
        employeeCode: 'OWNER-001',
        employeeName: 'Owner / Super Admin',
        designation: 'Owner / Super Admin',
        reportsTo: 'Board',
        zone: 'All India',
        region: 'National',
        area: 'Headquarters',
        status: 'Active',
        children: [],
      };
    }
    return res.data;
  }

  async getMyTeam(): Promise<Employee[]> {
    const res = await apiRequest<{ success: boolean; data: any[] }>('/sales-organization/my-team');
    if (!res.success || !res.data) return [];
    return res.data.map(item => this.mapBackendToEmployee(item));
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
      area: item.area || '',
      headquarters: item.headquarters || '',
      joiningDate: item.joiningDate ? item.joiningDate.split('T')[0] : '',
      status: (item.status === 'Active' || item.status === true) ? 'Active' : 'Inactive',
      email: item.email || item.user?.email || '',
      mobile: item.mobile || item.user?.mobile || '',
      ...(item.states ? { states: item.states } : {}),
    } as any;
  }
}

export const employeeService = new EmployeeService();
