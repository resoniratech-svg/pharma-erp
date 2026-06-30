import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Download,
  TrendingUp,
  Package,
  Truck,
  AlertTriangle,
  Filter,
  ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  PageHeader,
  ActionButton,
  SummaryCard,
  TableCard,
  FilterBar,
  SelectFilter,
  SearchInput,
  DataTable,
  Badge
} from './components/shared';
import type { Column, BadgeVariant } from './components/shared';
import { transportChallanService } from '../../services/transportChallanService';

const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DispatchReports() {
  const [data, setData] = useState<any[]>([]);
  const [periodFilter, setPeriodFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [transporterFilter, setTransporterFilter] = useState('All');
  const [search, setSearch] = useState('');
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const challans = transportChallanService.getAllChallans();
    const formatted = challans.map(c => {
      const dispatchDateStr = c.dispatchDate || c.challanDate || new Date().toISOString();
      const dispatchDateObj = new Date(dispatchDateStr);
      const monthIndex = isNaN(dispatchDateObj.getTime()) ? new Date().getMonth() : dispatchDateObj.getMonth();
      const month = MONTH_ORDER[monthIndex];
      
      let deliveryStatus = c.status as string;
      if (c.status === 'Cancelled') deliveryStatus = 'Returned';
      if (c.status === 'Generated') deliveryStatus = 'Pending';
      
      return {
        id: c.id,
        dispatchNo: c.dispatchNo || '—',
        dispatchDate: c.dispatchDate || '—',
        customer: c.customer || '—',
        transporter: c.transporter || '—',
        challanNo: c.challanNo || '—',
        lrNumber: c.challanNo ? c.challanNo.replace('CHL-', 'LR-').replace('CHL', 'LR') : '—',
        deliveryStatus: deliveryStatus,
        expectedDelivery: c.challanDate || c.dispatchDate || '—',
        actualDelivery: c.actualDeliveryDate || '—',
        month
      };
    });
    setData(formatted);

    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableMonths = useMemo(() => {
    const months = new Set(data.map(d => d.month));
    return Array.from(months).sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));
  }, [data]);

  const availableTransporters = useMemo(() => {
    const trans = new Set(data.map(d => d.transporter).filter(t => t && t !== '—'));
    return Array.from(trans).sort();
  }, [data]);

  const filteredRecords = useMemo(() => {
    return data.filter(d => {
      if (periodFilter !== 'All' && d.month !== periodFilter) return false;
      if (statusFilter !== 'All' && d.deliveryStatus !== statusFilter) return false;
      if (transporterFilter !== 'All' && d.transporter !== transporterFilter) return false;
      
      if (search) {
        const s = search.toLowerCase();
        return (
          d.dispatchNo.toLowerCase().includes(s) ||
          d.challanNo.toLowerCase().includes(s) ||
          d.lrNumber.toLowerCase().includes(s) ||
          d.customer.toLowerCase().includes(s) ||
          d.transporter.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [data, periodFilter, statusFilter, transporterFilter, search]);

  const {
    totalDispatches,
    delayedShipments,
    inTransitCount,
    deliveredCount,
    onTimeDeliveryPercent,
    volumeByMonth,
    maxVolume,
    transporterStats
  } = useMemo(() => {
    const total = filteredRecords.length;
    let delayed = 0;
    let onTime = 0;
    let inTransit = 0;
    let delivered = 0;
    
    const monthlyData: Record<string, number> = {};
    const tStats: Record<string, { total: number; delivered: number; delayed: number }> = {};

    filteredRecords.forEach(record => {
      monthlyData[record.month] = (monthlyData[record.month] || 0) + 1;
      
      const t = record.transporter;
      if (t && t !== '—') {
        if (!tStats[t]) {
          tStats[t] = { total: 0, delivered: 0, delayed: 0 };
        }
        tStats[t].total += 1;
      }

      if (record.deliveryStatus === 'In Transit') {
        inTransit += 1;
      }

      if (record.deliveryStatus === 'Delivered') {
        delivered += 1;
        onTime += 1;
        if (t && t !== '—') tStats[t].delivered += 1;
      } else if (record.deliveryStatus === 'Delayed' || record.deliveryStatus === 'Returned') {
        delayed += 1;
        if (t && t !== '—') tStats[t].delayed += 1;
      }
    });

    const completed = onTime + delayed;
    const onTimePercent = completed > 0 ? ((onTime / completed) * 100).toFixed(1) : '0.0';

    const volumeTrend = Object.keys(monthlyData)
      .sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b))
      .map(month => ({ month, value: monthlyData[month] }));
    const maxVolume = Math.max(...volumeTrend.map(v => v.value), 1);

    const tTable = Object.keys(tStats).map(t => {
      const stats = tStats[t];
      const successRate = stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(1) : '0.0';
      return {
        transporter: t,
        shipments: stats.total,
        delivered: stats.delivered,
        delayed: stats.delayed,
        success: parseFloat(successRate)
      };
    }).sort((a, b) => b.shipments - a.shipments);

    return {
      totalDispatches: total,
      delayedShipments: delayed,
      inTransitCount: inTransit,
      deliveredCount: delivered,
      onTimeDeliveryPercent: onTimePercent,
      volumeByMonth: volumeTrend,
      maxVolume,
      transporterStats: tTable
    };
  }, [filteredRecords]);

  const getFormattedDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const exportDataArray = filteredRecords.map(row => ({
    'Dispatch No': row.dispatchNo,
    'Dispatch Date': row.dispatchDate,
    'Customer': row.customer,
    'Transporter': row.transporter,
    'Challan No': row.challanNo,
    'LR Number': row.lrNumber,
    'Delivery Status': row.deliveryStatus,
    'Expected Delivery': row.expectedDelivery,
    'Actual Delivery': row.actualDelivery
  }));

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportDataArray);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dispatch Report');
    XLSX.writeFile(workbook, `dispatch_reports_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Dispatch No', 'Dispatch Date', 'Customer', 'Transporter', 'Challan No', 'LR Number', 'Delivery Status', 'Expected Delivery', 'Actual Delivery'];
    const csvContent = [
      headers.join(','),
      ...exportDataArray.map(row => 
        [
          `"${row['Dispatch No']}"`, `"${row['Dispatch Date']}"`, `"${row['Customer']}"`,
          `"${row['Transporter']}"`, `"${row['Challan No']}"`, `"${row['LR Number']}"`,
          `"${row['Delivery Status']}"`, `"${row['Expected Delivery']}"`, `"${row['Actual Delivery']}"`
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dispatch_reports_${getFormattedDate()}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('Dispatch & Logistics Detailed Report', 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
    doc.text(`Period: ${periodFilter === 'All' ? 'All Time' : periodFilter}`, 14, 27);
    
    doc.text(`Total Dispatches: ${totalDispatches}`, 14, 37);
    doc.text(`Delivered: ${deliveredCount}`, 14, 42);
    doc.text(`In Transit: ${inTransitCount}`, 60, 37);
    doc.text(`Delayed: ${delayedShipments}`, 60, 42);

    autoTable(doc, {
      startY: 50,
      head: [['Dispatch No', 'Date', 'Customer', 'Transporter', 'Challan No', 'LR Number', 'Status', 'Expected', 'Actual']],
      body: exportDataArray.map(row => [
        row['Dispatch No'],
        row['Dispatch Date'],
        row['Customer'],
        row['Transporter'],
        row['Challan No'],
        row['LR Number'],
        row['Delivery Status'],
        row['Expected Delivery'],
        row['Actual Delivery']
      ]),
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] },
      styles: { fontSize: 8 }
    });
    
    doc.save(`dispatch_reports_${getFormattedDate()}.pdf`);
    setShowExportMenu(false);
  };

  const columns: Column<any>[] = [
    { key: 'dispatchNo', label: 'Dispatch No', render: (row) => <span className="font-semibold text-slate-900">{row.dispatchNo}</span> },
    { key: 'dispatchDate', label: 'Dispatch Date' },
    { key: 'customer', label: 'Customer', render: (row) => <span className="font-medium text-slate-800">{row.customer}</span> },
    { key: 'transporter', label: 'Transporter' },
    { key: 'challanNo', label: 'Challan No', render: (row) => <span className="text-slate-600">{row.challanNo}</span> },
    { key: 'lrNumber', label: 'LR Number', render: (row) => <span className="text-slate-600">{row.lrNumber}</span> },
    {
      key: 'deliveryStatus',
      label: 'Delivery Status',
      render: (row) => {
        let variant: BadgeVariant = 'neutral';
        if (row.deliveryStatus === 'Delivered') variant = 'success';
        if (row.deliveryStatus === 'In Transit') variant = 'info';
        if (row.deliveryStatus === 'Delayed' || row.deliveryStatus === 'Returned') variant = 'danger';
        if (row.deliveryStatus === 'Pending') variant = 'warning';
        return <Badge variant={variant}>{row.deliveryStatus}</Badge>;
      },
    },
    { key: 'expectedDelivery', label: 'Expected Delivery' },
    { key: 'actualDelivery', label: 'Actual Delivery', render: (row) => row.actualDelivery || '—' },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Dispatch & Logistics Reports"
        subtitle="Analytics and performance metrics for warehouse operations."
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
                  <button onClick={handleExportPDF} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export PDF (.pdf)</button>
                </div>
              </div>
            )}
          </div>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search dispatch, customer, LR..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={periodFilter}
          onChange={setPeriodFilter}
          options={[{ label: 'All Dates', value: 'All' }, ...availableMonths.map(m => ({ label: m, value: m }))]}
          placeholder="Date Range"
        />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'All Statuses', value: 'All' },
            { label: 'Pending', value: 'Pending' },
            { label: 'In Transit', value: 'In Transit' },
            { label: 'Delivered', value: 'Delivered' },
            { label: 'Delayed', value: 'Delayed' },
            { label: 'Returned', value: 'Returned' }
          ]}
          placeholder="Status"
        />
        <SelectFilter
          value={transporterFilter}
          onChange={setTransporterFilter}
          options={[{ label: 'All Transporters', value: 'All' }, ...availableTransporters.map(t => ({ label: t, value: t }))]}
          placeholder="Transporter"
        />
      </FilterBar>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Dispatches"
          value={totalDispatches.toLocaleString()}
          subtitle="Selected Period"
          icon={<Package className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />

        <SummaryCard
          title="Delivered"
          value={deliveredCount.toLocaleString()}
          subtitle={`Success Rate: ${onTimeDeliveryPercent}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />

        <SummaryCard
          title="In Transit"
          value={inTransitCount.toLocaleString()}
          subtitle="Currently Moving"
          icon={<Truck className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />

        <SummaryCard
          title="Delayed"
          value={delayedShipments.toLocaleString()}
          subtitle="Requires Action"
          icon={<AlertTriangle className="w-6 h-6" />}
          colorClass="text-red-600"
          bgClass="bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TableCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Dispatch Volume Trend
            </h3>

            <div className="space-y-4">
              {volumeByMonth.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">No volume data for selected period.</p>
              ) : volumeByMonth.map((item) => (
                <div key={item.month}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">
                      {item.month}
                    </span>
                    <span className="font-medium text-slate-900">
                      {item.value}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${(item.value / maxVolume) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TableCard>

        <TableCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Transporter Performance Summary
            </h3>

            <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap">
                        Transporter
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap">
                        Delivered
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap">
                        Delayed
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap">
                        Success
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {transporterStats.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                          No performance data available.
                        </td>
                      </tr>
                    ) : transporterStats.map((item, index) => (
                      <tr
                        key={index}
                        className="transition-colors hover:bg-violet-50/40"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                          {item.transporter}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                          {item.shipments}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            {item.delivered}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
                            {item.delayed}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                            {item.success}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TableCard>
      </div>

      <div className="mt-8">
        <TableCard>
          <div className="px-6 py-5 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Detailed Dispatch Report</h3>
          </div>
          <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
            <DataTable
              columns={columns}
              data={filteredRecords}
              emptyMessage="No dispatch records found."
            />
          </div>
        </TableCard>
      </div>
    </div>
  );
}