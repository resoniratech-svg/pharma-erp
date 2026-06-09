import {
  ROLE_SUPER_ADMIN,
  ROLE_WAREHOUSE_MANAGER,
  ROLE_ACCOUNTANT,
  ROLE_DISTRIBUTOR,
  ROLE_RETAILER,
  ROLE_MEDICAL_REPRESENTATIVE,
  ROLE_TRANSPORT_STAFF,
} from './roles';

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

export const USERS: UserRecord[] = [
  {
    id: 'usr_001',
    fullName: 'System Administrator',
    email: 'superadmin@pharmaerp.com',
    password: '1234',
    mobile: '+91 90000 00001',
    employeeCode: 'ADM-001',
    department: 'IT & Administration',
    roleId: ROLE_SUPER_ADMIN,
  },
  {
    id: 'usr_002',
    fullName: 'Rahul Sharma',
    email: 'warehouse@pharmaerp.com',
    password: '1234',
    mobile: '+91 90000 00002',
    employeeCode: 'WH-1042',
    department: 'Operations & Logistics',
    roleId: ROLE_WAREHOUSE_MANAGER,
  },
  {
    id: 'usr_003',
    fullName: 'Sneha Verma',
    email: 'accounts@pharmaerp.com',
    password: '1234',
    mobile: '+91 90000 00003',
    employeeCode: 'FIN-203',
    department: 'Finance & Accounting',
    roleId: ROLE_ACCOUNTANT,
  },
  {
    id: 'usr_004',
    fullName: 'Amit Kumar',
    email: 'distributor@pharmaerp.com',
    password: '1234',
    mobile: '+91 90000 00004',
    employeeCode: 'DST-450',
    department: 'Distribution Channel',
    roleId: ROLE_DISTRIBUTOR,
  },
  {
    id: 'usr_005',
    fullName: 'Arun Patel',
    email: 'retailer@pharmaerp.com',
    password: '1234',
    mobile: '+91 90000 00005',
    employeeCode: 'RET-892',
    department: 'Retail Sales',
    roleId: ROLE_RETAILER,
  },
  {
    id: 'usr_006',
    fullName: 'Priya Reddy',
    email: 'mr@pharmaerp.com',
    password: '1234',
    mobile: '+91 90000 00006',
    employeeCode: 'MR-1120',
    department: 'Sales & Marketing',
    roleId: ROLE_MEDICAL_REPRESENTATIVE,
  },
  {
    id: 'usr_007',
    fullName: 'Vikram Singh',
    email: 'transport@pharmaerp.com',
    password: '1234',
    mobile: '+91 90000 00007',
    employeeCode: 'TRP-304',
    department: 'Logistics',
    roleId: ROLE_TRANSPORT_STAFF,
  },
];
