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
} from './components/shared';

// --- Types ---
interface DispatchRecord {
  id: string;
  dispatchNo: string;
  month: string;
  transporter: string;
  expectedDate: string; // YYYY-MM-DD
  actualDate: string | null; // YYYY-MM-DD
  status: 'In Transit' | 'Delivered' | 'Delayed' | 'Pending';
}

// --- Mock Data simulating database spanning multiple modules ---
const mockDispatches: DispatchRecord[] = [
  ...Array.from({ length: 150 }, (_, i) => ({
    id: `D-JAN-${i}`, dispatchNo: `DSP-01-${i}`, month: 'Jan', transporter: 'BlueDart',
    expectedDate: '2026-01-15', actualDate: '2026-01-14', status: 'Delivered'
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `D-JAN-DL-${i}`, dispatchNo: `DSP-01-DL-${i}`, month: 'Jan', transporter: 'BlueDart',
    expectedDate: '2026-01-15', actualDate: '2026-01-17', status: 'Delayed'
  })),
  ...Array.from({ length: 180 }, (_, i) => ({
    id: `D-FEB-${i}`, dispatchNo: `DSP-02-${i}`, month: 'Feb', transporter: 'Delhivery',
    expectedDate: '2026-02-10', actualDate: '2026-02-09', status: 'Delivered'
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `D-FEB-DL-${i}`, dispatchNo: `DSP-02-DL-${i}`, month: 'Feb', transporter: 'Delhivery',
    expectedDate: '2026-02-10', actualDate: '2026-02-12', status: 'Delayed'
  })),
  ...Array.from({ length: 220 }, (_, i) => ({
    id: `D-MAR-${i}`, dispatchNo: `DSP-03-${i}`, month: 'Mar', transporter: 'DTDC',
    expectedDate: '2026-03-20', actualDate: '2026-03-20', status: 'Delivered'
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `D-MAR-DL-${i}`, dispatchNo: `DSP-03-DL-${i}`, month: 'Mar', transporter: 'DTDC',
    expectedDate: '2026-03-20', actualDate: '2026-03-22', status: 'Delayed'
  })),
  ...Array.from({ length: 200 }, (_, i) => ({
    id: `D-APR-${i}`, dispatchNo: `DSP-04-${i}`, month: 'Apr', transporter: 'XpressBees',
    expectedDate: '2026-04-05', actualDate: '2026-04-04', status: 'Delivered'
  })),
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `D-APR-DL-${i}`, dispatchNo: `DSP-04-DL-${i}`, month: 'Apr', transporter: 'XpressBees',
    expectedDate: '2026-04-05', actualDate: '2026-04-08', status: 'Delayed'
  })),
  ...Array.from({ length: 250 }, (_, i) => ({
    id: `D-MAY-${i}`, dispatchNo: `DSP-05-${i}`, month: 'May', transporter: 'BlueDart',
    expectedDate: '2026-05-18', actualDate: '2026-05-18', status: 'Delivered'
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `D-MAY-DL-${i}`, dispatchNo: `DSP-05-DL-${i}`, month: 'May', transporter: 'Delhivery',
    expectedDate: '2026-05-18', actualDate: '2026-05-20', status: 'Delayed'
  })),
  ...Array.from({ length: 280 }, (_, i) => ({
    id: `D-JUN-${i}`, dispatchNo: `DSP-06-${i}`, month: 'Jun', transporter: 'DTDC',
    expectedDate: '2026-06-12', actualDate: '2026-06-11', status: 'Delivered'
  })),
  ...Array.from({ length: 30 }, (_, i) => ({
    id: `D-JUN-TR-${i}`, dispatchNo: `DSP-06-TR-${i}`, month: 'Jun', transporter: 'XpressBees',
    expectedDate: '2026-06-25', actualDate: null, status: 'In Transit'
  })),
] as DispatchRecord[];

