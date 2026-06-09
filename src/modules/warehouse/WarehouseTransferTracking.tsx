import { useState } from 'react';
import { Download, Filter, ArrowRightLeft, Truck, CheckCircle2, Clock, MapPin, Package, Timer, Building2 } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
} from './components/shared';
import { type Column } from './components/shared';

interface TransferItem {
  id: string;
  transferNo: string;
  transferDate: string;
  fromWarehouse: string;
  toWarehouse: string;
  totalItems: number;
  transferValue: string;
  vehicleNo: string;
  currentStatus: 'Pending' | 'Approved' | 'In Transit' | 'Received' | 'Completed' | 'Cancelled';
  expectedArrival: string;
}

const mockData: TransferItem[] = [
  { id: '1', transferNo: 'TRN-2024-001', transferDate: '24-Oct-2024', fromWarehouse: 'Central Hub (Mumbai)', toWarehouse: 'North Zone (Delhi)', totalItems: 1450, transferValue: '₹ 4.5 L', vehicleNo: 'MH-04-AB-1234', currentStatus: 'In Transit', expectedArrival: '26-Oct-2024' },
  { id: '2', transferNo: 'TRN-2024-002', transferDate: '23-Oct-2024', fromWarehouse: 'South Zone (Chennai)', toWarehouse: 'Central Hub (Mumbai)', totalItems: 800, transferValue: '₹ 2.1 L', vehicleNo: 'TN-01-CD-5678', currentStatus: 'Completed', expectedArrival: '25-Oct-2024' },
  { id: '3', transferNo: 'TRN-2024-003', transferDate: '25-Oct-2024', fromWarehouse: 'East Zone (Kolkata)', toWarehouse: 'North Zone (Delhi)', totalItems: 320, transferValue: '₹ 1.8 L', vehicleNo: '-', currentStatus: 'Pending', expectedArrival: '28-Oct-2024' },
  { id: '4', transferNo: 'TRN-2024-004', transferDate: '24-Oct-2024', fromWarehouse: 'West Zone (Pune)', toWarehouse: 'Central Hub (Mumbai)', totalItems: 550, transferValue: '₹ 3.2 L', vehicleNo: 'MH-12-EF-9012', currentStatus: 'Approved', expectedArrival: '27-Oct-2024' },
];

const timelineSteps = ['Created', 'Approved', 'Dispatched', 'In Transit', 'Received', 'Completed'];

export default function WarehouseTransferTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<TransferItem>[] = [
    { key: 'transferNo', label: 'Transfer No', render: (row) => <span className="font-semibold text-slate-900">{row.transferNo}</span> },
    { key: 'transferDate', label: 'Transfer Date' },
    { key: 'fromWarehouse', label: 'From Warehouse', render: (row) => <span className="text-slate-700">{row.fromWarehouse}</span> },
    { key: 'toWarehouse', label: 'To Warehouse', render: (row) => <span className="text-slate-700">{row.toWarehouse}</span> },
    { key: 'totalItems', label: 'Total Items', render: (row) => <span className="font-mono text-slate-700">{row.totalItems}</span> },
    { key: 'transferValue', label: 'Transfer Value', render: (row) => <span className="font-bold text-slate-800">{row.transferValue}</span> },
    { key: 'vehicleNo', label: 'Vehicle No' },
    {
      key: 'currentStatus',
      label: 'Current Status',
      render: (row) => {
        let variant: any = 'default';
        switch (row.currentStatus) {
          case 'Completed':
          case 'Received':
            variant = 'success';
            break;
          case 'In Transit':
            variant = 'info';
            break;
          case 'Pending':
          case 'Approved':
            variant = 'warning';
            break;
          case 'Cancelled':
            variant = 'danger';
            break;
        }
        return <Badge variant={variant}>{row.currentStatus}</Badge>;
      },
    },
    { key: 'expectedArrival', label: 'Expected Arrival' },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.transferNo.toLowerCase().includes(search.toLowerCase()) || 
                        item.fromWarehouse.toLowerCase().includes(search.toLowerCase()) || 
                        item.toWarehouse.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.currentStatus === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Warehouse Transfer Tracking"
        subtitle="Track and monitor stock transfers between warehouses, C&F locations, branches, and distribution centers with complete transfer lifecycle visibility."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Report</ActionButton>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Transfers"
          value="1,248"
          subtitle="This Month"
          icon={<ArrowRightLeft className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="In Transit Transfers"
          value="45"
          subtitle="Currently moving"
          icon={<Truck className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Completed Transfers"
          value="1,180"
          subtitle="Successfully received"
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Pending Approvals"
          value="23"
          subtitle="Awaiting clearance"
          icon={<Clock className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Transfer Quantity"
          value="845k"
          subtitle="Units transferred"
          icon={<Package className="w-6 h-6" />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
        <SummaryCard
          title="Total Transfer Value"
          value="₹ 12.4 Cr"
          subtitle="Value of goods"
          icon={<MapPin className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Average Transfer Time"
          value="2.4 Days"
          subtitle="Creation to completion"
          icon={<Timer className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Most Active Warehouse"
          value="Central Hub"
          subtitle="Mumbai, MH"
          icon={<Building2 className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
      </div>

      {/* Timeline Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Live Transfer Status Example (TRN-2024-001)</h3>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 hidden md:block z-0"></div>
          {timelineSteps.map((step, index) => {
            const isCompleted = index <= 3; // 'In Transit' is index 3
            const isActive = index === 3;
            return (
              <div key={step} className="flex flex-row md:flex-col items-center gap-4 md:gap-2 relative z-10 mb-6 md:mb-0">
                <div className="hidden md:block absolute top-1/2 -left-1/2 w-full h-1 bg-primary -translate-y-1/2 z-[-1]" style={{ display: index > 0 && isCompleted ? 'block' : 'none' }}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isActive ? 'border-primary bg-primary text-white shadow-md shadow-primary/20 ring-4 ring-primary/10' : isCompleted ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white text-slate-300'}`}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-slate-300"></div>}
                </div>
                <div className="flex flex-col md:items-center">
                  <span className={`text-sm font-medium ${isActive ? 'text-primary' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{step}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search transfer no or warehouse..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Pending', value: 'Pending' },
            { label: 'Approved', value: 'Approved' },
            { label: 'In Transit', value: 'In Transit' },
            { label: 'Received', value: 'Received' },
            { label: 'Completed', value: 'Completed' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
          placeholder="Transfer Status"
        />
        {/* Additional filters can be added here such as Date Range */}
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No transfer records found."
        />
      </TableCard>
    </div>
  );
}
