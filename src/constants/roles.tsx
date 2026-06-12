import {
  ShieldCheck,
  Warehouse,
  Calculator,
  Truck,
  ShoppingBag,
  UserCheck,
} from 'lucide-react';

export const ROLE_SUPER_ADMIN = 'SUPER_ADMIN';
export const ROLE_WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER';
export const ROLE_ACCOUNTANT = 'ACCOUNTANT';
export const ROLE_DISTRIBUTOR = 'DISTRIBUTOR';
export const ROLE_RETAILER = 'RETAILER';
export const ROLE_MEDICAL_REPRESENTATIVE = 'MEDICAL_REPRESENTATIVE';
export const ROLE_TRANSPORT_STAFF = 'TRANSPORT_STAFF';
export interface Role {
  id: string;
  title: string;
  description: string;
  Icon: React.ElementType;
  gradFrom: string;
  gradTo: string;
  accentHex: string;
  skeletonBar: string;
  skeletonBarLight: string;
  userName: string;
  userEmail: string;
  capabilities: string[];
}

export const ROLES: Role[] = [
  {
    id: ROLE_SUPER_ADMIN,
    title: 'Super Admin',
    description: 'Full ecosystem control, governance & analytics.',
    Icon: ShieldCheck,
    gradFrom: '#6366F1',
    gradTo: '#4F46E5',
    accentHex: '#6366F1',
    skeletonBar: 'bg-indigo-100',
    skeletonBarLight: 'bg-indigo-50',
    userName: 'System Administrator',
    userEmail: 'superadmin@pharmaerp.com',
    capabilities: [
      'Executive Dashboard',
      'Global Reports',
      'System Analytics',
      'Core Operations',
    ],
  },
  {
    id: ROLE_WAREHOUSE_MANAGER,
    title: 'Warehouse Manager',
    description: 'Stock, batches, dispatch & transfers.',
    Icon: Warehouse,
    gradFrom: '#10B981',
    gradTo: '#059669',
    accentHex: '#10B981',
    skeletonBar: 'bg-emerald-100',
    skeletonBarLight: 'bg-emerald-50',
    userName: 'Rahul Sharma',
    userEmail: 'warehouse@pharmaerp.com',
    capabilities: [
      'Inventory Dashboard',
      'Batch Records',
      'Stock Analytics',
      'Dispatch Operations',
    ],
  },
  {
    id: ROLE_ACCOUNTANT,
    title: 'Accountant',
    description: 'Ledgers, payments, GST & P&L.',
    Icon: Calculator,
    gradFrom: '#F59E0B',
    gradTo: '#D97706',
    accentHex: '#D97706',
    skeletonBar: 'bg-amber-100',
    skeletonBarLight: 'bg-amber-50',
    userName: 'Sneha Verma',
    userEmail: 'accounts@pharmaerp.com',
    capabilities: [
      'Financial Dashboard',
      'Taxation Reports',
      'Margin Analytics',
      'Payment Operations',
    ],
  },
  {
    id: ROLE_DISTRIBUTOR,
    title: 'Distributor',
    description: 'Catalog, orders, dispatch tracking.',
    Icon: Truck,
    gradFrom: '#06B6D4',
    gradTo: '#0891B2',
    accentHex: '#06B6D4',
    skeletonBar: 'bg-cyan-100',
    skeletonBarLight: 'bg-cyan-50',
    userName: 'Amit Kumar',
    userEmail: 'distributor@pharmaerp.com',
    capabilities: [
      'Catalog Dashboard',
      'Order Reports',
      'Fulfillment Analytics',
      'Supply Operations',
    ],
  },
  {
    id: ROLE_RETAILER,
    title: 'Retailer',
    description: 'Browse, reorder & manage invoices.',
    Icon: ShoppingBag,
    gradFrom: '#8B5CF6',
    gradTo: '#7C3AED',
    accentHex: '#8B5CF6',
    skeletonBar: 'bg-violet-100',
    skeletonBarLight: 'bg-violet-50',
    userName: 'Arun Patel',
    userEmail: 'retailer@pharmaerp.com',
    capabilities: [
      'Product Catalog',
      'Purchase Orders',
      'Invoice Tracking',
      'Reorder Management',
    ],
  },
  {
    id: ROLE_MEDICAL_REPRESENTATIVE,
    title: 'Medical Representative',
    description: 'Visits, tours, scheduling, GPS tracking.',
    Icon: UserCheck,
    gradFrom: '#14B8A6',
    gradTo: '#0D9488',
    accentHex: '#14B8A6',
    skeletonBar: 'bg-teal-100',
    skeletonBarLight: 'bg-teal-50',
    userName: 'Priya Reddy',
    userEmail: 'mr@pharmaerp.com',
    capabilities: [
      'Visit Dashboard',
      'Customer CRM',
      'Route Planning',
      'Performance Analytics',
    ],
  },
  {
    id: ROLE_TRANSPORT_STAFF,
    title: 'Transport Staff',
    description: 'Dispatch, challans & deliveries.',
    Icon: Truck,
    gradFrom: '#F43F5E',
    gradTo: '#E11D48',
    accentHex: '#E11D48',
    skeletonBar: 'bg-rose-100',
    skeletonBarLight: 'bg-rose-50',
    userName: 'Vikram Singh',
    userEmail: 'transport@pharmaerp.com',
    capabilities: [
      'Delivery Tracking',
      'Vehicle Routing',
      'Proof of Delivery',
      'Fleet Management',
    ],
  },
];
