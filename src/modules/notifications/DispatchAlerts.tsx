// import { useState } from 'react';
// import { Truck, MapPin } from 'lucide-react';
// import {
//   PageHeader,
//   FilterBar,
//   SearchInput,
//   SelectFilter,
//   ActionButton,
//   TableCard,
//   DataTable,
//   Badge,
// } from './components/shared';
// import { type Column } from './components/shared';

// interface DispatchAlert {
//   id: string;
//   challanNo: string;
//   distributor: string;
//   expectedDelivery: string;
//   delay: string;
//   status: 'Delayed' | 'Out for Delivery' | 'Exception';
// }

// const mockData: any[] = [];

// export default function DispatchAlerts() {
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');

//   const columns: Column<DispatchAlert>[] = [
//     { key: 'challanNo', label: 'Challan No.', render: (row) => <span className="font-semibold text-slate-900">{row.challanNo}</span> },
//     { key: 'distributor', label: 'Distributor' },
//     { key: 'expectedDelivery', label: 'Expected Delivery' },
//     { key: 'delay', label: 'Delay / Issue', render: (row) => <span className={row.status === 'Exception' ? 'text-rose-600 font-bold' : 'text-slate-600'}>{row.delay}</span> },
//     {
//       key: 'status',
//       label: 'Status',
//       render: (row) => {
//         const variant = row.status === 'Exception' ? 'danger' : row.status === 'Delayed' ? 'warning' : 'info';
//         return <Badge variant={variant}>{row.status}</Badge>;
//       },
//     },
//     {
//       key: 'action',
//       label: '',
//       render: () => <ActionButton variant="ghost" className="text-[#163c78] text-xs px-2 py-1"><MapPin className="w-4 h-4 mr-1" /> Track</ActionButton>
//     }
//   ];

//   const filteredData = mockData.filter((item) => {
//     const matchSearch = item.challanNo.toLowerCase().includes(search.toLowerCase());
//     const matchStatus = statusFilter ? item.status === statusFilter : true;
//     return matchSearch && matchStatus;
//   });

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Dispatch & Logistics Alerts"
//         subtitle="Track delayed shipments and transit exceptions."
//       />

//       <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-start gap-3">
//         <Truck className="w-5 h-5 text-indigo-600 mt-0.5" />
//         <div>
//           <h3 className="text-sm font-semibold text-indigo-800">Transit Exception Reported</h3>
//           <p className="text-sm text-indigo-700 mt-1">Challan CHL/26/110 reported transit damage. Please contact logistics partner.</p>
//         </div>
//       </div>

//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search challan..." />
//         <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//         <SelectFilter
//           value={statusFilter}
//           onChange={setStatusFilter}
//           options={[
//             { label: 'Delayed', value: 'Delayed' },
//             { label: 'Out for Delivery', value: 'Out for Delivery' },
//             { label: 'Exception', value: 'Exception' },
//           ]}
//           placeholder="All Statuses"
//         />
//       </FilterBar>

//       <TableCard>
//         <DataTable
//           columns={columns}
//           data={filteredData}
//           emptyMessage="No active dispatch alerts."
//         />
//       </TableCard>
//     </div>
//   );
// }



/////////////////////////////////////////////////////////////////////



import { useState, useEffect, useMemo } from 'react';
import { Truck, MapPin, AlertTriangle, Clock, Package } from 'lucide-react';
import { dispatchService } from '../../services/dispatchService';
import authService from '../../services/authService';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  SummaryCard
} from './components/shared';
import { type Column } from './components/shared';

interface DispatchAlert {
  id: string;
  challanNo: string;
  distributor: string;
  expectedDelivery: string;
  delay: string;
  status: 'Delayed' | 'Out for Delivery' | 'Exception';
}

const mockData: any[] = [];

