// import { useState } from 'react';

// import {
//   PageHeader,
//   FilterBar,
//   SearchInput,
//   SelectFilter,
//   TableCard,
//   DataTable,
//   Badge,
// } from './components/shared';
// import { type Column } from './components/shared';

// interface NotificationLog {
//   id: string;
//   timestamp: string;
//   message: string;
//   module: string;
//   type: 'Info' | 'Warning' | 'Critical';
// }

// const mockData: NotificationLog[] = [
//   { id: '1', timestamp: 'Today, 10:30 AM', message: 'New order received from Apollo Pharmacy', module: 'Sales', type: 'Info' },
//   { id: '2', timestamp: 'Today, 09:15 AM', message: 'System Backup completed successfully', module: 'System', type: 'Info' },
//   { id: '3', timestamp: 'Yesterday, 04:00 PM', message: 'E-Way Bill Generation Failed for CHL-099', module: 'Billing', type: 'Critical' },
//   { id: '4', timestamp: 'Yesterday, 02:20 PM', message: 'GST Filing Deadline approaching in 5 days', module: 'Finance', type: 'Warning' },
// ];

// export default function ActivityNotifications() {
//   const [search, setSearch] = useState('');
//   const [typeFilter, setTypeFilter] = useState('');

//   const columns: Column<NotificationLog>[] = [
//     { key: 'timestamp', label: 'Date & Time', render: (row) => <span className="text-slate-600 text-xs">{row.timestamp}</span> },
//     { key: 'message', label: 'Message', render: (row) => <span className="font-medium text-slate-800">{row.message}</span> },
//     { key: 'module', label: 'Module', render: (row) => <span className="text-slate-500 font-mono text-xs">{row.module}</span> },
//     {
//       key: 'type',
//       label: 'Severity',
//       render: (row) => {
//         const variant = row.type === 'Critical' ? 'danger' : row.type === 'Warning' ? 'warning' : 'info';
//         return <Badge variant={variant}>{row.type}</Badge>;
//       },
//     },
//   ];

//   const filteredData = mockData.filter((item) => {
//     const matchSearch = item.message.toLowerCase().includes(search.toLowerCase());
//     const matchType = typeFilter ? item.type === typeFilter : true;
//     return matchSearch && matchType;
//   });

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Activity Notifications"
//         subtitle="Global event stream across all ERP modules."
//       />

//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search messages..." />
//         <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//         <SelectFilter
//           value={typeFilter}
//           onChange={setTypeFilter}
//           options={[
//             { label: 'Info', value: 'Info' },
//             { label: 'Warning', value: 'Warning' },
//             { label: 'Critical', value: 'Critical' },
//           ]}
//           placeholder="All Severities"
//         />
//       </FilterBar>

//       <TableCard>
//         <DataTable
//           columns={columns}
//           data={filteredData}
//           emptyMessage="No recent activity logs."
//         />
//       </TableCard>
//     </div>
//   );
// }



//////////////////////////////////////////////////////////////

import { useState, useEffect, useMemo } from 'react';
import { AlertOctagon, AlertTriangle, BellRing, Activity } from 'lucide-react';
import authService from '../../services/authService';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
  ActionButton // 🛡️ Ensure this is imported for the View Details button
} from './components/shared';
import { type Column } from './components/shared';

interface NotificationLog {
  id: string;
  timestamp: string;
  message: string;
  module: string;
  type: 'Info' | 'Warning' | 'Critical';
  status: 'Unread' | 'Read'; 
}

const mockData: NotificationLog[] = [
  { id: '1', timestamp: 'Today, 10:30 AM', message: 'New order received from Apollo Pharmacy', module: 'Sales', type: 'Info', status: 'Unread' },
  { id: '2', timestamp: 'Today, 09:15 AM', message: 'System Backup completed successfully', module: 'System', type: 'Info', status: 'Read' },
  { id: '3', timestamp: 'Yesterday, 04:00 PM', message: 'E-Way Bill Generation Failed for CHL-099', module: 'Billing', type: 'Critical', status: 'Unread' },
  { id: '4', timestamp: 'Yesterday, 02:20 PM', message: 'GST Filing Deadline approaching in 5 days', module: 'Finance', type: 'Warning', status: 'Read' },
];

