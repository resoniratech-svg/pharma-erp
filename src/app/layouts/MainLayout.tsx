import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Box,
  ShoppingCart,
  Receipt,
  Users,
  Bell,
  Settings,
  
  Menu,
  X,
  ChevronRight,
  User,
  LogOut,
  UserCircle,
  Key,
  LifeBuoy,
  Package,
  ClipboardList,
  Calculator,
  ChevronDown,
  Navigation,
  HeartHandshake,
  Shield,
  TrendingUp,
  Compass,
  MapPin,
  CheckSquare,
  Target,
} from 'lucide-react';
import { hasPermission } from '../../constants/permissions';
import { normalizePurchasedModules } from '../../config/tenantConfig';
import NotificationDropdown from '../../components/NotificationDropdown';
import { ROLE_SUPER_ADMIN, ROLE_WAREHOUSE_MANAGER, ROLE_ACCOUNTANT, ROLE_DISTRIBUTOR, ROLE_RETAILER, ROLE_MEDICAL_REPRESENTATIVE, ROLE_TRANSPORT_STAFF, ROLES } from '../../constants/roles';
import mjLogo from '../../assets/logo/pharmaLOGO.png';

import { productService } from '../../services/productService';
import { warehouseService } from '../../services/warehouseService';
import { inventoryService } from '../../services/inventoryService';
import { batchService } from '../../services/batchService';

const PRIMARY_HEX = 'var(--color-brand-primary)';
const BG_HEX = 'var(--color-brand-light)';

export type NavItem = {
  label: string;
  path?: string;
  icon: React.ElementType;
  subItems?: { label: string; path: string; icon?: React.ElementType }[];
};

