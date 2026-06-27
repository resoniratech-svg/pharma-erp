import { createBrowserRouter } from 'react-router';
import { MainLayout } from '../layouts/MainLayout';
import App from '../../App';
import LandingPage from '../../pages/LandingPage';
import WorkspaceSelection from '../../pages/WorkspaceSelection';
import LoginPage from '../../pages/LoginPage';

// Products Module
import ProductMaster from '../../modules/products/ProductMaster';
import BatchManagement from '../../modules/products/BatchManagement';
import ExpiryTracking from '../../modules/products/ExpiryTracking';
import MRPManagement from '../../modules/products/MRPManagement';
import PricingManagement from '../../modules/products/PricingManagement';
import GSTManagement from '../../modules/products/GSTManagement';
import BarcodeManagement from '../../modules/products/BarcodeManagement';
import CompositionManagement from '../../modules/products/CompositionManagement';
import PackingTypeManagement from '../../modules/products/PackingTypeManagement';
import SchemeManagement from '../../modules/products/SchemeManagement';

// Inventory Module
import InventoryOverview from '../../modules/inventory/InventoryOverview';
import MultiLocationStock from '../../modules/inventory/MultiLocationStock';
import BatchWiseStockTracking from '../../modules/inventory/BatchWiseStockTracking';
import InwardStock from '../../modules/inventory/InwardStock';
import OutwardStock from '../../modules/inventory/OutwardStock';
import WarehouseTransfer from '../../modules/inventory/WarehouseTransfer';
import CompanyWiseInventoryTracking from '../../modules/inventory/CompanyWiseInventoryTracking';
import DeadStock from '../../modules/inventory/DeadStock';
import ExpiryStock from '../../modules/inventory/ExpiryStock';
import LowStockAlerts from '../../modules/inventory/LowStockAlerts';

// Warehouse Module
import DispatchManagement from '../../modules/warehouse/DispatchManagement';
import TransportChallans from '../../modules/warehouse/TransportChallans';
import LRTracking from '../../modules/warehouse/LRTracking';
import WarehouseTransferTracking from '../../modules/warehouse/WarehouseTransferTracking';
import DeliveryTracking from '../../modules/warehouse/DeliveryTracking';
import DispatchReports from '../../modules/warehouse/DispatchReports';

// Distributors Module
import DistributorList from '../../modules/distributors/DistributorList';
import DistributorProductCatalog from '../../modules/distributors/ProductCatalog';
import DistributorOrders from '../../modules/distributors/Orders';
import DistributorRetailerOrders from '../../modules/distributors/RetailerOrders';
import OrderHistory from '../../modules/distributors/OrderHistory';
import OutstandingTracking from '../../modules/distributors/OutstandingTracking';
import Ledgers from '../../modules/distributors/Ledgers';
import Invoices from '../../modules/distributors/Invoices';
import DistributorSchemes from '../../modules/distributors/Schemes';
import DispatchTracking from '../../modules/distributors/DispatchTracking';

// Retailers Module
import RetailerList from '../../modules/retailers/RetailerList';
import ProductCatalog from '../../modules/retailers/ProductCatalog';
import RetailerOffers from '../../modules/retailers/Offers';
import SchemeVisibility from '../../modules/retailers/SchemeVisibility';
import RetailerOrders from '../../modules/retailers/Orders';
import Reorders from '../../modules/retailers/Reorders';
import RetailerInvoices from '../../modules/retailers/Invoices';
import Payments from '../../modules/retailers/Payments';

// Billing Module
import GSTBilling from '../../modules/billing/GSTBilling';
import EInvoice from '../../modules/billing/EInvoice';
import EWayBill from '../../modules/billing/EWayBill';
import BarcodeBilling from '../../modules/billing/BarcodeBilling';
import MultiRateBilling from '../../modules/billing/MultiRateBilling';
import CreditNotes from '../../modules/billing/CreditNotes';
import SalesReturns from '../../modules/billing/SalesReturns';
import ExpiryReturns from '../../modules/billing/ExpiryReturns';

// MR Module
import DoctorVisits from '../../modules/mr/DoctorVisits';
import ChemistVisits from '../../modules/mr/ChemistVisits';
import OrderBooking from '../../modules/mr/OrderBooking';
import DailyReports from '../../modules/mr/DailyReports';
import TargetTracking from '../../modules/mr/TargetTracking';
import TourPlanning from '../../modules/mr/TourPlanning';
import Meetings from '../../modules/mr/Meetings';
import ActivityTracking from '../../modules/mr/ActivityTracking';