export default function DispatchAlerts() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [data, setData] = useState<DispatchAlert[]>([]);

  const loggedInDistributorCode = useMemo(() => {
    const user = authService.getCurrentUser();
    const role = localStorage.getItem('activeRole') || (user as any)?.role || '';
    if (role === 'SUPER_ADMIN') return 'DIST-001';
    return (user as any)?.linkedDistributorCode || (user as any)?.distributorCode || 'DIST-001';
  }, []);

  useEffect(() => {
    async function loadAlerts() {
      let dispatches: any[] = [];
      try {
        const res = await dispatchService.getAll();
        if (Array.isArray(res)) {
          dispatches = res;
        }
      } catch (e) {
        console.error("Failed to load dispatches:", e);
      }

      const inbound = dispatches
        .filter((d: any) => !loggedInDistributorCode || d.distributorCode === loggedInDistributorCode)
        .map((d: any) => ({
          id: d.id || d.dispatchNo,
          challanNo: d.dispatchNo || 'N/A',
          distributor: d.distributorName || 'Metro Pharma Distributors',
          expectedDelivery: d.expectedDeliveryDate || 'TBD',
          delay: d.dispatchStatus === 'Delayed' ? '2 Days' : (d.dispatchStatus === 'Exception' ? 'Transit Exception' : '-'),
          status: (d.dispatchStatus === 'Exception' ? 'Exception' : (d.dispatchStatus === 'Delayed' ? 'Delayed' : 'Out for Delivery')) as any
        }));

      const outboundRaw = localStorage.getItem('pharma_erp_outbound_dispatches');
      let outbound: any[] = [];
      if (outboundRaw) {
        try {
          const parsed = JSON.parse(outboundRaw);
          if (Array.isArray(parsed)) {
            outbound = parsed
              .filter((d: any) => !loggedInDistributorCode || d.distributorCode === loggedInDistributorCode)
              .map((d: any) => ({
                id: d.id || d.dispatchNo,
                challanNo: d.dispatchNo || 'N/A',
                distributor: d.retailerName || d.retailer || 'Unknown Retailer',
                expectedDelivery: d.expectedDeliveryDate || 'TBD',
                delay: d.status === 'Delayed' ? '1 Day' : (d.status === 'Exception' ? 'Transit Issue' : '-'),
                status: (d.status === 'Exception' ? 'Exception' : (d.status === 'Delayed' ? 'Delayed' : 'Out for Delivery')) as any
              }));
          }
        } catch (e) {}
      }

      const combined = [...inbound, ...outbound].filter(
        d => d.status === 'Delayed' || d.status === 'Exception' || d.status === 'Out for Delivery'
      );

      setData(combined.length > 0 ? combined : mockData);
    }

    loadAlerts();
  }, [loggedInDistributorCode]);

  const columns: Column<DispatchAlert>[] = [
    { key: 'challanNo', label: 'Challan No.', render: (row) => <span className="font-semibold text-slate-900">{row.challanNo}</span> },
    { key: 'distributor', label: 'Distributor' },
    { key: 'expectedDelivery', label: 'Expected Delivery' },
    { key: 'delay', label: 'Delay / Issue', render: (row) => <span className={row.status === 'Exception' ? 'text-rose-600 font-bold' : 'text-slate-600'}>{row.delay}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Exception' ? 'danger' : row.status === 'Delayed' ? 'warning' : 'info';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      // 🛡️ Enterprise Feature: Changed to "Track Shipment"
      render: () => <ActionButton variant="ghost" className="text-[#163c78] text-xs px-2 py-1"><MapPin className="w-4 h-4 mr-1" /> Track Shipment</ActionButton>
    }
  ];

  const filteredData = data.filter((item) => {
    const matchSearch = item.challanNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const totalAlerts = data.length;
  const delayedCount = data.filter(m => m.status === 'Delayed').length;
  const exceptionsCount = data.filter(m => m.status === 'Exception').length;
  const transitCount = data.filter(m => m.status === 'Out for Delivery').length;

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Dispatch & Logistics Alerts"
        subtitle="Track delayed shipments and transit exceptions."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Exceptions"
          value={exceptionsCount.toString()}
          subtitle="Requires immediate action"
          icon={<AlertTriangle className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
        <SummaryCard
          title="Delayed Shipments"
          value={delayedCount.toString()}
          subtitle="Behind schedule"
          icon={<Clock className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="In Transit"
          value={transitCount.toString()}
          subtitle="Out for delivery"
          icon={<Truck className="w-6 h-6" />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
        <SummaryCard
          title="Total Alerts"
          value={totalAlerts.toString()}
          subtitle="All dispatch notifications"
          icon={<Package className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Truck className="w-5 h-5 text-indigo-600 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-indigo-800">Transit Exception Reported</h3>
          {/* 🛡️ Enterprise Feature: Advanced actionable banner text */}
          <p className="text-sm text-indigo-700 mt-1">
            {exceptionsCount} {exceptionsCount === 1 ? 'challan reported' : 'challans reported'} transit damage. Immediate investigation is recommended. Please contact the logistics partner and update the dispatch status.
          </p>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search challan..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Delayed', value: 'Delayed' },
            { label: 'Out for Delivery', value: 'Out for Delivery' },
            { label: 'Exception', value: 'Exception' },
          ]}
          placeholder="All Statuses"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No active dispatch alerts."
        />
      </TableCard>
    </div>
  );
}