const NavModules = {
  SuperAdmin: {
    label: 'Super Admin',
    icon: Shield,
    subItems: [
      { label: 'Admin Management', path: '/workspace/super-admin/admin-management' },
      { label: 'Sales Organization', path: '/workspace/super-admin/sales-organization' },
      { label: 'All India Sales Dashboard', path: '/workspace/super-admin/all-india-sales' },
      { label: 'State Performance Reports', path: '/workspace/super-admin/state-performance' },
      { label: 'Product Profitability Reports', path: '/workspace/super-admin/product-profitability' },
      { label: 'Live Stock Monitoring', path: '/workspace/super-admin/live-stock-monitoring' },
      { label: 'Pending Payment Tracking', path: '/workspace/super-admin/pending-payment-tracking' },
      { label: 'Dispatch Monitoring', path: '/workspace/super-admin/dispatch-monitoring' },
      // { label: 'Franchise Monitoring', path: '/workspace/super-admin/franchise-monitoring' },
      // { label: 'Notification Center', path: '/workspace/super-admin/notification-center' },
      { label: 'Export Order Monitoring', path: '/workspace/super-admin/export-order-monitoring' },
      { label: 'User Activity Logs', path: '/workspace/super-admin/user-activity-logs' },
    ],
  },
  ProductManagement: {
    label: 'Product Management',
    icon: Package,
    subItems: [
      { label: 'HSN Master', path: '/workspace/products/hsn-master' },
      { label: 'GST Management', path: '/workspace/products/gst' },
      { label: 'Composition Management', path: '/workspace/products/compositions' },
      { label: 'Packing Type Management', path: '/workspace/products/packing-types' },
      { label: 'Scheme Management', path: '/workspace/products/schemes' },
      { label: 'Product Master Management', path: '/workspace/products/master' },
      { label: 'MRP Management', path: '/workspace/products/mrp-management' },
      { label: 'PTR / PTS / PTD Pricing', path: '/workspace/products/pricing' },
      { label: 'Barcode Management', path: '/workspace/products/barcodes' },
      { label: 'Batch Management', path: '/workspace/products/batches' },
      { label: 'Expiry Tracking', path: '/workspace/products/expiry-tracking' },
    ],
  },
  Inventory: {
    label: 'Inventory & Warehouse Management',
    icon: ClipboardList,
    subItems: [
      { label: 'Warehouse Master', path: '/workspace/inventory/warehouse-master' },
      { label: 'Multi-Location Inventory Management', path: '/workspace/inventory/multi-location' },
      { label: 'Batch-wise Stock Tracking', path: '/workspace/inventory/batch-wise-stock-tracking' },
      { label: 'Inward Stock Management', path: '/workspace/inventory/inward' },
      { label: 'Outward Stock Management', path: '/workspace/inventory/outward' },
      { label: 'Warehouse Transfer Management', path: '/workspace/inventory/transfer' },
      { label: 'Company-wise Inventory Tracking', path: '/workspace/inventory/company-wise-inventory-tracking' },
      { label: 'Dead Stock Tracking', path: '/workspace/inventory/dead-stock' },
      { label: 'Expiry Stock Tracking', path: '/workspace/inventory/expiry-stock' },
      { label: 'Low Stock Alerts', path: '/workspace/inventory/alerts' },
    ],
  },
  CFManagement: {
    label: 'C&F Management',
    icon: Box,
    subItems: [
      { label: 'Dispatch Management', path: '/workspace/warehouse/dispatch' },
      { label: 'Transport Challan Management', path: '/workspace/warehouse/challans' },
      { label: 'LR Number Tracking', path: '/workspace/warehouse/lr-tracking' },
      { label: 'Warehouse Transfer Tracking', path: '/workspace/warehouse/warehouse-transfer-tracking' },
      { label: 'Delivery Tracking', path: '/workspace/warehouse/delivery' },
      { label: 'Dispatch Reports', path: '/workspace/warehouse/reports' },
    ],
  },
  DistributorPortal: {
    label: 'Distributor/Stockist Portal',
    icon: Users,
    subItems: [
      { label: 'Distributor Master', path: '/workspace/distributors/master' },
      { label: 'Product Catalog Access', path: '/workspace/distributors/product-catalog' },
      { label: 'Current Stock', path: '/workspace/distributors/current-stock' },
      { label: 'Retailer Orders', path: '/workspace/distributors/retailer-orders' },
      { label: 'Distributor Orders', path: '/workspace/distributors/distributor-orders' },
      { label: 'Order Placement', path: '/workspace/distributors/orders' },
      { label: 'Outstanding Tracking', path: '/workspace/distributors/outstanding' },
      { label: 'Ledger Access', path: '/workspace/distributors/ledgers' },
      { label: 'Invoice Download', path: '/workspace/distributors/invoices' },
      { label: 'Scheme Visibility', path: '/workspace/distributors/schemes' },
      { label: 'Order History', path: '/workspace/distributors/order-history' },
      { label: 'Dispatch Tracking', path: '/workspace/distributors/dispatch-tracking' },
    ],
  },
  RetailerSystem: {
    label: 'Retailer Ordering System',
    icon: ShoppingCart,
    subItems: [
      { label: 'Retailer Master', path: '/workspace/retailers/master' },
      { label: 'Product Browsing', path: '/workspace/retailers/catalog' },
      { label: 'Offer Visibility', path: '/workspace/retailers/offers' },
      { label: 'Scheme Visibility', path: '/workspace/retailers/scheme-visibility' },
      { label: 'Order Placement', path: '/workspace/retailers/orders' },
      { label: 'Reorder Functionality', path: '/workspace/retailers/reorders' },
      { label: 'Invoice Access', path: '/workspace/retailers/invoices' },
      { label: 'Payment Tracking', path: '/workspace/retailers/payments' },
    ],
  },
  MR: {
    label: 'MR (Medical Representative)',
    icon: Users,
    subItems: [
      { label: 'My Targets', path: '/workspace/mr/my-targets', icon: Target },
      { label: 'Doctor Visit Entry', path: '/workspace/mr/doctors' },
      { label: 'Chemist Visit Entry', path: '/workspace/mr/chemists' },
      { label: 'Order Booking', path: '/workspace/mr/orders' },
      { label: 'Daily Reporting', path: '/workspace/mr/dcr' },
      { label: 'Target Tracking', path: '/workspace/mr/targets' },
      { label: 'Tour Planning', path: '/workspace/mr/mtp' },
      { label: 'Meeting Scheduling', path: '/workspace/mr/meetings' },
      { label: 'Activity Tracking', path: '/workspace/mr/activity-tracking' },
    ],
  },
  GPS: {
    label: 'GPS & Location Tracking',
    icon: Navigation,
    subItems: [
      { label: 'GPS Attendance', path: '/workspace/gps/attendance' },
      { label: 'Check In', path: '/workspace/gps/check-in' },
      { label: 'Check Out', path: '/workspace/gps/check-out' },
      { label: 'Geo Tagged Doctor Visits', path: '/workspace/gps/geo-tagged-doctor-visits' },
      { label: 'Geo Tagged Chemist Visits', path: '/workspace/gps/geo-tagged-chemist-visits' },
      { label: 'Route History', path: '/workspace/gps/history' },
      { label: 'Territory Tracking', path: '/workspace/gps/territory' },
      { label: 'Daily Movement Tracking', path: '/workspace/gps/live' },
      { label: 'Meeting/Event Location Tracking', path: '/workspace/gps/meeting-location-tracking' },
    ],
  },
  CRM: {
    label: 'Pre-Sales CRM',
    icon: HeartHandshake,
    subItems: [
      { label: 'Lead Creation', path: '/workspace/crm/leads' },
      { label: 'Lead Assignment', path: '/workspace/crm/lead-assignment' },
      { label: 'Lead Pipeline Tracking', path: '/workspace/crm/lead-pipeline-tracking' },
      { label: 'Follow-Up Management', path: '/workspace/crm/follow-ups' },
      { label: 'Meeting Scheduling', path: '/workspace/crm/meetings' },
      { label: 'Activity Tracking', path: '/workspace/crm/activities' },
      { label: 'Lead Conversion Tracking', path: '/workspace/crm/lead-conversion-tracking' },
      { label: 'Doctor/Hospital CRM', path: '/workspace/crm/doctors' },
      { label: 'Distributor Onboarding CRM', path: '/workspace/crm/distributors' },
      { label: 'Sales Activity Monitoring', path: '/workspace/crm/pipeline' },
    ],
  },
  Accounting: {
    label: 'Accounting & Finance',
    icon: Calculator,
    subItems: [
      { label: 'Party Ledger', path: '/workspace/finance/ledger' },
      { label: 'Outstanding Tracking', path: '/workspace/finance/outstanding' },
      { label: 'Outstanding Aging', path: '/workspace/finance/aging' },
      { label: 'Payment Tracking', path: '/workspace/finance/payments' },
      { label: 'Commission System', path: '/workspace/finance/commission' },
      { label: 'Profit & Loss', path: '/workspace/finance/pnl' },
      { label: 'Balance Sheet', path: '/workspace/finance/balance-sheet' },
      { label: 'GST Reports', path: '/workspace/finance/gst-reports' },
      { label: 'Bank Reconciliation', path: '/workspace/finance/bank-reco' },
    ],
  },
  Billing: {
    label: 'Wholesale Billing System',
    icon: Receipt,
    subItems: [
      { label: 'GST Billing', path: '/workspace/billing/gst' },
      { label: 'E-Invoice Support', path: '/workspace/billing/einvoice' },
      { label: 'Barcode Billing', path: '/workspace/billing/pos' },
      { label: 'Credit Note', path: '/workspace/billing/credit-notes' },
      { label: 'Sales Return', path: '/workspace/billing/sales-returns' },
      { label: 'Expiry Return', path: '/workspace/billing/expiry-returns' },
      { label: 'Multi Rate Billing', path: '/workspace/billing/multi-rate-billing' },
    ],
  },
  Alerts: {
    label: 'Alerts & Notifications',
    icon: Bell,
    subItems: [
      { label: 'Payment Reminders', path: '/workspace/notifications/payments' },
      { label: 'Meeting Reminders', path: '/workspace/notifications/meeting-reminders' },
      { label: 'Follow-Up Reminders', path: '/workspace/notifications/followup-reminders' },
      { label: 'Expiry Alerts', path: '/workspace/notifications/expiry' },
      { label: 'Auto Reorder Alerts', path: '/workspace/notifications/reorder' },
      { label: 'Dispatch Alerts', path: '/workspace/notifications/dispatch' },
      { label: 'Activity Notifications', path: '/workspace/notifications/activity' },
    ],
  },
  Settings: {
    label: 'Settings',
    icon: Settings,
    subItems: [
      { label: 'Profile Settings', path: '/workspace/settings/profile' },
      { label: 'User Management', path: '/workspace/settings/users' },
      { label: 'Roles & Permissions', path: '/workspace/settings/roles' },
    ],
  },
};

