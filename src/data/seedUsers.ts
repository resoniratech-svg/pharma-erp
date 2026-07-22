export type UserRole = 
  | 'Super Admin' 
  | 'Warehouse Manager' 
  | 'Accountant' 
  | 'Distributor' 
  | 'Retailer' 
  | 'Medical Representative' 
  | 'Transport Staff';

export interface SeedUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  avatar?: string;
  department?: string;
  lastLogin?: string;
}

export const seedUsers: SeedUser[] = [
  {
    id: 'USR-001',
    name: 'System Administrator',
    email: 'superadmin@pharmaerp.com',
    password: '1234',
    role: 'Super Admin',
    status: 'Active',
    department: 'Management',
    lastLogin: '21-Jul-2026 16:30'
  },
  {
    id: 'USR-001B',
    name: 'System Administrator',
    email: 'admin@pharma.com',
    password: '1234',
    role: 'Super Admin',
    status: 'Active',
    department: 'Management',
    lastLogin: '21-Jul-2026 16:30'
  },
  {
    id: 'USR-002',
    name: 'Rajesh Kumar',
    email: 'warehouse@pharmaerp.com',
    password: '1234',
    role: 'Warehouse Manager',
    status: 'Active',
    department: 'Logistics & Warehouse',
    lastLogin: '21-Jul-2026 14:15'
  },
  {
    id: 'USR-002B',
    name: 'Rajesh Kumar',
    email: 'warehouse@pharma.com',
    password: '1234',
    role: 'Warehouse Manager',
    status: 'Active',
    department: 'Logistics & Warehouse',
    lastLogin: '21-Jul-2026 14:15'
  },
  {
    id: 'USR-003',
    name: 'Priya Sharma',
    email: 'accountant@pharmaerp.com',
    password: '1234',
    role: 'Accountant',
    status: 'Active',
    department: 'Finance & Accounts',
    lastLogin: '21-Jul-2026 15:45'
  },
  {
    id: 'USR-003B',
    name: 'Priya Sharma',
    email: 'accountant@pharma.com',
    password: '1234',
    role: 'Accountant',
    status: 'Active',
    department: 'Finance & Accounts',
    lastLogin: '21-Jul-2026 15:45'
  },
  {
    id: 'USR-004',
    name: 'Apollo Pharmacy Store 5',
    email: 'distributor@pharmaerp.com',
    password: '1234',
    role: 'Distributor',
    status: 'Active',
    department: 'Distribution Network',
    lastLogin: '20-Jul-2026 18:00'
  },
  {
    id: 'USR-004B',
    name: 'Apollo Pharmacy Store 5',
    email: 'distributor@pharma.com',
    password: '1234',
    role: 'Distributor',
    status: 'Active',
    department: 'Distribution Network',
    lastLogin: '20-Jul-2026 18:00'
  },
  {
    id: 'USR-005',
    name: 'MedPlus Chemist Store',
    email: 'retailer@pharmaerp.com',
    password: '1234',
    role: 'Retailer',
    status: 'Active',
    department: 'Retail Network',
    lastLogin: '21-Jul-2026 10:20'
  },
  {
    id: 'USR-005B',
    name: 'MedPlus Chemist Store',
    email: 'retailer@pharma.com',
    password: '1234',
    role: 'Retailer',
    status: 'Active',
    department: 'Retail Network',
    lastLogin: '21-Jul-2026 10:20'
  },
  {
    id: 'USR-006',
    name: 'Dr. Sai Medical Rep',
    email: 'mr@pharmaerp.com',
    password: '1234',
    role: 'Medical Representative',
    status: 'Active',
    department: 'Field Sales',
    lastLogin: '21-Jul-2026 11:00'
  },
  {
    id: 'USR-006B',
    name: 'Dr. Sai Medical Rep',
    email: 'mr@pharma.com',
    password: '1234',
    role: 'Medical Representative',
    status: 'Active',
    department: 'Field Sales',
    lastLogin: '21-Jul-2026 11:00'
  }
];
