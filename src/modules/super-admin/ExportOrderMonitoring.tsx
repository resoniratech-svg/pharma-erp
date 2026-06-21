import { useState, useRef, useEffect } from 'react';
import { Globe, Plane, CheckCircle, AlertTriangle, Eye, Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
  ActionButton
} from './components/shared';
import { type Column } from './components/shared';

interface ExportOrder {
  id: string;
  exportOrderNo: string;
  customerName: string;
  destinationCountry: string;
  invoiceNo: string;
  shipmentNo: string;
  orderValue: string;
  dispatchDate: string;
  expectedDelivery: string;
  customsStatus: string;
  status: 'Processing' | 'Customs' | 'Shipped' | 'Delivered' | 'Cancelled';
}

const mockData: ExportOrder[] = [
  { id: '1', exportOrderNo: 'EXP-2026-001', customerName: 'MediGlobal Healthcare', destinationCountry: 'United States', invoiceNo: 'INV/EXP/26/01', shipmentNo: 'AWB-883921', orderValue: '$ 45,000', dispatchDate: '2026-10-28', expectedDelivery: '2026-11-05', customsStatus: 'Cleared', status: 'Shipped' },
  { id: '2', exportOrderNo: 'EXP-2026-002', customerName: 'NHS Supplies UK', destinationCountry: 'United Kingdom', invoiceNo: 'INV/EXP/26/02', shipmentNo: 'AWB-883922', orderValue: '£ 32,500', dispatchDate: '2026-10-30', expectedDelivery: '2026-11-10', customsStatus: 'Pending', status: 'Customs' },
  { id: '3', exportOrderNo: 'EXP-2026-003', customerName: 'Gulf Pharma LLC', destinationCountry: 'UAE', invoiceNo: 'INV/EXP/26/03', shipmentNo: 'TBD', orderValue: '$ 18,200', dispatchDate: '2026-11-15', expectedDelivery: '2026-11-20', customsStatus: 'Not Initiated', status: 'Processing' },
  { id: '4', exportOrderNo: 'EXP-2026-004', customerName: 'SingHealth Pharmacy', destinationCountry: 'Singapore', invoiceNo: 'INV/EXP/26/04', shipmentNo: 'AWB-883910', orderValue: '$ 22,000', dispatchDate: '2026-10-15', expectedDelivery: '2026-10-22', customsStatus: 'Cleared', status: 'Delivered' },
  { id: '5', exportOrderNo: 'EXP-2026-005', customerName: 'EuroMed Germany', destinationCountry: 'Germany', invoiceNo: 'INV/EXP/26/05', shipmentNo: 'N/A', orderValue: '€ 15,000', dispatchDate: '-', expectedDelivery: '-', customsStatus: 'Rejected', status: 'Cancelled' },
];