const ROLE_NAV_MAP: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    NavModules.SuperAdmin,
    NavModules.ProductManagement,
    NavModules.Inventory,
    NavModules.CFManagement,
    NavModules.DistributorPortal,
    NavModules.RetailerSystem,
    NavModules.MR,
    NavModules.GPS,
    NavModules.CRM,
    NavModules.Accounting,
    NavModules.Billing,
    NavModules.Alerts,
    NavModules.Settings,
  ],
  NATIONAL_SALES_HEAD: [
    { 
      label: 'Sales Operations', 
      icon: TrendingUp, 
      subItems: [
        { label: 'Sales Organization', path: '/workspace/national-sales-head/sales-organization' },
        { label: 'Target Allocation', path: '/workspace/national-sales-head/target-allocation' },
        { label: 'Team Performance', path: '/workspace/national-sales-head/team-performance' },
        { label: 'National Sales Analytics', path: '/workspace/national-sales-head/analytics' }
      ]
    },
    {
      label: 'Reports',
      icon: ClipboardList,
      subItems: [
        { label: 'National Sales Reports', path: '/workspace/national-sales-head/reports' }
      ]
    },
    NavModules.Alerts,
    {
      label: 'Settings',
      icon: Settings,
      subItems: [
        { label: 'Profile Settings', path: '/workspace/settings/profile' }
      ]
    }
  ],
  ZONAL_SALES_MANAGER: [
    { 
      label: 'Sales Operations', 
      icon: TrendingUp, 
      subItems: [
        { label: 'Sales Organization', path: '/workspace/zonal-sales-manager/sales-organization' },
        { label: 'Target Allocation', path: '/workspace/zonal-sales-manager/target-allocation' },
        { label: 'Team Performance', path: '/workspace/zonal-sales-manager/team-performance' },
        { label: 'Zone Analytics', path: '/workspace/zonal-sales-manager/zone-analytics' }
      ]
    },
    {
      label: 'Reports',
      icon: ClipboardList,
      subItems: [
        { label: 'Zone Reports', path: '/workspace/zonal-sales-manager/zone-reports' }
      ]
    },
    {
      label: 'Settings',
      icon: Settings,
      subItems: [
        { label: 'Profile Settings', path: '/workspace/settings/profile' }
      ]
    }
  ],
  REGIONAL_SALES_MANAGER: [
    { 
      label: 'Sales Operations', 
      icon: TrendingUp, 
      subItems: [
        { label: 'Sales Organization', path: '/workspace/regional-sales-manager/sales-organization' },
        { label: 'Target Allocation', path: '/workspace/regional-sales-manager/target-allocation' },
        { label: 'Team Performance', path: '/workspace/regional-sales-manager/team-performance' },
        { label: 'Regional Analytics', path: '/workspace/regional-sales-manager/regional-analytics' }
      ]
    },
    {
      label: 'Reports',
      icon: ClipboardList,
      subItems: [
        { label: 'Regional Reports', path: '/workspace/regional-sales-manager/regional-reports' }
      ]
    },
    {
      label: 'Settings',
      icon: Settings,
      subItems: [
        { label: 'Profile Settings', path: '/workspace/settings/profile' }
      ]
    }
  ],
  AREA_SALES_MANAGER: [
    { 
      label: 'Sales Operations', 
      icon: TrendingUp, 
      subItems: [
        { label: 'Sales Organization', path: '/workspace/area-sales-manager/sales-organization' },
        { label: 'Target Allocation', path: '/workspace/area-sales-manager/target-allocation' },
        { label: 'Team Performance', path: '/workspace/area-sales-manager/team-performance' },
        { label: 'Area Analytics', path: '/workspace/area-sales-manager/area-analytics' }
      ]
    },
    {
      label: 'Approvals & Monitoring',
      icon: CheckSquare,
      subItems: [
        { label: 'Tour Plan Review', path: '/workspace/area-sales-manager/tour-plan-review' },
        { label: 'Daily Call Reports', path: '/workspace/area-sales-manager/dcr-review' },
        { label: 'Attendance Monitoring', path: '/workspace/area-sales-manager/attendance-monitoring' }
      ]
    },
    {
      label: 'Reports',
      icon: ClipboardList,
      subItems: [
        { label: 'Area Reports', path: '/workspace/area-sales-manager/area-reports' }
      ]
    },
    {
      label: 'Settings',
      icon: Settings,
      subItems: [
        { label: 'Profile Settings', path: '/workspace/settings/profile' }
      ]
    }
  ],
  WAREHOUSE_MANAGER: [
    NavModules.Inventory,
    NavModules.CFManagement,
    NavModules.Alerts,
    NavModules.Settings
  ],
  ACCOUNTANT: [
    NavModules.Billing,
    NavModules.Accounting,
    NavModules.Alerts,
    NavModules.Settings
  ],
  DISTRIBUTOR: [
    NavModules.DistributorPortal,
    NavModules.Alerts,
    NavModules.Settings
  ],
  RETAILER: [
    NavModules.RetailerSystem,
    NavModules.Alerts,
    NavModules.Settings
  ],
  MEDICAL_REPRESENTATIVE: [
    NavModules.MR,
    NavModules.GPS,
    NavModules.CRM,
    NavModules.Alerts,
    NavModules.Settings
  ]
};

