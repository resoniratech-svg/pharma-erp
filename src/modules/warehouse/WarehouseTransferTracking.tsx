// WarehouseTransferTracking.tsx
import { useState, useMemo, useRef, useEffect } from 'react';
import { Download, Filter, ArrowRightLeft, Truck, CheckCircle2, Clock, Eye, MapPin, ChevronDown } from 'lucide-react';
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
  SummaryCard,
  Drawer,
  DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';
import { warehouseTransferService, type TrackingRecord } from '../../services/warehouseTransferService';

export default function WarehouseTransferTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [selectedTransfer, setSelectedTransfer] = useState<TrackingRecord | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'track'>('view');

  const [trackingData, setTrackingData] = useState<TrackingRecord[]>([]);

  useEffect(() => {
    setTrackingData(warehouseTransferService.getAllTrackingRecords());

    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredData = useMemo(() => {
    return trackingData.filter((item) => {
      const matchSearch = 
        item.transferNo.toLowerCase().includes(search.toLowerCase()) || 
        item.fromWarehouse.toLowerCase().includes(search.toLowerCase()) || 
        item.toWarehouse.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter ? item.currentStatus === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, trackingData]);

  const getFormattedDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(row => ({
      'Transfer No': row.transferNo,
      'From Warehouse': row.fromWarehouse,
      'To Warehouse': row.toWarehouse,
      'Transfer Date': row.transferDate,
      'Total Quantity': row.totalQuantity,
      'Status': row.currentStatus
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transfers');
    XLSX.writeFile(workbook, `warehouse_transfers_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Transfer No', 'From Warehouse', 'To Warehouse', 'Transfer Date', 'Total Quantity', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          `"${row.transferNo}"`, `"${row.fromWarehouse}"`, `"${row.toWarehouse}"`,
          `"${row.transferDate}"`, row.totalQuantity, `"${row.currentStatus}"`
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `warehouse_transfers_${getFormattedDate()}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleOpenDrawer = (record: TrackingRecord, mode: 'view' | 'track') => {
    setDrawerMode(mode);
    setSelectedTransfer(record);
  };

  const columns: Column<TrackingRecord>[] = [
    { key: 'transferNo', label: 'Transfer No', render: (row) => <span className="font-semibold text-slate-900">{row.transferNo}</span> },
    { key: 'transferDate', label: 'Transfer Date' },
    { key: 'fromWarehouse', label: 'From Warehouse', render: (row) => <span className="text-slate-700">{row.fromWarehouse}</span> },
    { key: 'toWarehouse', label: 'To Warehouse', render: (row) => <span className="text-slate-700">{row.toWarehouse}</span> },
    { key: 'totalQuantity', label: 'Total Quantity', render: (row) => <span className="font-medium text-slate-900">{row.totalQuantity}</span> },
    {
      key: 'currentStatus',
      label: 'Status',
      render: (row) => {
        let variant: BadgeVariant = 'neutral';
        switch (row.currentStatus) {
          case 'Completed':
          case 'Received':
            variant = 'success';
            break;
          case 'In Transit':
          case 'Dispatched':
            variant = 'info';
            break;
          case 'Pending':
          case 'Approved':
            variant = 'warning';
            break;
          case 'Cancelled':
            variant = 'danger';
            break;
        }
        return <Badge variant={variant}>{row.currentStatus}</Badge>;
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
            title="Track Transfer"
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
        title="Warehouse Transfer Tracking"
        subtitle="Track and monitor stock transfers between warehouses, C&F locations, branches, and distribution centers with complete transfer lifecycle visibility."
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Transfers"
          value={trackingData.length.toString()}
          subtitle="All Time"
          icon={<ArrowRightLeft className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="In Transit Transfers"
          value={trackingData.filter(t => t.currentStatus === 'In Transit').length.toString()}
          subtitle="Currently moving"
          icon={<Truck className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Pending Approvals"
          value={trackingData.filter(t => t.currentStatus === 'Pending').length.toString()}
          subtitle="Awaiting clearance"
          icon={<Clock className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Completed Transfers"
          value={trackingData.filter(t => t.currentStatus === 'Completed').length.toString()}
          subtitle="Successfully received"
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search transfer no or warehouse..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Pending', value: 'Pending' },
            { label: 'Approved', value: 'Approved' },
            { label: 'Dispatched', value: 'Dispatched' },
            { label: 'In Transit', value: 'In Transit' },
            { label: 'Received', value: 'Received' },
            { label: 'Completed', value: 'Completed' },
          ]}
          placeholder="Transfer Status"
        />
      </FilterBar>

      <TableCard>
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No transfer records found."
          />
        </div>
      </TableCard>

      <Drawer 
        open={!!selectedTransfer} 
        onClose={() => setSelectedTransfer(null)} 
        title={drawerMode === 'view' ? "Transfer Details" : "Transfer Timeline"}
      >
        {selectedTransfer && (
          <div className="space-y-6">
            {drawerMode === 'track' && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Tracking Timeline</h3>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="space-y-6">
                    {selectedTransfer.timeline.map((event, idx) => {
                      const isLast = idx === selectedTransfer.timeline.length - 1;
                      return (
                        <div key={idx} className="relative flex gap-4">
                          {!isLast && (
                            <div className="absolute left-1.5 top-6 bottom-[-24px] w-0.5 bg-slate-200" />
                          )}
                          <div className="relative">
                            <div className={`w-3 h-3 mt-1.5 rounded-full ring-4 ring-white relative z-10 shrink-0 ${isLast ? 'bg-violet-600' : 'bg-slate-300'}`} />
                            {isLast && (
                              <div className="absolute top-1.5 left-0 w-3 h-3 rounded-full bg-violet-600 animate-ping opacity-75" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-slate-500 mb-0.5">
                              {event.date} {event.time && `• ${event.time}`}
                            </div>
                            <div className={`text-sm ${isLast ? 'font-bold text-violet-700' : 'font-semibold text-slate-900'}`}>{event.status}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {drawerMode === 'view' && (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Transfer Information</h3>
                  <div className="space-y-2">
                    <DrawerField label="Transfer No" value={<span className="font-semibold text-slate-900">{selectedTransfer.transferNo}</span>} />
                    <DrawerField label="Transfer Date" value={selectedTransfer.transferDate} />
                    <DrawerField label="Status" value={
                      <Badge variant={
                        ['Completed', 'Received'].includes(selectedTransfer.currentStatus) ? 'success' : 
                        ['In Transit', 'Dispatched'].includes(selectedTransfer.currentStatus) ? 'info' : 
                        ['Pending', 'Approved'].includes(selectedTransfer.currentStatus) ? 'warning' : 'danger'
                      }>
                        {selectedTransfer.currentStatus}
                      </Badge>
                    } />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Warehouse Information</h3>
                  <div className="space-y-2">
                    <DrawerField label="From Warehouse" value={selectedTransfer.fromWarehouse} />
                    <DrawerField label="To Warehouse" value={selectedTransfer.toWarehouse} />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Transport Information</h3>
                  <div className="space-y-2">
                    <DrawerField label="Vehicle Number" value={selectedTransfer.vehicleNo} />
                    <DrawerField label="Driver Name" value={selectedTransfer.driverName} />
                    <DrawerField label="Driver Mobile" value={selectedTransfer.driverMobile} />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Stock Summary</h3>
                  <div className="space-y-2">
                    <DrawerField label="Total Items" value={selectedTransfer.totalItems.toString()} />
                    <DrawerField label="Total Quantity" value={selectedTransfer.totalQuantity.toString()} />
                  </div>
                </div>
              </>
            )}

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <ActionButton variant="secondary" onClick={() => setSelectedTransfer(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}