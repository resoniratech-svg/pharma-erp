export interface UserRole {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  username?: string;
  password?: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Locked';
  lastLogin: string;
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
}

export const seedUsers: UserRole[] = [
  { id: 'EMP001', name: 'Ramesh Patel', email: 'ramesh@pharma.com', mobile: '9876543210', username: 'ramesh.p', password: '1234', role: 'Super Admin', status: 'Active', lastLogin: 'Today, 09:15 AM', createdBy: 'System', createdDate: '01-Jan-2026', modifiedBy: 'System', modifiedDate: '01-Jan-2026' },
  { id: 'EMP002', name: 'Suresh Kumar', email: 'suresh@pharma.com', mobile: '9876543211', username: 'suresh.k', password: '1234', role: 'Warehouse Manager', status: 'Active', lastLogin: 'Today, 10:30 AM', createdBy: 'System', createdDate: '02-Jan-2026', modifiedBy: 'System', modifiedDate: '02-Jan-2026' },
  { id: 'EMP003', name: 'Amit Singh', email: 'amit@pharma.com', mobile: '9876543212', username: 'amit.s', password: '1234', role: 'Accountant', status: 'Active', lastLogin: '12-Oct-2026', createdBy: 'System', createdDate: '03-Jan-2026', modifiedBy: 'System', modifiedDate: '03-Jan-2026' },
  { id: 'EMP004', name: 'Priya Sharma', email: 'priya@pharma.com', mobile: '9876543213', username: 'priya.s', password: '1234', role: 'Distributor', status: 'Active', lastLogin: 'Yesterday, 04:45 PM', createdBy: 'System', createdDate: '04-Jan-2026', modifiedBy: 'System', modifiedDate: '04-Jan-2026' },
  { id: 'EMP005', name: 'John Doe', email: 'john@pharma.com', mobile: '9876543214', username: 'john.d', password: '1234', role: 'Retailer', status: 'Active', lastLogin: 'Yesterday, 05:00 PM', createdBy: 'System', createdDate: '05-Jan-2026', modifiedBy: 'System', modifiedDate: '05-Jan-2026' },
  { id: 'emp-nsm-1', name: 'Rajesh Sharma', email: 'nsm@pharmaerp.com', mobile: '9876543215', username: 'rajesh.s', password: '1234', role: 'National Sales Head', status: 'Active', lastLogin: 'Today, 08:00 AM', createdBy: 'System', createdDate: '06-Jan-2026', modifiedBy: 'System', modifiedDate: '06-Jan-2026' },

  { id: 'emp-rsm-1', name: 'Amitabh Verma', email: 'rsm@pharmaerp.com', mobile: '9876543217', username: 'amitabh.v', password: '1234', role: 'Regional Sales Manager', status: 'Active', lastLogin: 'Today, 09:00 AM', createdBy: 'System', createdDate: '06-Jan-2026', modifiedBy: 'System', modifiedDate: '06-Jan-2026' },
  { id: 'emp-asm-1', name: 'Gaurav Kapoor', email: 'asm@pharmaerp.com', mobile: '9876543218', username: 'gaurav.k', password: '1234', role: 'Area Sales Manager', status: 'Active', lastLogin: 'Today, 09:15 AM', createdBy: 'System', createdDate: '06-Jan-2026', modifiedBy: 'System', modifiedDate: '06-Jan-2026' },
  { id: 'emp-mr-1', name: 'Deepak Tyagi', email: 'mr@pharmaerp.com', mobile: '9876543219', username: 'deepak.t', password: '1234', role: 'Medical Representative', status: 'Active', lastLogin: 'Today, 09:30 AM', createdBy: 'System', createdDate: '06-Jan-2026', modifiedBy: 'System', modifiedDate: '06-Jan-2026' }
];