const getDashboardRoute = (roleId: string) => {
  switch (roleId) {
    case 'SUPER_ADMIN': return '/workspace/dashboard';
    case 'NATIONAL_SALES_HEAD': return '/workspace/national-sales-head';
    case 'ZONAL_SALES_MANAGER': return '/workspace/zonal-sales-manager';
    case 'REGIONAL_SALES_MANAGER': return '/workspace/regional-sales-manager';
    case 'AREA_SALES_MANAGER': return '/workspace/area-sales-manager';
    case 'WAREHOUSE_MANAGER': return '/workspace/dashboard';
    case 'ACCOUNTANT': return '/workspace/dashboard';
    case 'DISTRIBUTOR': return '/workspace/dashboard';
    case 'RETAILER': return '/workspace/dashboard';
    case 'MEDICAL_REPRESENTATIVE': return '/workspace/dashboard';
    default: return '/workspace/dashboard';
  }
};

/* ── Components ──────────────────────────────────────────────────── */

// Generic Breadcrumbs based on route
const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  let matchedLabel = '';
  let matchedParentLabel = '';
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
  const dashboardRoute = getDashboardRoute(activeRole);
  
  const dashboardNavItem: NavItem = { 
    label: 'Dashboard', 
    path: dashboardRoute, 
    icon: LayoutDashboard 
  };
  const rawRoleNavItems = ROLE_NAV_MAP[activeRole] || ROLE_NAV_MAP.SUPER_ADMIN;
  const currentNavItems = [dashboardNavItem, ...rawRoleNavItems];

  currentNavItems.forEach(item => {
    if (item.subItems) {
      const match = item.subItems.find(sub => location.pathname === sub.path || location.pathname.startsWith(sub.path + '/'));
      if (match) {
        matchedLabel = match.label;
        matchedParentLabel = item.label;
      }
    } else if (item.path && (location.pathname === item.path || location.pathname.startsWith(item.path + '/'))) {
      matchedLabel = item.label;
    }
  });

  return (
    <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-6">
      <Link
        to={dashboardRoute}
        className="hover:text-primary transition-colors duration-200"
        style={{ color: 'inherit' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = PRIMARY_HEX)}
        onMouseLeave={(e) => (e.currentTarget.style.color = '')}
      >
        Home
      </Link>
      {pathnames.slice(1).map((value, index, arr) => {
        const to = `/${pathnames.slice(0, index + 2).join('/')}`;
        const isLast = index === arr.length - 1;
        let formatted = value.charAt(0).toUpperCase() + value.slice(1);

        // Apply matched label for the known page routes
        if (index === 1 && matchedLabel) {
          formatted = matchedLabel;
        } else if (index === 0 && arr.length === 1 && matchedLabel) {
          formatted = matchedLabel;
        }

        // Apply to ALL modules: Make the intermediate group breadcrumb non-clickable
        if (index === 0 && !isLast) {
          if (matchedParentLabel) {
            formatted = matchedParentLabel;
          }
          return (
            <div key={to} className="flex items-center space-x-2">
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span style={{ color: 'inherit' }}>
                {formatted}
              </span>
            </div>
          );
        }

        return (
          <div key={to} className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-800" style={{ fontFamily: 'var(--font-heading)' }}>
                {formatted}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-primary transition-colors duration-200"
                style={{ color: 'inherit' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = PRIMARY_HEX)}
                onMouseLeave={(e) => (e.currentTarget.style.color = '')}
              >
                {formatted}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Products']);
  const location = useLocation();
  const navigate = useNavigate();

  // Load backend database records in parallel on mount to populate the cache globally
  useEffect(() => {
    Promise.all([
      productService.loadProducts(),
      warehouseService.loadWarehouses(),
      inventoryService.loadInventory(),
      batchService.loadBatches()
    ]).catch(err => console.error("Failed to load backend database caches:", err));
  }, []);

  // Auto-expand the active menu when the route changes
  useEffect(() => {
    const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
    const dashboardRoute = getDashboardRoute(activeRole);
    const dashboardNavItem: NavItem = { label: 'Dashboard', path: dashboardRoute, icon: LayoutDashboard };
    const rawRoleNavItems = ROLE_NAV_MAP[activeRole] || ROLE_NAV_MAP.SUPER_ADMIN;
    const currentNavItems = [dashboardNavItem, ...rawRoleNavItems];

    currentNavItems.forEach(item => {
      if (item.subItems?.some(sub => location.pathname.startsWith(sub.path))) {
        setExpandedMenus(prev => prev.includes(item.label) ? prev : [...prev, item.label]);
      }
    });
  }, [location.pathname]);

  const authUserString = localStorage.getItem('centralAuthSession'); // read from central session
  const authUserSession = authUserString ? JSON.parse(authUserString) : null;
  const authUser = authUserSession?.user || (localStorage.getItem('authUser') ? JSON.parse(localStorage.getItem('authUser')!) : null);

  // Determine if active user session is a Company Admin account
  const isCompanyAdmin = authUserSession?.role === 'COMPANY_ADMIN' || authUser?.role === 'COMPANY_ADMIN' || authUser?.roleId === 'COMPANY_ADMIN';
  const effectiveRole = isCompanyAdmin ? 'COMPANY_ADMIN' : (localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN);
  const activeRole = effectiveRole;

  const activeRoleData = ROLES.find(r => r.id === effectiveRole) || ({
    id: 'COMPANY_ADMIN',
    title: authUser?.companyName ? `${authUser.companyName} Admin` : 'Company Admin',
    userName: authUser?.fullName || authUser?.adminName || 'Company Admin',
    userEmail: authUser?.email || 'admin@company.com'
  } as any);

  const getRoleTitle = (roleIdOrName?: string) => {
    if (!roleIdOrName) return activeRoleData.title;
    const foundById = ROLES.find(r => r.id === roleIdOrName);
    if (foundById) return foundById.title;
    const foundByTitle = ROLES.find(r => r.title.toLowerCase() === roleIdOrName.toLowerCase());
    if (foundByTitle) return foundByTitle.title;
    return roleIdOrName
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const displayName = authUser ? (authUser.fullName || authUser.name || authUser.adminName) : activeRoleData.userName;
  const displayRole = authUser ? (authUser.roleId ? getRoleTitle(authUser.roleId) : (authUser.role ? getRoleTitle(authUser.role) : activeRoleData.title)) : activeRoleData.title;
  const displayEmail = authUser ? authUser.email : activeRoleData.userEmail;
  const profileImage = authUser ? (authUser.profileImage || authUser.avatarUrl) : null;
  
  const purchasedModules = authUserSession ? normalizePurchasedModules(authUserSession.purchasedModules) : [];

  const dashboardRoute = getDashboardRoute(activeRole);
  const dashboardNavItem: NavItem = { label: 'Dashboard', path: dashboardRoute, icon: LayoutDashboard };
  const rawRoleNavItems = ROLE_NAV_MAP[activeRole] || ROLE_NAV_MAP.SUPER_ADMIN;
  const currentNavItems = [dashboardNavItem, ...rawRoleNavItems];

  const filteredNavItems = currentNavItems.filter(item => {
    if (item.label === 'Dashboard') return true;

    if (activeRole === 'COMPANY_ADMIN') {
      if (item.label === 'Super Admin' || item.label === 'Company Admin') return false; 
      if (item.label === 'Settings') return true;
      return purchasedModules.includes(item.label);
    }
    
    // For specific roles like Tenant users we can still check permissions,
    // but for our built-in internal ERP roles, the mapped configuration dictates visibility
    // so we return true. This isolates the configuration.
    return true;
  });

  // Close sidebar on route change for mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Auto-expand the parent menu that contains the currently active sub-route.
  // This runs on mount and whenever the path changes, but does NOT collapse
  // other already-open menus – preserving independent multi-expand behavior.
  useEffect(() => {
    const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
    const dashboardRoute = getDashboardRoute(activeRole);
    const dashboardNavItem: NavItem = { label: 'Dashboard', path: dashboardRoute, icon: LayoutDashboard };
    const rawRoleNavItems = ROLE_NAV_MAP[activeRole] || ROLE_NAV_MAP.SUPER_ADMIN;
    const currentNavItems = [dashboardNavItem, ...rawRoleNavItems];

    const activeParent = currentNavItems.find(
      (item) =>
        item.subItems &&
        item.subItems.some((sub) => location.pathname.startsWith(sub.path))
    );
    if (activeParent) {
      setExpandedMenus((prev) =>
        prev.includes(activeParent.label) ? prev : [...prev, activeParent.label]
      );
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: BG_HEX }}>
      {/* ── Mobile Sidebar Overlay ── */}
{sidebarOpen && (
  <div
    className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
    onClick={() => setSidebarOpen(false)}
  />
)}

{/* ── Sidebar ── */}
<aside
  className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 shadow-sm flex flex-col transform transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
  } ${sidebarCollapsed ? 'w-[88px]' : 'w-[260px]'}`}
>
  {/* Sidebar Header */}
  <div className="h-[90px] flex items-center justify-center border-b border-slate-100 flex-shrink-0 overflow-hidden relative">
    <Link
      to={getDashboardRoute(localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN)}
      className="flex items-center justify-center w-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
    >
      <img
        src={mjLogo}
        alt="MJ Healthcare"
        className="h-50 w-auto object-contain"
      />
    </Link>

    <button
      onClick={() => setSidebarOpen(false)}
      className="lg:hidden absolute right-4 p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
    >
      <X className="w-5 h-5" />
    </button>
  </div>

  {/* Sidebar Nav */}
        <nav className="flex-1 overflow-y-auto no-scrollbar px-4 py-6 space-y-1">
          {filteredNavItems.sort((a, b) => {
            if (activeRole === ROLE_ACCOUNTANT) {
              const order = ['Dashboard', 'Wholesale Billing System', 'Accounting & Finance', 'Alerts & Notifications', 'Settings'];
              return order.indexOf(a.label) - order.indexOf(b.label);
            }
            if (activeRole === ROLE_DISTRIBUTOR) {
              const order = ['Dashboard', 'Distributor/Stockist Portal',  'Orders', 'Alerts & Notifications', 'Settings'];
              return order.indexOf(a.label) - order.indexOf(b.label);
            }
            if (activeRole === ROLE_RETAILER) {
              const order = ['Dashboard', 'Retailer Ordering System', 'Orders', 'Alerts & Notifications', 'Settings'];
              return order.indexOf(a.label) - order.indexOf(b.label);
            }
            if (activeRole === ROLE_MEDICAL_REPRESENTATIVE) {
              const order = ['Dashboard', 'MR (Medical Representative)', 'GPS & Location Tracking', 'Pre-Sales CRM', 'Alerts & Notifications', 'Settings'];
              return order.indexOf(a.label) - order.indexOf(b.label);
            }
            return 0;
          }).map((rawItem) => {
            const item = { ...rawItem };
            if (activeRole === ROLE_ACCOUNTANT) {
              if (item.label === 'Wholesale Billing System') {
                const billingOrder = [
                  'GST Billing',
                  'Barcode Billing',
                  'E-Invoice Support',
                  'Multi Rate Billing',
                  'Sales Return',
                  'Expiry Return',
                  'Credit Note',
                ];
                item.subItems = (item.subItems || [])
                  .filter(sub => billingOrder.includes(sub.label))
                  .sort((a, b) => billingOrder.indexOf(a.label) - billingOrder.indexOf(b.label));
              }

              if (item.label === 'Accounting & Finance') {
                const financeOrder = [
                  'Party Ledger',
                  'Payment Tracking',
                  'Outstanding Tracking',
                  'Outstanding Aging',
                  'Profit & Loss',
                  'Balance Sheet',
                  'GST Reports',
                  'Commission System',
                  'Bank Reconciliation',
                ];
                item.subItems = (item.subItems || [])
                  .filter(sub => financeOrder.includes(sub.label))
                  .sort((a, b) => financeOrder.indexOf(a.label) - financeOrder.indexOf(b.label));
              }

              if (item.label === 'Alerts & Notifications') {
                const notifOrderMap: Record<string, string> = {
                  'Payment Reminders': 'Payment Reminders',
                  'Expiry Alerts': 'Expiry Alerts',
                  'Dispatch Alerts': 'Dispatch Alerts',
                  'Auto Reorder Alerts': 'Auto Reorder Alerts',
                  'Activity Notifications': 'System Notifications',
                  'System Notifications': 'System Notifications',
                };
                const notifOrder = [
                  'Payment Reminders',
                  'Expiry Alerts',
                  'Dispatch Alerts',
                  'Auto Reorder Alerts',
                  'System Notifications',
                ];
                item.subItems = (item.subItems || [])
                  .map(sub => ({
                    ...sub,
                    label: notifOrderMap[sub.label] || sub.label,
                  }))
                  .filter(sub => notifOrder.includes(sub.label))
                  .sort((a, b) => notifOrder.indexOf(a.label) - notifOrder.indexOf(b.label));
              }

              if (item.label === 'Settings') {
                item.subItems = (item.subItems || []).filter(sub => sub.label === 'Profile Settings');
              }
            }

            if ((activeRole === ROLE_WAREHOUSE_MANAGER || activeRole === ROLE_DISTRIBUTOR || activeRole === ROLE_RETAILER || activeRole === ROLE_MEDICAL_REPRESENTATIVE || activeRole === ROLE_TRANSPORT_STAFF) && item.label === 'Settings') {
              item.subItems = item.subItems?.filter(sub => sub.label === 'Profile Settings');
            }
            if (item.label === 'Distributor/Stockist Portal') {
              if (activeRole !== ROLE_DISTRIBUTOR) {
                item.subItems = item.subItems?.filter(sub => sub.label !== 'Retailer Orders');
              }
              if (activeRole !== ROLE_SUPER_ADMIN) {
                item.subItems = item.subItems?.filter(sub => sub.label !== 'Distributor Orders' && sub.label !== 'Distributor Master');
              }
            }
            if (activeRole !== ROLE_SUPER_ADMIN && item.label === 'Retailer Ordering System') {
              item.subItems = item.subItems?.filter(sub => sub.label !== 'Retailer Master');
            }

            const hasSubItems = !!item.subItems && item.subItems.length > 0;
            const isPathActive = (path: string) => location.pathname.startsWith(path);
            const isAnySubActive = hasSubItems && item.subItems!.some((sub) => isPathActive(sub.path));
            const isActive = !hasSubItems && item.path ? isPathActive(item.path) : isAnySubActive;
            
            // Menu is expanded based purely on state, allowing manual collapsing even if active.
            const isExpanded = expandedMenus.includes(item.label);

            const toggleMenu = () => {
              if (sidebarCollapsed) setSidebarCollapsed(false);
              
              if (expandedMenus.includes(item.label)) {
                setExpandedMenus(expandedMenus.filter(m => m !== item.label));
              } else {
                setExpandedMenus([...expandedMenus, item.label]);
              }
            };

const activeStyle =
  isActive && !hasSubItems
    ? { backgroundColor: '#f3e8ff', color: PRIMARY_HEX }
    : {};

            const itemContent = (
              <>
                <item.icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                    isActive ? '' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                  style={isActive && !hasSubItems ? { color: PRIMARY_HEX } : {}}
                />
                <span className={`flex-1 transition-all duration-200 overflow-hidden ${sidebarCollapsed ? 'w-0 opacity-0 hidden whitespace-nowrap' : 'opacity-100 block whitespace-normal'}`}>{item.label}</span>
                {hasSubItems && !sidebarCollapsed && (
                  isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )
                )}
              </>
            );

            const className = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 w-full text-left ${
              isActive && !hasSubItems
                ? 'font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`;

            return (
              <div key={item.label} className="space-y-1">
                {hasSubItems ? (
                  <button onClick={toggleMenu} className={className}>
                    {itemContent}
                  </button>
                ) : (
                  <Link to={item.path!} style={activeStyle} className={className}>
                    {itemContent}
                  </Link>
                )}

                {hasSubItems && isExpanded && !sidebarCollapsed && (
                  <div className="pl-11 pr-3 space-y-1 mt-1">
                    {item.subItems!.filter(sub => {
                      // Hide specific distributor actions from Admins/Super Admins
                      if (item.label === 'Distributor/Stockist Portal') {
                        if (activeRole === ROLE_SUPER_ADMIN) {
                          const hiddenForAdmin = [
                            'Current Stock',
                            'Order Placement',
                            'Outstanding Tracking',
                            'Ledger Access',
                            'Invoice Download',
                            'Scheme Visibility',
                            'Order History'
                          ];
                          if (hiddenForAdmin.includes(sub.label)) {
                            return false;
                          }
                        }
                      }

                      // Hide specific retailer actions from Admins/Super Admins
                      if (item.label === 'Retailer Ordering System') {
                        if (activeRole === ROLE_SUPER_ADMIN) {
                          const hiddenForAdmin = [
                            'Product Browsing',
                            'Offer Visibility',
                            'Scheme Visibility',
                            'Order Placement',
                            'Reorder Functionality',
                            'Invoice Access',
                            'Payment Tracking'
                          ];
                          if (hiddenForAdmin.includes(sub.label)) {
                            return false;
                          }
                        }
                      }

                      // Manual Role-Based filtering for Notifications
                      if (item.label === 'Alerts & Notifications') {
                        if (activeRole === ROLE_MEDICAL_REPRESENTATIVE) {
                          return sub.label === 'Meeting Reminders' || sub.label === 'Follow-Up Reminders';
                        }
                        if (activeRole === ROLE_DISTRIBUTOR || activeRole === ROLE_RETAILER) {
                          return sub.label !== 'Meeting Reminders' && sub.label !== 'Follow-Up Reminders';
                        }
                        // Super Admin sees everything
                        if (activeRole === ROLE_SUPER_ADMIN) return true;
                        
                        return true; 
                      }
                      // Hide specific GPS field actions from Admins
                      if (item.label === 'GPS & Location Tracking') {
                        if (activeRole === ROLE_SUPER_ADMIN || activeRole === 'admin') {
                          if (sub.label === 'Check In' || sub.label === 'Check Out') {
                            return false;
                          }
                        }
                      }
                      return true;
                    }).map((sub) => {
                      const isSubActive = isPathActive(sub.path);
                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          style={isSubActive ? { color: PRIMARY_HEX } : {}}
                          className={`flex items-center gap-2 py-2 text-sm font-medium transition-colors ${
                            isSubActive
                              ? 'text-primary font-semibold'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {sub.icon && <sub.icon className="w-4 h-4 flex-shrink-0" />}
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-100 flex-shrink-0">
          <button className={`w-full flex items-center p-2 rounded-lg hover:bg-slate-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary text-left group ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            
            <div className="w-9 h-9 rounded-full bg-brand-light text-brand-primary flex items-center justify-center border border-brand-primary/20 flex-shrink-0 overflow-hidden">
               {profileImage ? (
    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
  ) : (
              <User className="w-4 h-4" />
  )}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate leading-tight group-hover:text-primary transition-colors">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {displayRole}
                </p>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main Canvas ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-white/70 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-30 transition-all duration-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors lg:hidden outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Sidebar Toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Menu className="w-5 h-5" />
            </button>


          </div>

          <div className="flex items-center gap-2 sm:gap-4">


            <div className="flex items-center gap-1 sm:gap-2">
              <NotificationDropdown />
            </div>

            <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

            {/* User Profile */}
            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-slate-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                         <div className="w-8 h-8 rounded-full bg-brand-light text-brand-primary flex items-center justify-center border border-brand-primary/20 flex-shrink-0 overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-slate-700 leading-none mb-1">{displayName}</p>
                  <p className="text-xs text-slate-500 leading-none">{displayRole}</p>
                </div>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden"
                    >
                      {/* Dropdown Header */}
                      <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">

                        <div className="w-12 h-12 rounded-full bg-brand-light text-brand-primary flex items-center justify-center border border-brand-primary/20 flex-shrink-0 overflow-hidden">
                          {profileImage ? (
                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-6 h-6" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                          <p className="text-xs font-medium text-primary truncate mb-0.5">{displayRole}</p>
                          <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
                        </div>
                      </div>

                      {/* Dropdown Menu Items */}
                      <div className="p-2 space-y-1">
                        <button 
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate('/workspace/profile');
                          }}
                        >
                          <UserCircle className="w-4 h-4 text-slate-400" />
                          My Profile
                        </button>
                        <button 
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate('/workspace/settings/profile');
                          }}
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          Account Settings
                        </button>
                        <button 
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate('/workspace/change-password');
                          }}
                        >
                          <Key className="w-4 h-4 text-slate-400" />
                          Change Password
                        </button>
                        <button 
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate('/workspace/help-support');
                          }}
                        >
                          <LifeBuoy className="w-4 h-4 text-slate-400" />
                          Help & Support
                        </button>
                      </div>

                      <div className="h-px bg-slate-100 w-full" />

                      <div className="p-2">
                        <button 
                          onClick={() => {
                            setProfileOpen(false);
                            const currentRole = localStorage.getItem('activeRole');
                            localStorage.removeItem('activeRole');
                            navigate('/login', { state: { roleId: currentRole } });
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto relative p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs />
            
            {/* Dynamic Module Content */}
            <div className="animate-in fade-in duration-500">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}