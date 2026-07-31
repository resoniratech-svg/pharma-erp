import { employeeService } from './employeeService';
import { territoryService } from './territoryService';
import { targetService } from './targetService';
import type { Employee, Territory, SalesTarget, OrganizationNode } from '../modules/super-admin/sales-organization/types';

class SalesOrganizationService {
  // --- Employees CRUD ---
  getEmployees(): Employee[] {
    return employeeService.getEmployees();
  }

  addEmployee(emp: Omit<Employee, 'id'>): Employee {
    return employeeService.addEmployee(emp);
  }

  updateEmployee(id: string, updated: Partial<Employee>): Employee | null {
    return employeeService.updateEmployee(id, updated);
  }

  deactivateEmployee(id: string): boolean {
    return employeeService.deactivateEmployee(id);
  }

  // --- Hierarchy Tree Helper ---
  getOrganizationTree(): OrganizationNode {
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