export default function ExportOrderMonitoring() {
  const [search, setSearch] = useState('');
  
  // Filters
  const [status, setStatus] = useState('');
  const [country, setCountry] = useState('');
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

  const columns: Column<ExportOrder>[] = [
    { key: 'exportOrderNo', label: 'Export Order No', render: (row) => <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{row.exportOrderNo}</span> },
    { key: 'customerName', label: 'Customer Name', render: (row) => <span className="font-semibold text-slate-900">{row.customerName}</span> },
    { key: 'destinationCountry', label: 'Destination Country', render: (row) => <span className="text-slate-700">{row.destinationCountry}</span> },
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="text-slate-600">{row.invoiceNo}</span> },
    { key: 'shipmentNo', label: 'Shipment No', render: (row) => <span className="text-slate-600">{row.shipmentNo}</span> },
    { key: 'orderValue', label: 'Order Value', render: (row) => <span className="font-bold text-slate-700">{row.orderValue}</span> },
    { key: 'dispatchDate', label: 'Dispatch Date', render: (row) => <span className="text-slate-600">{row.dispatchDate !== '-' ? new Date(row.dispatchDate).toLocaleDateString() : '-'}</span> },
    { key: 'expectedDelivery', label: 'Expected Delivery', render: (row) => <span className="text-slate-600 font-medium">{row.expectedDelivery !== '-' ? new Date(row.expectedDelivery).toLocaleDateString() : '-'}</span> },
    { key: 'customsStatus', label: 'Customs Status', render: (row) => <span className="text-slate-600">{row.customsStatus}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';
        if (row.status === 'Delivered') variant = 'success';
        if (row.status === 'Shipped') variant = 'info';
        if (row.status === 'Processing') variant = 'neutral';
        if (row.status === 'Customs') variant = 'warning';
        if (row.status === 'Cancelled') variant = 'danger';
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
        item.exportOrderNo.toLowerCase().includes(search.toLowerCase()) || 
        item.customerName.toLowerCase().includes(search.toLowerCase()) ||
        item.invoiceNo.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (status) match = match && item.status === status;
    if (country) match = match && item.destinationCountry === country;
    
    // Using dispatchDate for filter date checking
    if (fromDate) match = match && item.dispatchDate !== '-' && new Date(item.dispatchDate) >= new Date(fromDate);
    if (toDate) match = match && item.dispatchDate !== '-' && new Date(item.dispatchDate) <= new Date(toDate);

    return match;
  });

  const getExportData = () => {
    const timestamp = new Date().toLocaleString();
    const activeFilters = [
      search && `Search: ${search}`,
      status && `Status: ${status}`,
      country && `Country: ${country}`,
      fromDate && `From: ${fromDate}`,
      toDate && `To: ${toDate}`
    ].filter(Boolean).join(' | ') || 'None';

    const headerRows = [
      ['Export Order Monitoring Report'],
      [`Generated On: ${timestamp}`],
      [`Active Filters: ${activeFilters}`],
      []
    ];

    const tableHeaders = ['Export Order No', 'Customer Name', 'Destination Country', 'Invoice No', 'Shipment No', 'Order Value', 'Dispatch Date', 'Expected Delivery', 'Customs Status', 'Status'];
    const tableRows = filteredData.map(row => [
      row.exportOrderNo,
      row.customerName,
      row.destinationCountry,
      row.invoiceNo,
      row.shipmentNo,
      row.orderValue,
      row.dispatchDate,
      row.expectedDelivery,
      row.customsStatus,
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
    link.download = `Export_Order_Monitoring_Report_${dateStr}.csv`;
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
    XLSX.utils.book_append_sheet(wb, ws, "Export Orders");
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    XLSX.writeFile(wb, `Export_Order_Monitoring_Report_${dateStr}.xlsx`);
    setIsExportOpen(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Export Order Monitoring"
        subtitle="Manage international shipments, customs clearance, and global revenue."
        breadcrumb={[{ label: 'Super Admin' }, { label: 'Export Orders' }]}
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
        <SummaryCard title="Total Export Orders" value="142" icon={<Globe className="w-6 h-6" />} colorClass="text-violet-600" bgClass="bg-violet-100" />
        <SummaryCard title="Active Shipments" value="28" icon={<Plane className="w-6 h-6" />} colorClass="text-blue-600" bgClass="bg-blue-100" />
        <SummaryCard title="Export Revenue (YTD)" value="$ 1.2M" icon={<CheckCircle className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
        <SummaryCard title="Pending Customs Clearance" value="12" icon={<AlertTriangle className="w-6 h-6" />} colorClass="text-rose-600" bgClass="bg-rose-100" />
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search order, customer, invoice..." />
          <SelectFilter
            value={status} onChange={setStatus}
            options={[
              { label: 'Processing', value: 'Processing' },
              { label: 'Customs', value: 'Customs' },
              { label: 'Shipped', value: 'Shipped' },
              { label: 'Delivered', value: 'Delivered' },
              { label: 'Cancelled', value: 'Cancelled' },
            ]}
            placeholder="Status"
          />
          <SelectFilter
            value={country} onChange={setCountry}
            options={[
              { label: 'United States', value: 'United States' },
              { label: 'United Kingdom', value: 'United Kingdom' },
              { label: 'UAE', value: 'UAE' },
              { label: 'Singapore', value: 'Singapore' },
              { label: 'Germany', value: 'Germany' },
            ]}
            placeholder="Destination Country"
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
          <div className="export-order-table-container">
            <DataTable columns={columns} data={filteredData} />
          </div>
        </TableCard>
      </div>
      <style>{`
        .export-order-table-container .overflow-x-auto {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .export-order-table-container .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
