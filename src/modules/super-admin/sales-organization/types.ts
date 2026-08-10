export type Designation = 
  | 'National Sales Head'
  | 'Regional Sales Manager'
  | 'Area Sales Manager'
  | 'Medical Representative';

export interface Employee {
  id: string;
  employeeCode: string;
  employeeName: string;
  designation: Designation;
  reportsTo: string; // Employee Name or ID or 'Owner / Super Admin'
  reportsToId?: string;
  zone: string;
  region: string;
  state: string;
  territory: string;
  area: string;
  headquarters: string;
  joiningDate: string;
  status: 'Active' | 'Inactive';
}

export interface OrganizationNode {
  id: string;
  employeeCode: string;
  employeeName: string;
  designation: Designation | string;
  reportsTo: string;
  zone: string;
  region: string;
  area: string;
  headquarters?: string;
  status: 'Active' | 'Inactive';
  children: OrganizationNode[];
}

export interface Territory {
  id: string;
  territoryCode: string;
  zone: string;
  region: string;
  area: string;
  headquarters: string;
  assignedManager: string;
  status: 'Active' | 'Inactive';
}

export interface SalesTarget {
  id: string;
  financialYear: string;
  targetType: 'Monthly' | 'Quarterly' | 'Annual' | string;
  employeeId: string;
  employeeName: string;
  targetAmount: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Inactive';
}

// Runtime stubs for Vite dev server HMR / browser module resolution
export const Designation = {};
export const Employee = {};
export const OrganizationNode = {};
export const Territory = {};
export const SalesTarget = {};
