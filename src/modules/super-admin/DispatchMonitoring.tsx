import { useState, useRef, useEffect, useMemo } from 'react';
import { Truck, CheckCircle2, Clock, AlertTriangle, Eye, Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
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
import { transportChallanService } from '../../services/transportChallanService';
import type { Challan } from '../../services/transportChallanService';

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
  status: 'Dispatched' | 'In Transit' | 'Delivered' | 'Delayed' | 'Generated' | 'Cancelled';
}

export default function DispatchMonitoring() {
  const [search, setSearch] = useState('');
  
  // Filters
  const [status, setStatus] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [transporter, setTransporter] = useState('');

  const [isExportOpen, setIsExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [challans, setChallans] = useState<Challan[]>([]);

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
      // In a real scenario you might await transportChallanService.loadChallans()
      const data = transportChallanService.getAllChallans();
      setChallans(data);
    };
    loadData();
  }, []);

  const realData = useMemo(() => {
    const today = new Date();
    
    return challans.map(c => {
      // We estimate Expected Delivery based on dispatchDate + 3 days if not explicitly available in Challan
      let dDate = new Date(c.dispatchDate || today);
      if (isNaN(dDate.getTime())) {
        dDate = new Date(); // fallback if still invalid
      }
      
      const expectedDel = new Date(dDate);
      expectedDel.setDate(expectedDel.getDate() + 3);

      let dStatus: Dispatch['status'] = c.status as any;
      if (dStatus === 'In Transit' && today.getTime() > expectedDel.getTime()) {
        dStatus = 'Delayed';
      }

      return {
        id: c.id,
        challanNo: c.challanNo,
        orderNo: c.orderNo || c.dispatchNo || '-',
        customerName: c.customer,
        sourceWarehouse: c.sourceWarehouse,
        destination: 'Destination Hub', // Not explicitly stored in Challan
        transporter: c.transporter,
        dispatchDate: dDate.toISOString().split('T')[0],
        expectedDelivery: expectedDel.toISOString().split('T')[0],
        status: dStatus
      } as Dispatch;
    });
  }, [challans]);

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
        if (row.status === 'Dispatched' || row.status === 'Generated') variant = 'neutral';
        if (row.status === 'Delayed' || row.status === 'Cancelled') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    }
  ];

  const filteredData = realData.filter((item) => {
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
    return match;
  });

  // Calculate KPIs
  const totalDispatches = filteredData.length;
  const inTransitCount = filteredData.filter(item => item.status === 'In Transit').length;
  const deliveredCount = filteredData.filter(item => item.status === 'Delivered').length;
  const delayedCount = filteredData.filter(item => item.status === 'Delayed').length;

  const warehouseOptions = useMemo(() => {
    const whs = new Set(realData.map(r => r.sourceWarehouse).filter(Boolean));
    return Array.from(whs).map(w => ({ label: w, value: w }));
  }, [realData]);

  const transporterOptions = useMemo(() => {
    const trans = new Set(realData.map(r => r.transporter).filter(Boolean));
    return Array.from(trans).map(t => ({ label: t, value: t }));
  }, [realData]);

  const getExportData = () => {
    const timestamp = new Date().toLocaleString();
    const activeFilters = [
      search && `Search: ${search}`,
      status && `Status: ${status}`,
      warehouse && `Warehouse: ${warehouse}`,
      transporter && `Transporter: ${transporter}`
    ].filter(Boolean).join(' | ');

    return [
      ['Dispatch Monitoring Report'],
      ['Generated On:', timestamp],
      ['Filters Applied:', activeFilters || 'None'],
      [''],
      ['Challan No', 'Order No', 'Customer Name', 'Source Warehouse', 'Destination', 'Transporter', 'Dispatch Date', 'Expected Delivery', 'Status'],
      ...filteredData.map(item => [
        item.challanNo,
        item.orderNo,
        item.customerName,
        item.sourceWarehouse,
        item.destination,
        item.transporter,
        new Date(item.dispatchDate).toLocaleDateString(),
        new Date(item.expectedDelivery).toLocaleDateString(),
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
    link.download = `Dispatch_Monitoring_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setIsExportOpen(false);
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dispatches');
    XLSX.writeFile(wb, `Dispatch_Monitoring_${new Date().toISOString().split('T')[0]}.xlsx`);
    setIsExportOpen(false);
  };

  return (
    <div className="p-6">
      <PageHeader 
        title="Dispatch Monitoring" 
        subtitle="Track logistics, carrier performance, and delivery statuses"
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
          title="Total Dispatches" 
          value={totalDispatches.toString()} 
          icon={<Truck className="w-6 h-6 text-blue-600" />} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-100/50 border border-blue-200" 
        />
        <SummaryCard 
          title="In Transit" 
          value={inTransitCount.toString()} 
          icon={<Clock className="w-6 h-6 text-indigo-600" />} 
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-100/50 border border-indigo-200" 
        />
        <SummaryCard 
          title="Delivered Successfully" 
          value={deliveredCount.toString()} 
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-100/50 border border-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
        />
        <SummaryCard 
          title="Delayed Shipments" 
          value={delayedCount.toString()} 
          icon={<AlertTriangle className="w-6 h-6 text-rose-600" />} 
          colorClass="text-rose-600" 
          bgClass="bg-rose-100/50 border border-rose-200 shadow-[0_0_15px_rgba(225,29,72,0.15)]" 
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search challan, order or customer..." />
        
        <SelectFilter
          value={status} onChange={setStatus}
          options={[
            { label: 'Generated', value: 'Generated' },
            { label: 'Dispatched', value: 'Dispatched' },
            { label: 'In Transit', value: 'In Transit' },
            { label: 'Delivered', value: 'Delivered' },
            { label: 'Delayed', value: 'Delayed' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
          placeholder="Status"
        />
        
        <SelectFilter
          value={warehouse} onChange={setWarehouse}
          options={warehouseOptions}
          placeholder="Source Warehouse"
        />

        <SelectFilter
          value={transporter} onChange={setTransporter}
          options={transporterOptions}
          placeholder="Transporter"
        />
      </div>

      {/* Main Table with hidden scrollbar */}
      <div className="mb-6">
        <h3 className="font-bold text-slate-800 mb-4 px-1">Active Shipments</h3>
        <TableCard>
          <div className="dispatch-monitoring-table-container">
            <DataTable columns={columns} data={filteredData} />
          </div>
        </TableCard>
      </div>
      
      <style>{`
        .dispatch-monitoring-table-container .overflow-x-auto {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        .dispatch-monitoring-table-container .overflow-x-auto::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
    </div>
  );
}
