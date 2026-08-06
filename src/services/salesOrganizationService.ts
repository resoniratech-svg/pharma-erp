import { employeeService } from './employeeService';
import { territoryService } from './territoryService';
import { targetService } from './targetService';
import type { Employee, Territory, SalesTarget, OrganizationNode } from '../modules/super-admin/sales-organization/types';

class SalesOrganizationService {
  // --- Employees CRUD ---
  async getEmployees(): Promise<Employee[]> {
    return employeeService.getEmployees();
  }

  async addEmployee(emp: any): Promise<Employee> {
    return employeeService.addEmployee(emp);
  }

  async updateEmployee(id: string, updated: any): Promise<Employee | null> {
    return employeeService.updateEmployee(id, updated);
  }

  async deactivateEmployee(id: string): Promise<boolean> {
    return employeeService.deactivateEmployee(id);
  }

  // --- Hierarchy Tree Helper ---
  async getOrganizationTree(): Promise<OrganizationNode[]> {
    return employeeService.getOrganizationTree();
  }

  // --- Territories CRUD ---
  getTerritories(): Territory[] {
    return territoryService.getAdminTerritories();
  }

  addTerritory(ter: Omit<Territory, 'id'>): Territory {
    return territoryService.addAdminTerritory(ter);
  }

  updateTerritory(id: string, updated: Partial<Territory>): Territory | null {
    return territoryService.updateAdminTerritory(id, updated);
  }

  deactivateTerritory(id: string): boolean {
    return territoryService.deactivateAdminTerritory(id);
  }

  // --- Sales Targets CRUD ---
  getTargets(): SalesTarget[] {
    return targetService.getAdminTargets();
  }

  addTarget(tgt: Omit<SalesTarget, 'id'>): SalesTarget {
    return targetService.addAdminTarget(tgt);
  }

  updateTarget(id: string, updated: Partial<SalesTarget>): SalesTarget | null {
    return targetService.updateAdminTarget(id, updated);
  }

  deactivateTarget(id: string): boolean {
    return targetService.deactivateAdminTarget(id);
  }
}

export const salesOrganizationService = new SalesOrganizationService();
