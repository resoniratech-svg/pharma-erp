import type { Employee, Designation, OrganizationNode } from '../modules/super-admin/sales-organization/types';

const STORAGE_KEY = 'sales_org_employees';

// Default seeded list (moved from salesOrganizationService)
const SEED_EMPLOYEES: Employee[] = [
  { id: 'emp-nsm-1', employeeCode: 'EMP-NSM-001', employeeName: 'Rajesh Sharma', designation: 'National Sales Head', reportsTo: 'Owner / Super Admin', zone: 'All India', region: 'National', area: 'All India Headquarters', joiningDate: '2020-01-15', status: 'Active' },
  { id: 'emp-rsm-1', employeeCode: 'EMP-RSM-001', employeeName: 'Amitabh Verma', designation: 'Regional Sales Manager', reportsTo: 'Rajesh Sharma', reportsToId: 'emp-nsm-1', zone: 'North-East Zone', region: 'North Region', area: 'Delhi NCR', joiningDate: '2022-01-10', status: 'Active' },
  { id: 'emp-asm-1', employeeCode: 'EMP-ASM-001', employeeName: 'Gaurav Kapoor', designation: 'Area Sales Manager', reportsTo: 'Amitabh Verma', reportsToId: 'emp-rsm-1', zone: 'North-East Zone', region: 'North Region', area: 'South Delhi & Gurugram', joiningDate: '2022-06-01', status: 'Active' },
  { id: 'emp-mr-1', employeeCode: 'EMP-MR-001', employeeName: 'Deepak Tyagi', designation: 'Medical Representative', reportsTo: 'Gaurav Kapoor', reportsToId: 'emp-asm-1', zone: 'North-East Zone', region: 'North Region', area: 'South Delhi & Gurugram', joiningDate: '2023-03-01', status: 'Active' },
];

export const DESIGNATION_HIERARCHY: Record<Designation | 'Owner / Super Admin', number> = {
  'Owner / Super Admin': 6,
  'National Sales Head': 5,
  'Regional Sales Manager': 4,
  'Area Sales Manager': 3,
  'Medical Representative': 2,
  'Owner / Super Admin': 6,
  'National Sales Head': 5,
};

class EmployeeService {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_EMPLOYEES));
    }
  }

  getEmployees(): Employee[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  getEmployeeById(id: string): Employee | undefined {
    return this.getEmployees().find(e => e.id === id);
  }

  generateNextEmployeeCode(designation: Designation): string {
    const prefixMap: Record<Designation, string> = {
      'National Sales Head': 'EMP-NSM-',

      'Regional Sales Manager': 'EMP-RSM-',
      'Area Sales Manager': 'EMP-ASM-',
      'Medical Representative': 'EMP-MR-',
    };
    const prefix = prefixMap[designation];
    const emps = this.getEmployees();
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

  addEmployee(emp: Omit<Employee, 'id'>): Employee {
    const employees = this.getEmployees();
    
    // Validate Manager Level
    if (emp.designation !== 'National Sales Head') {
      const manager = employees.find(e => e.id === emp.reportsToId || e.employeeName === emp.reportsTo);
      if (!manager && emp.reportsTo !== 'Owner / Super Admin') {
        throw new Error("Invalid reporting manager.");
      }
      if (manager) {
        const empLevel = DESIGNATION_HIERARCHY[emp.designation];
        const mgrLevel = DESIGNATION_HIERARCHY[manager.designation];
        if (mgrLevel !== empLevel + 1) {
          throw new Error(`Manager must be exactly one level above. (${manager.designation} -> ${emp.designation})`);
        }
      }
    }

    const newEmp: Employee = {
      ...emp,
      id: `emp-${Date.now()}`,
    };
    employees.unshift(newEmp);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    return newEmp;
  }

  updateEmployee(id: string, updated: Partial<Employee>): Employee | null {
    const employees = this.getEmployees();
    const index = employees.findIndex((e) => e.id === id);
    if (index === -1) return null;

    // Validate Manager Level
    if (updated.designation || updated.reportsToId || updated.reportsTo) {
      const targetDesignation = updated.designation || employees[index].designation;
      const targetReportsToId = updated.reportsToId !== undefined ? updated.reportsToId : employees[index].reportsToId;
      const targetReportsTo = updated.reportsTo !== undefined ? updated.reportsTo : employees[index].reportsTo;

      if (targetDesignation !== 'National Sales Head') {
        const manager = employees.find(e => e.id === targetReportsToId || e.employeeName === targetReportsTo);
        if (manager) {
          const empLevel = DESIGNATION_HIERARCHY[targetDesignation];
          const mgrLevel = DESIGNATION_HIERARCHY[manager.designation];
          if (mgrLevel !== empLevel + 1) {
            throw new Error(`Manager must be exactly one level above. (${manager.designation} -> ${targetDesignation})`);
          }
        }
      }
    }

    employees[index] = { ...employees[index], ...updated };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    return employees[index];
  }

  hasActiveSubordinates(id: string): boolean {
    const employees = this.getEmployees();
    const emp = employees.find(e => e.id === id);
    if (!emp) return false;
    
    // Check if any active employee reports to this employee ID or Name
    return employees.some(e => 
      e.status === 'Active' && 
      (e.reportsToId === id || e.reportsTo === emp.employeeName)
    );
  }

  deactivateEmployee(id: string): boolean {
    if (this.hasActiveSubordinates(id)) {
      throw new Error("Cannot deactivate an employee who has active subordinates. Reassign subordinates first.");
    }
    
    const emp = this.updateEmployee(id, { status: 'Inactive' });
    return !!emp;
  }

  getOrganizationTree(): OrganizationNode {
    const employees = this.getEmployees();

    const root: OrganizationNode = {
      id: 'root-owner',
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
}

export const employeeService = new EmployeeService();
