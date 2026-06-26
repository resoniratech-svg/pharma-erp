import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Box,
  ShoppingCart,
  Receipt,
  Users,
  BarChart3,
  Bell,
  Settings,
  Search,
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
} from 'lucide-react';
import { hasPermission } from '../../constants/permissions';
import NotificationDropdown from '../../components/NotificationDropdown';
import authService from '../../services/authService';
import activityLogService from '../../services/activityLogService';
import { ROLE_SUPER_ADMIN, ROLE_WAREHOUSE_MANAGER, ROLE_ACCOUNTANT, ROLE_DISTRIBUTOR, ROLE_RETAILER, ROLE_MEDICAL_REPRESENTATIVE, ROLE_TRANSPORT_STAFF, ROLES } from '../../constants/roles';
import mjLogo from '../../assets/logo/mj-healthcare-logo.svg';

/* ── Constants ───────────────────────────────────────────────────── */
const PRIMARY_HEX = '#7c3aed';
const BG_HEX = '#f8fafc';

export type NavItem = {
  label: string;
  path?: string;
  icon: React.ElementType;
  subItems?: { label: string; path: string }[];
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/workspace/dashboard', icon: LayoutDashboard },
  {
    label: 'Super Admin',
    icon: Shield,
    subItems: [
      { label: 'Role Based Access', path: '/workspace/super-admin/role-based-access' },
      { label: 'Admin Management', path: '/workspace/super-admin/admin-management' },
      { label: 'All India Sales Dashboard', path: '/workspace/super-admin/all-india-sales' },
      { label: 'State Performance Reports', path: '/workspace/super-admin/state-performance' },
      { label: 'Product Profitability Reports', path: '/workspace/super-admin/product-profitability' },
      { label: 'Live Stock Monitoring', path: '/workspace/super-admin/live-stock-monitoring' },
      { label: 'Pending Payment Tracking', path: '/workspace/super-admin/pending-payment-tracking' },
      { label: 'Dispatch Monitoring', path: '/workspace/super-admin/dispatch-monitoring' },
      { label: 'Franchise Monitoring', path: '/workspace/super-admin/franchise-monitoring' },
      { label: 'Export Order Monitoring', path: '/workspace/super-admin/export-order-monitoring' },
      { label: 'Notification Center', path: '/workspace/super-admin/notification-center' },
      { label: 'User Activity Logs', path: '/workspace/super-admin/user-activity-logs' },
    ],
  },
  {
    label: 'Product Management',
    icon: Package,
    subItems: [
      { label: 'Product Master Management', path: '/workspace/products/master' },
      { label: 'Batch Management', path: '/workspace/products/batches' },
      { label: 'Expiry Tracking', path: '/workspace/products/expiry-tracking' },
      { label: 'MRP Management', path: '/workspace/products/mrp-management' },
      { label: 'PTR / PTS / PTD Pricing', path: '/workspace/products/pricing' },
      { label: 'GST Management', path: '/workspace/products/gst' },
      { label: 'Barcode Management', path: '/workspace/products/barcodes' },
      { label: 'Composition Management', path: '/workspace/products/compositions' },
      { label: 'Packing Type Management', path: '/workspace/products/packing-types' },
      { label: 'Scheme Management', path: '/workspace/products/schemes' },
    ],
  },
  {
    label: 'Inventory & Warehouse Management',
    icon: ClipboardList,
    subItems: [
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
  {
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
  {
    label: 'Distributor/Stockist Portal',
    icon: Users,
    subItems: [
      { label: 'Product Catalog Access', path: '/workspace/distributors/product-catalog' },
      { label: 'Order Placement', path: '/workspace/distributors/orders' },
      { label: 'Retailer Orders', path: '/workspace/distributors/retailer-orders' },
      { label: 'Outstanding Tracking', path: '/workspace/distributors/outstanding' },
      { label: 'Ledger Access', path: '/workspace/distributors/ledgers' },
      { label: 'Invoice Download', path: '/workspace/distributors/invoices' },
      { label: 'Scheme Visibility', path: '/workspace/distributors/schemes' },
      { label: 'Order History', path: '/workspace/distributors/order-history' },
      { label: 'Dispatch Tracking', path: '/workspace/distributors/dispatch-tracking' },
    ],
  },
  {
    label: 'Retailer Ordering System',
    icon: ShoppingCart,
    subItems: [
      { label: 'Product Browsing', path: '/workspace/retailers/catalog' },
      { label: 'Offer Visibility', path: '/workspace/retailers/offers' },
      { label: 'Scheme Visibility', path: '/workspace/retailers/scheme-visibility' },
      { label: 'Order Placement', path: '/workspace/retailers/orders' },
      { label: 'Reorder Functionality', path: '/workspace/retailers/reorders' },
      { label: 'Invoice Access', path: '/workspace/retailers/invoices' },
      { label: 'Payment Tracking', path: '/workspace/retailers/payments' },
    ],
  },
  {
    label: 'MR (Medical Representative)',
    icon: Users,
    subItems: [
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
  {
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
  {
    label: 'Wholesale Billing System',
    icon: Receipt,
    subItems: [
      { label: 'GST Billing', path: '/workspace/billing/gst' },
      { label: 'E-Invoice Support', path: '/workspace/billing/einvoice' },
      { label: 'E-Way Bill Support', path: '/workspace/billing/ewaybill' },
      { label: 'Barcode Billing', path: '/workspace/billing/pos' },
      { label: 'Credit Note', path: '/workspace/billing/credit-notes' },
      { label: 'Sales Return', path: '/workspace/billing/sales-returns' },
      { label: 'Expiry Return', path: '/workspace/billing/expiry-returns' },
      { label: 'Multi Rate Billing', path: '/workspace/billing/multi-rate-billing' },
    ],
  },
  {
    label: 'Pre-Sales CRM',
    icon: HeartHandshake,
    subItems: [
      { label: 'Lead Creation', path: '/workspace/crm/leads' },
      { label: 'Lead Assignment', path: '/workspace/crm/lead-assignment' },
      { label: 'Lead Pipeline Tracking', path: '/workspace/crm/lead-pipeline-tracking' },
      { label: 'Follow-Up Management', path: '/workspace/crm/follow-ups' },
      { label: 'Meeting Scheduling', path: '/workspace/crm/meetings' },
      { label: 'Activity Tracking', path: '/workspace/crm/activities' },
      { label: 'Doctor/Hospital CRM', path: '/workspace/crm/doctors' },
      { label: 'Distributor Onboarding CRM', path: '/workspace/crm/distributors' },
      { label: 'Sales Activity Monitoring', path: '/workspace/crm/pipeline' },
      { label: 'Lead Conversion Tracking', path: '/workspace/crm/lead-conversion-tracking' },
    ],
  },
  {
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
  { label: 'Orders', path: '/orders', icon: ShoppingCart },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
  {
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
  {
    label: 'Settings',
    icon: Settings,
    subItems: [
      { label: 'Profile Settings', path: '/workspace/settings/profile' },
      { label: 'Company Settings', path: '/workspace/settings/company' },
      { label: 'Branch Settings', path: '/workspace/settings/branch' },
      { label: 'User Management', path: '/workspace/settings/users' },
      { label: 'Roles & Permissions', path: '/workspace/settings/roles' },
      { label: 'System Settings', path: '/workspace/settings/system' },
    ],
  },
];

/* Generic Breadcrumbs based on route */
const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-6">
      <Link
        to="/workspace/dashboard"
        className="hover:text-primary transition-colors duration-200"
        style={{ color: 'inherit' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = PRIMARY_HEX)}
        onMouseLeave={(e) => (e.currentTarget.style.color = '')}
      >
        Home
      </Link>
      {pathnames.slice(1).map((value, index) => {
        const to = `/${pathnames.slice(0, index + 2).join('/')}`;
        const isLast = index === pathnames.length - 2;
        const formatted = value.charAt(0).toUpperCase() + value.slice(1);

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
  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Products']);
  const location = useLocation();
  const navigate = useNavigate();

  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
  const activeRoleData = ROLES.find(r => r.id === activeRole) || ROLES[0];
  const authUserString = localStorage.getItem('authUser');
  const authUser = authUserString ? JSON.parse(authUserString) : null;
  const displayName = authUser ? authUser.fullName : activeRoleData.userName;
  const displayEmail = authUser ? authUser.email : activeRoleData.userEmail;

  /* ── Dynamic Role Path Switcher ── */
  const filteredNavItems = NAV_ITEMS.filter(item => activeRole === ROLE_SUPER_ADMIN || hasPermission(activeRole, item.label))
    .map(item => {
      // Create a shallow copy of the object before altering properties
      const mappedItem = { ...item };

      if (activeRole === ROLE_SUPER_ADMIN && mappedItem.label === 'Distributor/Stockist Portal') {
        mappedItem.subItems = mappedItem.subItems?.filter(sub => sub.label !== 'Retailer Orders');
      }

      // STRICT PROTECTION: If user is a distributor, point all invoice references to InvoiceDownload.tsx route map
      if (activeRole === ROLE_DISTRIBUTOR && mappedItem.subItems) {
        mappedItem.subItems = mappedItem.subItems.map(sub => {
          if (sub.label === 'Invoice Download') {
            return { ...sub, path: '/workspace/distributors/invoices' }; // Bound to your InvoiceDownload container view
          }
          return sub;
        });
      }

      return mappedItem;
    });

  // Close sidebar on route change for mobile
  useEffect(() => {
    setSidebarOpen(false);
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
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-slate-200 shadow-sm flex flex-col transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 flex-shrink-0">
          <Link
            to="/workspace/dashboard"
            className="flex items-center outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded py-1"
          >
            <img src={mjLogo} alt="MJ Healthcare" className="h-9 w-auto object-contain" />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {filteredNavItems
            .sort((a, b) => {
              if (activeRole === ROLE_DISTRIBUTOR) {
                const order = ["Dashboard", "Distributor/Stockist Portal", "Orders", "Alerts & Notifications", "Settings"];
                return order.indexOf(a.label) - order.indexOf(b.label);
              }
              if (activeRole === ROLE_RETAILER) {
                const order = ["Dashboard", "Retailer Ordering System", "Orders", "Alerts & Notifications", "Settings"];
                return order.indexOf(a.label) - order.indexOf(b.label);
              }
              if (activeRole === ROLE_MEDICAL_REPRESENTATIVE) {
                const order = ["Dashboard", "MR (Medical Representative)", "GPS & Location Tracking", "Pre-Sales CRM", "Alerts & Notifications", "Settings"];
                return order.indexOf(a.label) - order.indexOf(b.label);
              }
              return 0;
            })
            .map((item) => {
              const managedItem = { ...item };
              if (
                (activeRole === ROLE_WAREHOUSE_MANAGER ||
                  activeRole === ROLE_ACCOUNTANT ||
                  activeRole === ROLE_DISTRIBUTOR ||
                  activeRole === ROLE_RETAILER ||
                  activeRole === ROLE_MEDICAL_REPRESENTATIVE ||
                  activeRole === ROLE_TRANSPORT_STAFF) &&
                managedItem.label === "Settings"
              ) {
                managedItem.subItems = managedItem.subItems?.filter((sub) => sub.label === "Profile Settings");
              }

              const hasSubItems = !!managedItem.subItems && managedItem.subItems.length > 0;
              const isPathActive = (path: string) => location.pathname.startsWith(path);
              const isAnySubActive = hasSubItems && managedItem.subItems!.some((sub) => isPathActive(sub.path));
              const isActive = !hasSubItems && managedItem.path ? isPathActive(managedItem.path) : isAnySubActive;
              const isExpanded = expandedMenus.includes(managedItem.label) || isAnySubActive;

              const toggleMenu = () => {
                if (expandedMenus.includes(managedItem.label)) {
                  setExpandedMenus(expandedMenus.filter((m) => m !== managedItem.label));
                } else {
                  setExpandedMenus([...expandedMenus, managedItem.label]);
                }
              };

              const activeStyle = isActive && !hasSubItems ? { backgroundColor: "#f3e8ff", color: PRIMARY_HEX } : {};

              const itemContent = (
                <>
                  <managedItem.icon
                    className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${isActive ? "" : "text-slate-400 group-hover:text-slate-600"}`}
                    style={isActive && !hasSubItems ? { color: PRIMARY_HEX } : {}}
                  />
                  <span className="flex-1">{managedItem.label}</span>
                  {hasSubItems && (isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />)}
                </>
              );

              const className = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 w-full text-left ${
                isActive && !hasSubItems ? "font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`;

              return (
                <div key={managedItem.label} className="space-y-1">
                  {hasSubItems ? (
                    <button onClick={toggleMenu} className={className}>
                      {itemContent}
                    </button>
                  ) : (
                    <Link to={managedItem.path!} style={activeStyle} className={className}>
                      {itemContent}
                    </Link>
                  )}

                  {hasSubItems && isExpanded && (
                    <div className="pl-11 pr-3 space-y-1 mt-1">
                      {managedItem.subItems!.map((sub) => {
                        const isSubActive = isPathActive(sub.path);
                        return (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            style={isSubActive ? { color: PRIMARY_HEX } : {}}
                            className={`block py-2 text-sm font-medium transition-colors ${isSubActive ? "text-primary font-semibold" : "text-slate-500 hover:text-slate-900"}`}
                          >
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
          <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary text-left group">
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200 flex-shrink-0 overflow-hidden">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate leading-tight group-hover:text-primary transition-colors">
                {displayName}
              </p>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {activeRoleData.title}
              </p>
            </div>
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

            {/* Search */}
            <div className="hidden md:flex items-center relative group">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 w-64 bg-slate-100/50 border border-transparent rounded-full text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-primary/10 transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* System Status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-100">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Operational
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <NotificationDropdown />
            </div>

            <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

            {/* User Profile Dropdown Content */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-slate-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200 flex-shrink-0 overflow-hidden">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-slate-700 leading-none mb-1">{displayName}</p>
                  <p className="text-xs text-slate-500 leading-none">{activeRoleData.title}</p>
                </div>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200 flex-shrink-0">
                          <User className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                          <p className="text-xs font-medium text-primary truncate mb-0.5">{activeRoleData.title}</p>
                          <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
                        </div>
                      </div>

                      <div className="p-2 space-y-1">
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          onClick={() => { setProfileOpen(false); navigate("/workspace/profile"); }}
                        >
                          <UserCircle className="w-4 h-4 text-slate-400" />
                          My Profile
                        </button>
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          onClick={() => { setProfileOpen(false); navigate("/workspace/settings/profile"); }}
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          Account Settings
                        </button>
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          onClick={() => { setProfileOpen(false); navigate("/workspace/change-password"); }}
                        >
                          <Key className="w-4 h-4 text-slate-400" />
                          Change Password
                        </button>
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          onClick={() => { setProfileOpen(false); navigate("/workspace/help-support"); }}
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
                            const currentUser = authService.getCurrentUser();
                            activityLogService.addLog({
                              userId: currentUser?.id,
                              userName: currentUser?.fullName,
                              action: "Logout",
                              module: "Authentication",
                            });
                            const currentRole = localStorage.getItem("activeRole");
                            authService.logout();
                            navigate("/login", { state: { roleId: currentRole } });
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic Content View Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  );
}