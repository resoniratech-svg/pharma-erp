import { useState, useMemo, useRef, useEffect } from 'react';
import { Download, Filter, Eye, MapPin, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  Drawer,
  DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';

interface TimelineEvent {
  date: string;
  time: string;
  status: string;
}

interface LRRecord {
  id: string;
  lrNumber: string;
  customer: string;
  transporter: string;
  dispatchDate: string;
  status: 'In Transit' | 'Pending' | 'Delivered' | 'Delayed';
  dispatchId: string;
  challanNo: string;
  vehicleNo: string;
  driverName: string;
  driverMobile: string;
  deliveryAddress: string;
  currentLocation: string;
  eta: string;
  lastUpdated: string;
  timeline: TimelineEvent[];
}

const mockData: LRRecord[] = [
  { 
    id: '1', 
    lrNumber: 'LR-2026-4412', 
    customer: 'Apollo Hospitals',
    transporter: 'VRL Logistics', 
    dispatchDate: '14-Oct-2026', 
    status: 'In Transit',
    dispatchId: 'DSP-2026-001',
    challanNo: 'CHL-2026-1001',
    vehicleNo: 'TS09AB1234',
    driverName: 'Suresh',
    driverMobile: '9988776655',
    deliveryAddress: '123 Apollo Road, Jubilee Hills, Hyderabad',
    currentLocation: 'Reached Regional Hub, Pune',
    eta: '16-Oct-2026 02:00 PM',
    lastUpdated: '15-Oct-2026 10:30 AM',
    timeline: [
      { date: '14-Oct-2026', time: '09:00 AM', status: 'Dispatch Created' },
      { date: '14-Oct-2026', time: '02:00 PM', status: 'Picked Up By Transporter' },
      { date: '15-Oct-2026', time: '10:30 AM', status: 'Reached Regional Hub, Pune' }
    ]
  },
  { 
    id: '2', 
    lrNumber: 'LR-2026-4413', 
    customer: 'Care Pharmacy',
    transporter: 'Gati Express', 
    dispatchDate: '15-Oct-2026', 
    status: 'Pending',
    dispatchId: 'DSP-2026-002',
    challanNo: 'CHL-2026-1002',
    vehicleNo: 'MH02XY5678',
    driverName: 'Raju',
    driverMobile: '9876512345',
    deliveryAddress: '45 Care Avenue, Andheri West, Mumbai',
    currentLocation: 'Awaiting Pickup',
    eta: '18-Oct-2026 10:00 AM',
    lastUpdated: '15-Oct-2026 08:00 AM',
    timeline: [
      { date: '15-Oct-2026', time: '08:00 AM', status: 'Dispatch Created' }
    ]
  },
];

export default function LRTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  const [selectedLR, setSelectedLR] = useState<LRRecord | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'track'>('view');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredData = useMemo(() => {
    return mockData.filter((item) => {
      const searchStr = search.toLowerCase();
      const matchSearch = 
        item.lrNumber.toLowerCase().includes(searchStr) || 
        item.customer.toLowerCase().includes(searchStr) || 
        item.transporter.toLowerCase().includes(searchStr);
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const getFormattedDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(row => ({
      'LR No': row.lrNumber,
      'Customer': row.customer,
      'Transporter': row.transporter,
      'Dispatch Date': row.dispatchDate,
      'Status': row.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'LR Tracking');
    XLSX.writeFile(workbook, `lr_tracking_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['LR No', 'Customer', 'Transporter', 'Dispatch Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          `"${row.lrNumber}"`, `"${row.customer}"`, `"${row.transporter}"`,
          `"${row.dispatchDate}"`, `"${row.status}"`
        ].join(',')
      )
    ].join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lr_tracking_${getFormattedDate()}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleOpenDrawer = (record: LRRecord, mode: 'view' | 'track') => {
    setDrawerMode(mode);
    setSelectedLR(record);
  };

  const columns: Column<LRRecord>[] = [
    { key: 'lrNumber', label: 'LR No', render: (row) => <span className="font-semibold text-slate-900">{row.lrNumber}</span> },
    { key: 'customer', label: 'Customer', render: (row) => <span className="font-medium text-slate-800">{row.customer}</span> },
    { key: 'transporter', label: 'Transporter' },
    { key: 'dispatchDate', label: 'Dispatch Date', render: (row) => <span className="text-slate-600">{row.dispatchDate}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: BadgeVariant = 'neutral';
        if (row.status === 'Delivered') variant = 'success';
        if (row.status === 'In Transit') variant = 'info';
        if (row.status === 'Pending') variant = 'warning';
        if (row.status === 'Delayed') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenDrawer(row, 'view'); }}
            className="text-slate-400 hover:text-violet-600 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenDrawer(row, 'track'); }}
            className="text-slate-400 hover:text-violet-600 transition-colors"
            title="Track Shipment"
          >
            <MapPin className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="LR Number Tracking"
        subtitle="Track Lorry Receipts (LR) and live shipment status."
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export
              <ChevronDown className="w-3 h-3 ml-1" />
            </ActionButton>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export Excel (.xlsx)</button>
                  <button onClick={handleExportCSV} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export CSV (.csv)</button>
                </div>
              </div>
            )}
          </div>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search LR, customer or transporter..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Status:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Pending', value: 'Pending' },
            { label: 'In Transit', value: 'In Transit' },
            { label: 'Delivered', value: 'Delivered' },
            { label: 'Delayed', value: 'Delayed' },
          ]}
          placeholder="All Statuses"
        />
      </FilterBar>

      <TableCard>
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No LR records found."
          />
        </div>
      </TableCard>

      <Drawer 
        open={!!selectedLR} 
        onClose={() => setSelectedLR(null)} 
        title={drawerMode === 'view' ? "LR Details" : "Track Shipment"}
      >
        {selectedLR && (
          <div className="space-y-6">
            {drawerMode === 'track' && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Tracking Timeline</h3>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="space-y-6">
                    {selectedLR.timeline.map((event, idx) => (
                      <div key={idx} className="relative flex gap-4">
                        {idx !== selectedLR.timeline.length - 1 && (
                          <div className="absolute left-1.5 top-6 bottom-[-24px] w-0.5 bg-slate-200" />
                        )}
                        <div className="w-3 h-3 mt-1.5 rounded-full bg-violet-500 ring-4 ring-white relative z-10 shrink-0" />
                        <div>
                          <div className="text-xs font-medium text-slate-500 mb-0.5">{event.date} {event.time}</div>
                          <div className="text-sm font-semibold text-slate-900">{event.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Shipment Information</h3>
              <div className="space-y-2">
                <DrawerField label="LR Number" value={<span className="font-semibold text-slate-900">{selectedLR.lrNumber}</span>} />
                <DrawerField label="Dispatch Number" value={selectedLR.dispatchId} />
                <DrawerField label="Challan Number" value={selectedLR.challanNo} />
                <DrawerField label="Dispatch Date" value={selectedLR.dispatchDate} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Transport Information</h3>
              <div className="space-y-2">
                <DrawerField label="Transporter" value={selectedLR.transporter} />
                <DrawerField label="Vehicle Number" value={selectedLR.vehicleNo} />
                <DrawerField label="Driver Name" value={selectedLR.driverName} />
                <DrawerField label="Driver Mobile" value={selectedLR.driverMobile} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Customer Information</h3>
              <div className="space-y-2">
                <DrawerField label="Customer Name" value={selectedLR.customer} />
                <DrawerField label="Delivery Address" value={<span className="whitespace-pre-line">{selectedLR.deliveryAddress}</span>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Delivery Information</h3>
              <div className="space-y-2">
                <DrawerField label="Current Status" value={
                  <Badge variant={
                    selectedLR.status === 'Delivered' ? 'success' : 
                    selectedLR.status === 'In Transit' ? 'info' : 
                    selectedLR.status === 'Pending' ? 'warning' : 'danger'
                  }>
                    {selectedLR.status}
                  </Badge>
                } />
                <DrawerField label="Current Location" value={selectedLR.currentLocation} />
                <DrawerField label="ETA" value={selectedLR.eta} />
                <DrawerField label="Last Updated" value={selectedLR.lastUpdated} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <ActionButton variant="secondary" onClick={() => setSelectedLR(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