// GPS Module
import Attendance from '../../modules/gps/Attendance';
import CheckIn from '../../modules/gps/CheckIn';
import CheckOut from '../../modules/gps/CheckOut';
import RouteHistory from '../../modules/gps/RouteHistory';
import TerritoryTracking from '../../modules/gps/TerritoryTracking';
import LocationTracking from '../../modules/gps/LocationTracking';
import GeoTaggedDoctorVisits from '../../modules/gps/GeoTaggedDoctorVisits';
import GeoTaggedChemistVisits from '../../modules/gps/GeoTaggedChemistVisits';
import MeetingLocationTracking from '../../modules/gps/MeetingLocationTracking';

// CRM Module
import Leads from '../../modules/crm/Leads';
import LeadAssignment from '../../modules/crm/LeadAssignment';
import LeadPipelineTracking from '../../modules/crm/LeadPipelineTracking';
import LeadConversionTracking from '../../modules/crm/LeadConversionTracking';
import FollowUps from '../../modules/crm/FollowUps';
import CRMMeetings from '../../modules/crm/Meetings';
import Activities from '../../modules/crm/Activities';
import DoctorCRM from '../../modules/crm/DoctorCRM';
import DistributorCRM from '../../modules/crm/DistributorCRM';
import SalesPipeline from '../../modules/crm/SalesPipeline';

// Finance Module
import PartyLedger from '../../modules/finance/PartyLedger';
import Outstanding from '../../modules/finance/Outstanding';
import AgingReports from '../../modules/finance/AgingReports';
import FinancePayments from '../../modules/finance/Payments';
import Commission from '../../modules/finance/Commission';
import ProfitLoss from '../../modules/finance/ProfitLoss';
import BalanceSheet from '../../modules/finance/BalanceSheet';
import GSTReports from '../../modules/finance/GSTReports';
import HelpSupport from '../../pages/HelpSupport';
import ChangePassword from '../../pages/ChangePassword';
import MyProfile from '../../pages/MyProfile';
import BankReconciliation from '../../modules/finance/BankReconciliation';

// Notifications Module
import PaymentAlerts from '../../modules/notifications/PaymentAlerts';
import MeetingReminders from '../../modules/notifications/MeetingReminders';
import FollowUpReminders from '../../modules/notifications/FollowUpReminders';
import ExpiryAlerts from '../../modules/notifications/ExpiryAlerts';
import ReorderAlerts from '../../modules/notifications/ReorderAlerts';
import DispatchAlerts from '../../modules/notifications/DispatchAlerts';
import ActivityNotifications from '../../modules/notifications/ActivityNotifications';

// Settings Module
import ProfileSettings from '../../modules/settings/ProfileSettings';
import CompanySettings from '../../modules/settings/CompanySettings';
import BranchSettings from '../../modules/settings/BranchSettings';
import UserManagement from '../../modules/settings/UserManagement';
import RolesPermissions from '../../modules/settings/RolesPermissions';
import SystemSettings from '../../modules/settings/SystemSettings';

