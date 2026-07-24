import { useState, useRef, useEffect, useMemo } from 'react';
import { Globe, Plane, CheckCircle, AlertTriangle, Eye, Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PageHeader,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  SummaryCard
} from './components/shared';
import { type Column } from './components/shared';
import { exportOrderService, type ExportOrderRecord } from '../../services/exportOrderService';

export default function ExportOrderMonitoring() {
  const [search, setSearch] = useState('');
  
  // Filters
  const [status, setStatus] = useState('');
  const [country, setCountry] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [isExportOpen, setIsExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [orders, setOrders] = useState<ExportOrderRecord[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const data = await exportOrderService.loadOrders();
      setOrders(data);
    };
    loadData();
  }, []);

  const realData = useMemo(() => {
    return orders.map(o => ({
      ...o
    }));
  }, [orders]);

  const columns: Column<ExportOrderRecord>[] = [
    { key: 'exportOrderNo', label: 'Export Order No', render: (row) => <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{row.exportOrderNo}</span> },
    { key: 'customerName', label: 'Customer Name', render: (row) => <span className="font-semibold text-slate-900">{row.customerName}</span> },
    { key: 'destinationCountry', label: 'Destination Country', render: (row) => <span className="text-slate-700">{row.destinationCountry}</span> },
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="text-slate-600">{row.invoiceNo}</span> },
    { key: 'shipmentNo', label: 'Shipment No', render: (row) => <span className="text-slate-600">{row.shipmentNo}</span> },
    { key: 'orderValue', label: 'Order Value', render: (row) => <span className="font-bold text-slate-700">{row.orderValue}</span> },
    { key: 'dispatchDate', label: 'Dispatch Date', render: (row) => <span className="text-slate-600">{row.dispatchDate && row.dispatchDate !== '-' ? new Date(row.dispatchDate).toLocaleDateString() : '-'}</span> },
    { key: 'expectedDelivery', label: 'Expected Delivery', render: (row) => <span className="text-slate-600 font-medium">{row.expectedDelivery && row.expectedDelivery !== '-' ? new Date(row.expectedDelivery).toLocaleDateString() : '-'}</span> },
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
    }
  ];

  const filteredData = realData.filter((item) => {
    let match = true;
    if (search) {
      match = match && (
        item.exportOrderNo.toLowerCase().includes(search.toLowerCase()) || 
        item.customerName.toLowerCase().includes(search.toLowerCase()) ||
        item.destinationCountry.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (status) match = match && item.status === status;
    if (country) match = match && item.destinationCountry === country;
    
    // Simple date filtering
    if (fromDate && item.dispatchDate && item.dispatchDate !== '-') {
      match = match && new Date(item.dispatchDate) >= new Date(fromDate);
    }
    if (toDate && item.dispatchDate && item.dispatchDate !== '-') {
      match = match && new Date(item.dispatchDate) <= new Date(toDate);
    }
    return match;
  });

  // Calculate KPIs
  const totalExportOrders = filteredData.length;
  const activeShipments = filteredData.filter(item => item.status === 'Shipped' || item.status === 'Customs').length;
  const pendingCustoms = filteredData.filter(item => item.customsStatus === 'Pending' || item.customsStatus === 'Not Initiated').length;
  const totalRevenueNumber = filteredData.reduce((acc, item) => {
    // Some basic parsing if orderValueNumber doesn't exist on older records
    let val = item.orderValueNumber;
    if (val === undefined) {
       const str = String(item.orderValue).replace(/[^0-9.-]+/g, "");
       val = parseFloat(str) || 0;
    }
    return acc + val;
  }, 0);

  const formatCurrencyValue = (val: number) => {
    if (val >= 1000000) return `$ ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$ ${(val / 1000).toFixed(1)}K`;
    return `$ ${val.toLocaleString()}`;
  };

  const countryOptions = useMemo(() => {
    const countries = new Set(realData.map(r => r.destinationCountry).filter(Boolean));
    return Array.from(countries).map(c => ({ label: c, value: c }));
  }, [realData]);

  const getExportData = () => {
    const timestamp = new Date().toLocaleString();
    const activeFilters = [
      search && `Search: ${search}`,
      status && `Status: ${status}`,
      country && `Country: ${country}`,
      fromDate && `From: ${fromDate}`,
      toDate && `To: ${toDate}`
    ].filter(Boolean).join(' | ');

    return [
      ['Export Order Monitoring Report'],
      ['Generated On:', timestamp],
      ['Filters Applied:', activeFilters || 'None'],
      [''],
      ['Export Order No', 'Customer Name', 'Destination Country', 'Invoice No', 'Shipment No', 'Order Value', 'Dispatch Date', 'Expected Delivery', 'Customs Status', 'Status'],
      ...filteredData.map(item => [
        item.exportOrderNo,
        item.customerName,
        item.destinationCountry,
        item.invoiceNo,
        item.shipmentNo,
        item.orderValue,
        item.dispatchDate !== '-' ? new Date(item.dispatchDate).toLocaleDateString() : '-',
        item.expectedDelivery !== '-' ? new Date(item.expectedDelivery).toLocaleDateString() : '-',
        item.customsStatus,
        item.status
      ])
    ];
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Export_Orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setIsExportOpen(false);
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Export Orders');
    XLSX.writeFile(wb, `Export_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
    setIsExportOpen(false);
  };

  return (
    <div className="p-6">
      <PageHeader 
        title="Export Order Monitoring" 
        subtitle="Track international shipments, customs clearance, and global deliveries"
        action={
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-2 bg-[#163c78] text-white px-4 py-2 rounded-xl hover:bg-[#0c1f3d] transition-all shadow-sm hover:shadow active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span className="font-medium">Export</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-1">
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#163c78] rounded-lg transition-colors text-left"
                  >
                    <FileText className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#163c78] rounded-lg transition-colors text-left mt-1"
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard 
          title="Total Export Orders" 
          value={totalExportOrders.toString()} 
          icon={<Globe className="w-6 h-6 text-indigo-600" />} 
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-100/50 border border-indigo-200" 
        />
        <SummaryCard 
          title="Active Shipments" 
          value={activeShipments.toString()} 
          icon={<Plane className="w-6 h-6 text-blue-600" />} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-100/50 border border-blue-200" 
        />
        <SummaryCard 
          title="Export Revenue (YTD)" 
          value={formatCurrencyValue(totalRevenueNumber)} 
          icon={<CheckCircle className="w-6 h-6 text-emerald-600" />} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-100/50 border border-emerald-200" 
        />
        <SummaryCard 
          title="Pending Customs Clearance" 
          value={pendingCustoms.toString()} 
          icon={<AlertTriangle className="w-6 h-6 text-rose-600" />} 
          colorClass="text-rose-600" 
          bgClass="bg-rose-100/50 border border-rose-200 shadow-[0_0_15px_rgba(225,29,72,0.15)]" 
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search order, customer..." />
        
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
          options={countryOptions}
          placeholder="Destination Country"
        />

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border-slate-200 rounded-lg text-sm focus:ring-[#163c78] focus:border-[#163c78]"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border-slate-200 rounded-lg text-sm focus:ring-[#163c78] focus:border-[#163c78]"
          />
        </div>
      </div>

      {/* Main Table with hidden scrollbar */}
      <div className="mb-6">
        <h3 className="font-bold text-slate-800 mb-4 px-1">Active Export Shipments</h3>
        <TableCard>
          <div className="export-order-table-container">
            <DataTable columns={columns} data={filteredData} />
          </div>
        </TableCard>
      </div>
      
      <style>{`
        .export-order-table-container .overflow-x-auto {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        .export-order-table-container .overflow-x-auto::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
    </div>
  );
}
