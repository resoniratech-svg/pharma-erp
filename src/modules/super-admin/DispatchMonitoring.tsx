import { useState } from 'react';
import { Truck, CheckCircle2, Clock } from 'lucide-react';
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

interface Dispatch {
  id: string;
  challanNo: string;
  destination: string;
  transporter: string;
  date: string;
  status: 'Delivered' | 'In Transit' | 'Delayed';
}

const mockData: Dispatch[] = [
  { id: '1', challanNo: 'CHL-9982', destination: 'Pune Depot', transporter: 'VRL Logistics', date: '02-Nov-2026', status: 'In Transit' },
  { id: '2', challanNo: 'CHL-9981', destination: 'Delhi NCR', transporter: 'SafeExpress', date: '01-Nov-2026', status: 'Delivered' },
  { id: '3', challanNo: 'CHL-9980', destination: 'Bangalore', transporter: 'Gati', date: '30-Oct-2026', status: 'Delayed' },
];

export default function DispatchMonitoring() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Dispatch>[] = [
    { key: 'challanNo', label: 'Challan No.', render: (row) => <span className="font-semibold text-slate-900">{row.challanNo}</span> },
    { key: 'destination', label: 'Destination' },
    { key: 'transporter', label: 'Transporter' },
    { key: 'date', label: 'Dispatch Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Delivered' ? 'success' : row.status === 'In Transit' ? 'info' : 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.challanNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Dispatch Monitoring"
        subtitle="Track outbound shipments and logistics performance."
        breadcrumb={[{ label: 'Super Admin' }, { label: 'Dispatch Monitoring' }]}
        actions={<ExportButton />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <SummaryCard title="Total Dispatches (MTD)" value="1,245" icon={<Truck className="w-6 h-6" />} colorClass="text-violet-600" bgClass="bg-violet-100" />
        <SummaryCard title="In Transit" value="128" icon={<Clock className="w-6 h-6" />} colorClass="text-blue-600" bgClass="bg-blue-100" />
        <SummaryCard title="Delivered Successfully" value="1,117" icon={<CheckCircle2 className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search challan..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Delivered', value: 'Delivered' },
            { label: 'In Transit', value: 'In Transit' },
            { label: 'Delayed', value: 'Delayed' },
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