// Super Admin Module
import RoleBasedAccess from '../../modules/super-admin/RoleBasedAccess';
import AdminManagement from '../../modules/super-admin/AdminManagement';
import AllIndiaSales from '../../modules/super-admin/AllIndiaSales';
import StatePerformance from '../../modules/super-admin/StatePerformance';
import ProductProfitability from '../../modules/super-admin/ProductProfitability';
import LiveStockMonitoring from '../../modules/super-admin/LiveStockMonitoring';
import PendingPaymentTracking from '../../modules/super-admin/PendingPaymentTracking';
import DispatchMonitoring from '../../modules/super-admin/DispatchMonitoring';
import FranchiseMonitoring from '../../modules/super-admin/FranchiseMonitoring';
import ExportOrderMonitoring from '../../modules/super-admin/ExportOrderMonitoring';
import SuperAdminNotificationCenter from '../../modules/super-admin/NotificationCenter';
import UserActivityLogs from '../../modules/super-admin/UserActivityLogs';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/workspace',
    element: <WorkspaceSelection />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/workspace/dashboard',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <App />,
      },
    ],
  },
  {
    path: '/workspace/super-admin',
    element: <MainLayout />,
    children: [
      {
        element: <ProtectedRoute moduleLabel="Super Admin" />,
        children: [
          { path: 'role-based-access', element: <RoleBasedAccess /> },
          { path: 'admin-management', element: <AdminManagement /> },
          { path: 'all-india-sales', element: <AllIndiaSales /> },
          { path: 'state-performance', element: <StatePerformance /> },
          { path: 'product-profitability', element: <ProductProfitability /> },
          { path: 'live-stock-monitoring', element: <LiveStockMonitoring /> },
          { path: 'pending-payment-tracking', element: <PendingPaymentTracking /> },
          { path: 'dispatch-monitoring', element: <DispatchMonitoring /> },
          { path: 'franchise-monitoring', element: <FranchiseMonitoring /> },
          { path: 'export-order-monitoring', element: <ExportOrderMonitoring /> },
          { path: 'notification-center', element: <SuperAdminNotificationCenter /> },
          { path: 'user-activity-logs', element: <UserActivityLogs /> },
        ],
      }
    ],
  },
  {
    path: '/workspace/products',
    element: <MainLayout />,
    children: [
      {
        element: <ProtectedRoute moduleLabel="Product Management" />,
        children: [
          { path: 'master', element: <ProductMaster /> },
          { path: 'batches', element: <BatchManagement /> },
          { path: 'expiry-tracking', element: <ExpiryTracking /> },
          { path: 'mrp-management', element: <MRPManagement /> },
          { path: 'pricing', element: <PricingManagement /> },
          { path: 'gst', element: <GSTManagement /> },
          { path: 'barcodes', element: <BarcodeManagement /> },
          { path: 'compositions', element: <CompositionManagement /> },
          { path: 'packing-types', element: <PackingTypeManagement /> },
          { path: 'schemes', element: <SchemeManagement /> },
        ],
      }
    ],
  },
  {
    path: '/workspace/inventory',
    element: <MainLayout />,
    children: [
      {
        element: <ProtectedRoute moduleLabel="Inventory & Warehouse Management" />,
        children: [
          { path: 'overview', element: <InventoryOverview /> },
          { path: 'multi-location', element: <MultiLocationStock /> },
          { path: 'batch-wise-stock-tracking', element: <BatchWiseStockTracking /> },
          { path: 'inward', element: <InwardStock /> },
          { path: 'outward', element: <OutwardStock /> },
          { path: 'transfer', element: <WarehouseTransfer /> },
          { path: 'company-wise-inventory-tracking', element: <CompanyWiseInventoryTracking /> },
          { path: 'dead-stock', element: <DeadStock /> },
          { path: 'expiry-stock', element: <ExpiryStock /> },
          { path: 'alerts', element: <LowStockAlerts /> },
        ],
      }
    ],
  },
  {
    path: '/workspace/warehouse',
    element: <MainLayout />,
    children: [
      {
        element: <ProtectedRoute moduleLabel="C&F Management" />,
        children: [
          { path: 'dispatch', element: <DispatchManagement /> },
          { path: 'challans', element: <TransportChallans /> },
          { path: 'lr-tracking', element: <LRTracking /> },
          { path: 'warehouse-transfer-tracking', element: <WarehouseTransferTracking /> },
          { path: 'delivery', element: <DeliveryTracking /> },
          { path: 'reports', element: <DispatchReports /> },
        ],
      }
    ],
  },
  {
    path: '/workspace/distributors',
    element: <MainLayout />,
    children: [
      {
        element: <ProtectedRoute moduleLabel="Distributor/Stockist Portal" />,
        children: [
          { path: 'list', element: <DistributorList /> },
          { path: 'product-catalog', element: <DistributorProductCatalog /> },
          { path: 'orders', element: <DistributorOrders /> },
          { path: 'retailer-orders', element: <DistributorRetailerOrders /> },
          { path: 'order-history', element: <OrderHistory /> },
          { path: 'outstanding', element: <OutstandingTracking /> },
          { path: 'ledgers', element: <Ledgers /> },
          { path: 'invoices', element: <Invoices /> },
          { path: 'schemes', element: <DistributorSchemes /> },
          { path: 'dispatch-tracking', element: <DispatchTracking /> },
        ],
      }
    ],
  },
  {
    path: '/workspace/retailers',
    element: <MainLayout />,
    children: [
      {
        element: <ProtectedRoute moduleLabel="Retailer Ordering System" />,
        children: [
          { path: 'list', element: <RetailerList /> },
          { path: 'catalog', element: <ProductCatalog /> },
          { path: 'offers', element: <RetailerOffers /> },
          { path: 'scheme-visibility', element: <SchemeVisibility /> },
          { path: 'orders', element: <RetailerOrders /> },
          { path: 'reorders', element: <Reorders /> },
          { path: 'invoices', element: <RetailerInvoices /> },
          { path: 'payments', element: <Payments /> },
        ],
      }
    ],
  },
  {
    path: '/workspace/billing',
    element: <MainLayout />,
    children: [
      {
        element: <ProtectedRoute moduleLabel="Wholesale Billing System" />,
        children: [
          { path: 'gst', element: <GSTBilling /> },
          { path: 'einvoice', element: <EInvoice /> },
          { path: 'ewaybill', element: <EWayBill /> },
          { path: 'pos', element: <BarcodeBilling /> },
          { path: 'multi-rate-billing', element: <MultiRateBilling /> },
          { path: 'credit-notes', element: <CreditNotes /> },
          { path: 'sales-returns', element: <SalesReturns /> },
          { path: 'expiry-returns', element: <ExpiryReturns /> },
        ],
      }
    ],
  },
  {
    path: '/workspace/mr',
    element: <MainLayout />,
    children: [
      {
        element: <ProtectedRoute moduleLabel="MR (Medical Representative)" />,
        children: [
          { path: 'doctors', element: <DoctorVisits /> },
          { path: 'chemists', element: <ChemistVisits /> },
          { path: 'orders', element: <OrderBooking /> },
          { path: 'dcr', element: <DailyReports /> },
          { path: 'targets', element: <TargetTracking /> },
          { path: 'mtp', element: <TourPlanning /> },
          { path: 'meetings', element: <Meetings /> },
          { path: 'activity-tracking', element: <ActivityTracking /> },
        ],
      }
    ],
  },
  {
    path: '/workspace/gps',
    element: <MainLayout />,
    children: [
      {
        element: <ProtectedRoute moduleLabel="GPS & Location Tracking" />,
        children: [
          { path: 'attendance', element: <Attendance /> },
          { path: 'check-in', element: <CheckIn /> },
          { path: 'check-out', element: <CheckOut /> },
          { path: 'geo-tagged-doctor-visits', element: <GeoTaggedDoctorVisits /> },
          { path: 'geo-tagged-chemist-visits', element: <GeoTaggedChemistVisits /> },
          { path: 'history', element: <RouteHistory /> },
          { path: 'territory', element: <TerritoryTracking /> },
          { path: 'live', element: <LocationTracking /> },
          { path: 'meeting-location-tracking', element: <MeetingLocationTracking /> },
        ],
      }
    ],
  },
  {
    path: '/workspace/crm',
    element: <MainLayout />,
    children: [
      {
        element: <ProtectedRoute moduleLabel="Pre-Sales CRM" />,
        children: [
          { path: 'leads', element: <Leads /> },
          { path: 'lead-assignment', element: <LeadAssignment /> },
          { path: 'lead-pipeline-tracking', element: <LeadPipelineTracking /> },
          { path: 'follow-ups', element: <FollowUps /> },
          { path: 'meetings', element: <CRMMeetings /> },
          { path: 'activities', element: <Activities /> },
          { path: 'doctors', element: <DoctorCRM /> },
          { path: 'distributors', element: <DistributorCRM /> },
          { path: 'pipeline', element: <SalesPipeline /> },
          { path: 'lead-conversion-tracking', element: <LeadConversionTracking /> },
        ],
      }
    ],
  },
  {
    path: '/workspace/finance',
    element: <MainLayout />,
    children: [
      {
        element: <ProtectedRoute moduleLabel="Accounting & Finance" />,
        children: [
          { path: 'ledger', element: <PartyLedger /> },
          { path: 'outstanding', element: <Outstanding /> },
          { path: 'aging', element: <AgingReports /> },
          { path: 'payments', element: <FinancePayments /> },
          { path: 'commission', element: <Commission /> },
          { path: 'pnl', element: <ProfitLoss /> },
          { path: 'balance-sheet', element: <BalanceSheet /> },
          { path: 'gst-reports', element: <GSTReports /> },
          { path: 'bank-reco', element: <BankReconciliation /> },
        ],
      }
    ],
  },
  {
    path: '/workspace/notifications',
    element: <MainLayout />,
    children: [
      {
        element: <ProtectedRoute moduleLabel="Alerts & Notifications" />,
        children: [
          { path: 'payments', element: <PaymentAlerts /> },
          { path: 'meeting-reminders', element: <MeetingReminders /> },
          { path: 'followup-reminders', element: <FollowUpReminders /> },
          { path: 'expiry', element: <ExpiryAlerts /> },
          { path: 'reorder', element: <ReorderAlerts /> },
          { path: 'dispatch', element: <DispatchAlerts /> },
          { path: 'activity', element: <ActivityNotifications /> },
        ],
      }
    ],
  },
  {
    path: '/workspace',
    element: <MainLayout />,
    children: [
      { path: 'profile', element: <MyProfile /> },
      { path: 'change-password', element: <ChangePassword /> },
      { path: 'help-support', element: <HelpSupport /> },
    ],
  },
  {
    path: '/workspace/settings',
    element: <MainLayout />,
    children: [
      {
        element: <ProtectedRoute moduleLabel="Settings" />,
        children: [
          { path: 'profile', element: <ProfileSettings /> },
          { path: 'company', element: <CompanySettings /> },
          { path: 'branch', element: <BranchSettings /> },
          { path: 'users', element: <UserManagement /> },
          { path: 'roles', element: <RolesPermissions /> },
          { path: 'system', element: <SystemSettings /> },
        ],
      }
    ],
  },
]);
