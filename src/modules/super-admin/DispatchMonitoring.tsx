import { useState, useRef, useEffect } from 'react';
import { Truck, CheckCircle2, Clock, AlertTriangle, Eye, Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PageHeader,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
  ActionButton
} from './components/shared';
import { type Column } from './components/shared';

interface Dispatch {
  id: string;
  challanNo: string;
  orderNo: string;
  customerName: string;
  sourceWarehouse: string;
  destination: string;
  transporter: string;
  dispatchDate: string;
  expectedDelivery: string;
  status: 'Dispatched' | 'In Transit' | 'Delivered' | 'Delayed';
}

const mockData: Dispatch[] = [
  { id: '1', challanNo: 'CHL-9982', orderNo: 'ORD-5501', customerName: 'Apollo Pharmacy', sourceWarehouse: 'Mumbai Central', destination: 'Pune', transporter: 'VRL Logistics', dispatchDate: '2026-11-02', expectedDelivery: '2026-11-04', status: 'In Transit' },
  { id: '2', challanNo: 'CHL-9981', orderNo: 'ORD-5498', customerName: 'Global Health', sourceWarehouse: 'Delhi North', destination: 'Noida', transporter: 'SafeExpress', dispatchDate: '2026-11-01', expectedDelivery: '2026-11-02', status: 'Delivered' },
  { id: '3', challanNo: 'CHL-9980', orderNo: 'ORD-5490', customerName: 'Metro Distributors', sourceWarehouse: 'Pune Depot', destination: 'Bangalore', transporter: 'Gati', dispatchDate: '2026-10-30', expectedDelivery: '2026-11-01', status: 'Delayed' },
  { id: '4', challanNo: 'CHL-9985', orderNo: 'ORD-5510', customerName: 'LifeCare Hospitals', sourceWarehouse: 'Chennai South', destination: 'Hyderabad', transporter: 'Blue Dart', dispatchDate: '2026-11-03', expectedDelivery: '2026-11-05', status: 'Dispatched' },
  { id: '5', challanNo: 'CHL-9986', orderNo: 'ORD-5515', customerName: 'City Medicos', sourceWarehouse: 'Mumbai Central', destination: 'Nashik', transporter: 'VRL Logistics', dispatchDate: '2026-11-03', expectedDelivery: '2026-11-04', status: 'Dispatched' },
];

