import { useState } from 'react';
import { Globe, Plane, CheckCircle } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  ExportButton,
  SummaryCard
} from './components/shared';
import { type Column } from './components/shared';

interface ExportOrder {
  id: string;
  orderNo: string;
  country: string;
  value: string;
  date: string;
  status: 'Processing' | 'Shipped' | 'Customs' | 'Delivered';
}

const mockData: ExportOrder[] = [
  { id: '1', orderNo: 'EXP-2026-001', country: 'United States', value: '$ 45,000', date: '28-Oct-2026', status: 'Shipped' },
  { id: '2', orderNo: 'EXP-2026-002', country: 'United Kingdom', value: '£ 32,500', date: '30-Oct-2026', status: 'Customs' },
  { id: '3', orderNo: 'EXP-2026-003', country: 'UAE', value: '$ 18,200', date: '01-Nov-2026', status: 'Processing' },
  { id: '4', orderNo: 'EXP-2026-004', country: 'Singapore', value: '$ 22,000', date: '15-Oct-2026', status: 'Delivered' },
];

export default function ExportOrderMonitoring() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<ExportOrder>[] = [
    { key: 'orderNo', label: 'Order No.', render: (row) => <span className="font-semibold text-slate-900">{row.orderNo}</span> },
    { key: 'country', label: 'Destination Country' },
    { key: 'date', label: 'Order Date' },
    { key: 'value', label: 'Value (USD/GBP)', render: (row) => <span className="font-bold text-slate-700">{row.value}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Delivered' ? 'success' : row.status === 'Processing' ? 'info' : row.status === 'Customs' ? 'warning' : 'purple';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.orderNo.toLowerCase().includes(search.toLowerCase()) || item.country.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Export Order Monitoring"
        subtitle="Manage international shipments, customs clearance, and global revenue."
        breadcrumb={[{ label: 'Super Admin' }, { label: 'Export Orders' }]}
        actions={<ExportButton />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <SummaryCard title="Total Export Orders" value="142" icon={<Globe className="w-6 h-6" />} colorClass="text-violet-600" bgClass="bg-violet-100" />
        <SummaryCard title="Active Shipments" value="28" icon={<Plane className="w-6 h-6" />} colorClass="text-blue-600" bgClass="bg-blue-100" />
        <SummaryCard title="Export Revenue (YTD)" value="$ 1.2M" icon={<CheckCircle className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search order or country..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Processing', value: 'Processing' },
            { label: 'Shipped', value: 'Shipped' },
            { label: 'Customs', value: 'Customs' },
            { label: 'Delivered', value: 'Delivered' },
          ]}
          placeholder="All Statuses"
        />
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} />
      </TableCard>
    </div>
  );
}
