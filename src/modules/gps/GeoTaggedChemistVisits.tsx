import { useState } from 'react';
import { Download, Filter, MapPin, Store, CheckCircle2, Clock, Navigation } from 'lucide-react';
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

interface GeoChemistVisit {
  id: string;
  visitId: string;
  chemistName: string;
  mrName: string;
  territory: string;
  visitTime: string;
  latitude: string;
  longitude: string;
  distanceVerified: string;
  status: 'Verified' | 'Pending' | 'Rejected';
}

const mockData: GeoChemistVisit[] = [
  { id: '1', visitId: 'VC-2024-001', chemistName: 'Apollo Pharmacy', mrName: 'Rahul Sharma', territory: 'South Mumbai', visitTime: '10:45 AM', latitude: '18.9221° N', longitude: '72.8278° E', distanceVerified: 'Yes (< 20m)', status: 'Verified' },
  { id: '2', visitId: 'VC-2024-002', chemistName: 'Wellness Medical', mrName: 'Amit Kumar', territory: 'Andheri West', visitTime: '12:15 PM', latitude: '19.1130° N', longitude: '72.8690° E', distanceVerified: 'No (> 300m)', status: 'Rejected' },
  { id: '3', visitId: 'VC-2024-003', chemistName: 'Care Chemists', mrName: 'Rahul Sharma', territory: 'South Mumbai', visitTime: '01:30 PM', latitude: '18.9320° N', longitude: '72.8260° E', distanceVerified: 'Yes (< 40m)', status: 'Pending' },
  { id: '4', visitId: 'VC-2024-004', chemistName: 'City Medicos', mrName: 'Sanjay Patel', territory: 'Thane', visitTime: '10:30 AM', latitude: '19.2180° N', longitude: '72.9780° E', distanceVerified: 'Yes (< 15m)', status: 'Verified' },
];

export default function GeoTaggedChemistVisits() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<GeoChemistVisit>[] = [
    { key: 'visitId', label: 'Visit ID', render: (row) => <span className="font-semibold text-slate-900">{row.visitId}</span> },
    { key: 'chemistName', label: 'Chemist Name', render: (row) => <span className="font-medium text-slate-800">{row.chemistName}</span> },
    { key: 'mrName', label: 'MR Name' },
    { key: 'territory', label: 'Territory' },
    { key: 'visitTime', label: 'Visit Time' },
    { key: 'latitude', label: 'Latitude', render: (row) => <span className="font-mono text-xs text-slate-500">{row.latitude}</span> },
    { key: 'longitude', label: 'Longitude', render: (row) => <span className="font-mono text-xs text-slate-500">{row.longitude}</span> },
    { key: 'distanceVerified', label: 'Distance Verified', render: (row) => <span className={`font-semibold ${row.distanceVerified.includes('Yes') ? 'text-emerald-600' : 'text-danger-600'}`}>{row.distanceVerified}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: any = 'default';
        if (row.status === 'Verified') variant = 'success';
        else if (row.status === 'Pending') variant = 'warning';
        else if (row.status === 'Rejected') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.chemistName.toLowerCase().includes(search.toLowerCase()) || 
                        item.mrName.toLowerCase().includes(search.toLowerCase()) ||
                        item.visitId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Geo Tagged Chemist Visits"
        subtitle="Monitor chemist visits with geo-tagging, visit validation, and field activity verification."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Data</ActionButton>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Chemist Visits"
          value="845"
          subtitle="Monthly cumulative"
          icon={<Store className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Verified Visits"
          value="780"
          subtitle="Successfully validated"
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Pending Visits"
          value="45"
          subtitle="Awaiting sync/verify"
          icon={<Clock className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Coverage %"
          value="92%"
          subtitle="Territory completion"
          icon={<Navigation className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        {/* Main Content Area */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search chemist or MR name..." />
            <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Filters:</span>
            </div>
            <SelectFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'Verified', value: 'Verified' },
                { label: 'Pending', value: 'Pending' },
                { label: 'Rejected', value: 'Rejected' },
              ]}
              placeholder="Visit Status"
            />
          </FilterBar>

          <TableCard>
            <DataTable
              columns={columns}
              data={filteredData}
              emptyMessage="No geo-tagged chemist visits found."
            />
          </TableCard>
        </div>

        {/* Map Section */}
        <div className="xl:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Coverage Map</h2>
          <div className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative min-h-[400px] flex flex-col items-center justify-center shadow-inner">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-transparent to-transparent bg-[length:20px_20px]" />
            <Store className="w-12 h-12 text-primary mb-3 relative z-10 opacity-70" />
            <h3 className="text-md font-semibold text-slate-700 relative z-10">Coverage Map Placeholder</h3>
            <p className="text-sm text-slate-500 text-center px-6 mt-2 relative z-10">Visualizing chemist locations, visit pins, and territory mapping.</p>
            
            {/* Demo Pins */}
            <div className="absolute top-1/4 left-1/4">
              <MapPin className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="absolute top-1/3 right-1/3">
              <MapPin className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="absolute bottom-1/3 right-1/4">
              <MapPin className="w-6 h-6 text-indigo-500" />
            </div>
            
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg border border-slate-200 text-xs text-slate-600 flex justify-between">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 block"></span> Chemist Location</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