export default function DispatchMonitoring() {
  const [search, setSearch] = useState('');
  
  // Filters
  const [status, setStatus] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [transporter, setTransporter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [isExportOpen, setIsExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const columns: Column<Dispatch>[] = [
    { key: 'challanNo', label: 'Challan No', render: (row) => <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{row.challanNo}</span> },
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="text-slate-600">{row.orderNo}</span> },
    { key: 'customerName', label: 'Customer / Distributor', render: (row) => <span className="font-semibold text-slate-900">{row.customerName}</span> },
    { key: 'sourceWarehouse', label: 'Source Warehouse', render: (row) => <span className="text-slate-600">{row.sourceWarehouse}</span> },
    { key: 'destination', label: 'Destination', render: (row) => <span className="font-medium text-slate-800">{row.destination}</span> },
    { key: 'transporter', label: 'Transporter' },
    { key: 'dispatchDate', label: 'Dispatch Date', render: (row) => <span className="text-slate-600">{new Date(row.dispatchDate).toLocaleDateString()}</span> },
    { key: 'expectedDelivery', label: 'Expected Delivery', render: (row) => <span className="text-slate-600 font-medium">{new Date(row.expectedDelivery).toLocaleDateString()}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';
        if (row.status === 'Delivered') variant = 'success';
        if (row.status === 'In Transit') variant = 'info';
        if (row.status === 'Dispatched') variant = 'neutral';
        if (row.status === 'Delayed') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: 'Action',
      render: () => (
        <ActionButton variant="ghost">
          <Eye className="w-4 h-4 text-slate-500" />
          <span className="text-slate-600">View</span>
        </ActionButton>
      )
    }
  ];

  const filteredData = mockData.filter((item) => {
    let match = true;
    if (search) {
      match = match && (
        item.challanNo.toLowerCase().includes(search.toLowerCase()) || 
        item.orderNo.toLowerCase().includes(search.toLowerCase()) ||
        item.customerName.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (status) match = match && item.status === status;
    if (warehouse) match = match && item.sourceWarehouse === warehouse;
    if (transporter) match = match && item.transporter === transporter;
    
    if (fromDate) match = match && new Date(item.dispatchDate) >= new Date(fromDate);
    if (toDate) match = match && new Date(item.dispatchDate) <= new Date(toDate);

    return match;
  });

  const getExportData = () => {
    const timestamp = new Date().toLocaleString();
    const activeFilters = [
      search && `Search: ${search}`,
      status && `Status: ${status}`,
      warehouse && `Warehouse: ${warehouse}`,
      transporter && `Transporter: ${transporter}`,
      fromDate && `From: ${fromDate}`,
      toDate && `To: ${toDate}`
    ].filter(Boolean).join(' | ') || 'None';

    const headerRows = [
      ['Dispatch Monitoring Report'],
      [`Generated On: ${timestamp}`],
      [`Active Filters: ${activeFilters}`],
      []
    ];

    const tableHeaders = ['Challan No', 'Order No', 'Customer / Distributor', 'Source Warehouse', 'Destination', 'Transporter', 'Dispatch Date', 'Expected Delivery', 'Status'];
    const tableRows = filteredData.map(row => [
      row.challanNo,
      row.orderNo,
      row.customerName,
      row.sourceWarehouse,
      row.destination,
      row.transporter,
      row.dispatchDate,
      row.expectedDelivery,
      row.status
    ]);

    return { headerRows, tableHeaders, tableRows };
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert("No data available for export.");
      return;
    }
    
    const { headerRows, tableHeaders, tableRows } = getExportData();
    const csvContent = [
      ...headerRows.map(row => `"${row.join('","')}"`),
      `"${tableHeaders.join('","')}"`,
      ...tableRows.map(row => `"${row.join('","')}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.href = URL.createObjectURL(blob);
    link.download = `Dispatch_Report_${dateStr}.csv`;
    link.click();
    setIsExportOpen(false);
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert("No data available for export.");
      return;
    }

    const { headerRows, tableHeaders, tableRows } = getExportData();
    const wsData = [
      ...headerRows,
      tableHeaders,
      ...tableRows
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dispatch Monitoring");
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    XLSX.writeFile(wb, `Dispatch_Report_${dateStr}.xlsx`);
    setIsExportOpen(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Dispatch Monitoring"
        subtitle="Track outbound shipments and logistics performance."
        breadcrumb={[{ label: 'Super Admin' }, { label: 'Dispatch Monitoring' }]}
        actions={
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-1">
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-600 rounded-lg transition-colors text-left"
                  >
                    <FileText className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-600 rounded-lg transition-colors text-left mt-1"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export Excel (.xlsx)
                  </button>
                </div>
              </div>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard title="Total Dispatches (MTD)" value="1,245" icon={<Truck className="w-6 h-6" />} colorClass="text-violet-600" bgClass="bg-violet-100" />
        <SummaryCard title="In Transit" value="128" icon={<Clock className="w-6 h-6" />} colorClass="text-blue-600" bgClass="bg-blue-100" />
        <SummaryCard title="Delivered Successfully" value="1,117" icon={<CheckCircle2 className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
        <SummaryCard title="Delayed Shipments" value="24" icon={<AlertTriangle className="w-6 h-6" />} colorClass="text-rose-600" bgClass="bg-rose-100" />
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search challan, order..." />
          <SelectFilter
            value={status} onChange={setStatus}
            options={[
              { label: 'Dispatched', value: 'Dispatched' },
              { label: 'In Transit', value: 'In Transit' },
              { label: 'Delivered', value: 'Delivered' },
              { label: 'Delayed', value: 'Delayed' },
            ]}
            placeholder="Status"
          />
          <SelectFilter
            value={warehouse} onChange={setWarehouse}
            options={[
              { label: 'Mumbai Central', value: 'Mumbai Central' },
              { label: 'Delhi North', value: 'Delhi North' },
              { label: 'Pune Depot', value: 'Pune Depot' },
              { label: 'Chennai South', value: 'Chennai South' },
            ]}
            placeholder="Warehouse"
          />
          <SelectFilter
            value={transporter} onChange={setTransporter}
            options={[
              { label: 'VRL Logistics', value: 'VRL Logistics' },
              { label: 'SafeExpress', value: 'SafeExpress' },
              { label: 'Gati', value: 'Gati' },
              { label: 'Blue Dart', value: 'Blue Dart' },
            ]}
            placeholder="Transporter"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">From</span>
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">To</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <TableCard>
          <div className="dispatch-monitoring-table-container">
            <DataTable columns={columns} data={filteredData} />
          </div>
        </TableCard>
      </div>
      <style>{`
        .dispatch-monitoring-table-container .overflow-x-auto {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .dispatch-monitoring-table-container .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