export default function ActivityNotifications() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState(''); // 🛡️ New Module Filter State
  const [data, setData] = useState<NotificationLog[]>([]);

  const loggedInDistributorCode = useMemo(() => {
    const user = authService.getCurrentUser();
    const role = localStorage.getItem('activeRole') || (user as any)?.role || '';
    if (role === 'SUPER_ADMIN') return 'DIST-001';
    return (user as any)?.linkedDistributorCode || (user as any)?.distributorCode || 'DIST-001';
  }, []);

  useEffect(() => {
    // Generate dynamic notifications from real data
    const logs: NotificationLog[] = [];
    
    // 1. Retailer Orders
    try {
      const orders = JSON.parse(localStorage.getItem('pharma_erp_retailer_orders') || '[]');
      orders
        .filter((o: any) => o.distributorCode === loggedInDistributorCode)
        .slice(0, 5)
        .forEach((o: any, idx: number) => {
          logs.push({
            id: `order-${idx}`,
            timestamp: 'Today, 10:30 AM',
            message: `New order ${o.orderNo || o.id} received from ${o.retailerName || 'Retailer'}`,
            module: 'Sales',
            type: 'Info',
            status: 'Unread'
          });
        });
    } catch (e) {}

    // 2. Outbound Dispatches
    try {
      const dispatches = JSON.parse(localStorage.getItem('pharma_erp_outbound_dispatches') || '[]');
      dispatches
        .filter((d: any) => d.distributorCode === loggedInDistributorCode)
        .slice(0, 3)
        .forEach((d: any, idx: number) => {
          logs.push({
            id: `dispatch-${idx}`,
            timestamp: 'Yesterday, 02:20 PM',
            message: `Shipment ${d.dispatchNo} marked as ${d.status || 'In Transit'} for ${d.retailerName || 'Retailer'}`,
            module: 'Inventory',
            type: d.status === 'Exception' ? 'Critical' : 'Info',
            status: 'Read'
          });
        });
    } catch (e) {}

    setData(logs.length > 0 ? logs : mockData);
  }, [loggedInDistributorCode]);

  const columns: Column<NotificationLog>[] = [
    { key: 'timestamp', label: 'Date & Time', render: (row) => <span className="text-slate-600 text-xs">{row.timestamp}</span> },
    { key: 'message', label: 'Message', render: (row) => <span className="font-medium text-slate-800">{row.message}</span> },
    { key: 'module', label: 'Module', render: (row) => <span className="text-slate-500 font-mono text-xs">{row.module}</span> },
    {
      key: 'type',
      label: 'Severity',
      render: (row) => {
        const variant = row.type === 'Critical' ? 'danger' : row.type === 'Warning' ? 'warning' : 'info';
        return <Badge variant={variant}>{row.type}</Badge>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Unread' ? 'warning' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      }
    },
    // 🛡️ Enterprise Feature: Future navigation action
    {
      key: 'action',
      label: '',
      render: () => <ActionButton variant="ghost" className="text-[#163c78] text-xs px-2 py-1">View Details</ActionButton>
    }
  ];

  const filteredData = data.filter((item) => {
    const matchSearch = item.message.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter ? item.type === typeFilter : true;
    const matchModule = moduleFilter ? item.module === moduleFilter : true; // 🛡️ Added to filtering logic
    return matchSearch && matchType && matchModule;
  });

  const totalNotifications = data.length;
  const unreadCount = data.filter(m => m.status === 'Unread').length;
  const criticalLogs = data.filter(m => m.type === 'Critical').length;
  const warningLogs = data.filter(m => m.type === 'Warning').length;

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Activity Notifications"
        subtitle="Global event stream across all ERP modules."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Critical Alerts"
          value={criticalLogs.toString()}
          subtitle="High severity"
          icon={<AlertOctagon className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
        <SummaryCard
          title="Warnings"
          value={warningLogs.toString()}
          subtitle="Medium severity"
          icon={<AlertTriangle className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Unread Messages"
          value={unreadCount.toString()}
          subtitle="Needs attention"
          icon={<BellRing className="w-6 h-6" />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
        <SummaryCard
          title="Total Logs"
          value={totalNotifications.toString()}
          subtitle="Across all modules"
          icon={<Activity className="w-6 h-6" />}
          colorClass="text-slate-600"
          bgClass="bg-slate-100"
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search messages..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        
        {/* 🛡️ Enterprise Feature: Module Filter */}
        <SelectFilter
          value={moduleFilter}
          onChange={setModuleFilter}
          options={[
            { label: 'Sales', value: 'Sales' },
            { label: 'System', value: 'System' },
            { label: 'Billing', value: 'Billing' },
            { label: 'Finance', value: 'Finance' },
            { label: 'CRM', value: 'CRM' },
            { label: 'Inventory', value: 'Inventory' },
          ]}
          placeholder="All Modules"
        />
        
        <SelectFilter
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { label: 'Info', value: 'Info' },
            { label: 'Warning', value: 'Warning' },
            { label: 'Critical', value: 'Critical' },
          ]}
          placeholder="All Severities"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No recent activity logs."
        />
      </TableCard>
    </div>
  );
}