const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DispatchReports() {
  const [periodFilter, setPeriodFilter] = useState('All');
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter records
  const filteredRecords = useMemo(() => {
    if (periodFilter === 'All') return mockDispatches;
    return mockDispatches.filter(d => d.month === periodFilter);
  }, [periodFilter]);

  // Derived KPIs
  const {
    totalDispatches,
    delayedShipments,
    onTimeDeliveryPercent,
    activeTransportersCount,
    volumeByMonth,
    maxVolume,
    transporterStats
  } = useMemo(() => {
    const total = filteredRecords.length;
    let delayed = 0;
    let onTime = 0;
    const transporters = new Set<string>();
    
    const monthlyData: Record<string, number> = {};
    const tStats: Record<string, { total: number; delivered: number; delayed: number }> = {};

    filteredRecords.forEach(record => {
      transporters.add(record.transporter);
      
      // Volume
      monthlyData[record.month] = (monthlyData[record.month] || 0) + 1;
      
      // Transporter aggregate
      if (!tStats[record.transporter]) {
        tStats[record.transporter] = { total: 0, delivered: 0, delayed: 0 };
      }
      tStats[record.transporter].total += 1;

      // On-time vs Delayed Logic
      // Assuming 'Delivered' strictly means on-time in this simplified mock if not explicitly 'Delayed'
      if (record.status === 'Delayed') {
        delayed += 1;
        tStats[record.transporter].delayed += 1;
      } else if (record.status === 'Delivered') {
        onTime += 1;
        tStats[record.transporter].delivered += 1;
      }
    });

    // We calculate % based on strictly completed shipments (OnTime + Delayed)
    const completed = onTime + delayed;
    const onTimePercent = completed > 0 ? ((onTime / completed) * 100).toFixed(1) : '0.0';

    // Format Volume Trend
    const volumeTrend = Object.keys(monthlyData)
      .sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b))
      .map(month => ({ month, value: monthlyData[month] }));
    const maxVolume = Math.max(...volumeTrend.map(v => v.value), 1);

    // Format Transporter Table
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
      onTimeDeliveryPercent: onTimePercent,
      activeTransportersCount: transporters.size,
      volumeByMonth: volumeTrend,
      maxVolume,
      transporterStats: tTable
    };
  }, [filteredRecords]);

  // Exports
  const getFormattedDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const exportDataArray = transporterStats.map(row => ({
    'Transporter': row.transporter,
    'Total Shipments': row.shipments,
    'Delivered': row.delivered,
    'Delayed': row.delayed,
    'Success Rate (%)': row.success
  }));

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportDataArray);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Performance');
    XLSX.writeFile(workbook, `dispatch_reports_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Transporter', 'Total Shipments', 'Delivered', 'Delayed', 'Success Rate (%)'];
    const csvContent = [
      headers.join(','),
      ...exportDataArray.map(row => 
        [`"${row.Transporter}"`, row['Total Shipments'], row['Delivered'], row['Delayed'], row['Success Rate (%)']].join(',')
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
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Dispatch & Logistics Report', 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
    doc.text(`Period: ${periodFilter === 'All' ? 'All Time' : periodFilter}`, 14, 27);
    
    doc.text(`Total Dispatches: ${totalDispatches}`, 14, 37);
    doc.text(`On-Time Delivery: ${onTimeDeliveryPercent}%`, 14, 42);
    doc.text(`Delayed Shipments: ${delayedShipments}`, 14, 47);
    doc.text(`Active Transporters: ${activeTransportersCount}`, 14, 52);

    autoTable(doc, {
      startY: 60,
      head: [['Transporter', 'Total Shipments', 'Delivered', 'Delayed', 'Success Rate (%)']],
      body: exportDataArray.map(row => [
        row.Transporter,
        row['Total Shipments'],
        row['Delivered'],
        row['Delayed'],
        row['Success Rate (%)']
      ]),
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] }
    });
    
    doc.save(`dispatch_reports_${getFormattedDate()}.pdf`);
    setShowExportMenu(false);
  };

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
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={periodFilter}
          onChange={setPeriodFilter}
          options={[
            { label: 'January', value: 'Jan' },
            { label: 'February', value: 'Feb' },
            { label: 'March', value: 'Mar' },
            { label: 'April', value: 'Apr' },
            { label: 'May', value: 'May' },
            { label: 'June', value: 'Jun' },
          ]}
          placeholder="All Periods"
        />
      </FilterBar>

      {/* KPI Cards */}
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
          title="On-Time Delivery"
          value={`${onTimeDeliveryPercent}%`}
          subtitle="Success Rate"
          icon={<TrendingUp className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />

        <SummaryCard
          title="Delayed Shipments"
          value={delayedShipments.toLocaleString()}
          subtitle="Exceeded ETA"
          icon={<AlertTriangle className="w-6 h-6" />}
          colorClass="text-red-600"
          bgClass="bg-red-50"
        />

        <SummaryCard
          title="Active Transporters"
          value={activeTransportersCount.toLocaleString()}
          subtitle="Utilized in period"
          icon={<Truck className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Dispatch Volume Trend */}
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

        {/* Transporter Performance */}
        <TableCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Transporter Performance
            </h3>

            <div className="space-y-4">
              {transporterStats.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">No transporter data for selected period.</p>
              ) : transporterStats.map((item) => (
                <div key={item.transporter}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">
                      {item.transporter}
                    </span>
                    <span className="font-medium text-slate-900">
                      {item.success}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${item.success}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TableCard>
      </div>

      {/* Performance Summary Table */}
      <TableCard>
        <div>
          <div className="px-6 py-5 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">
              Transporter Performance Summary
            </h3>
          </div>

          <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap">
                      Transporter
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap">
                      Total Shipments
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap">
                      Delivered
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap">
                      Delayed
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap">
                      Success Rate
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
                      <td className="px-6 py-3.5 text-sm font-medium text-slate-900 whitespace-nowrap">
                        {item.transporter}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-700 whitespace-nowrap">
                        {item.shipments}
                      </td>
                      <td className="px-6 py-3.5 text-sm whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                          {item.delivered}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200">
                          {item.delayed}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
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
  );
}