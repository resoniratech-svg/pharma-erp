import { useState, useMemo, useEffect, useRef } from 'react';
import { Download, Filter, Layers, CheckCircle2, AlertTriangle, Box, ChevronDown } from 'lucide-react';
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
import { type Column } from './components/shared';
import { inventoryService } from '../../services/inventoryService';
import { getExpiryStatus, getDaysToExpiry } from "../../utils/expiryUtils";

interface BatchItem {
  id: string;
  batchNo: string;
  productName: string;
  sku: string;
  category: string;
  mfgDate: string;
  expiryDate: string;
  availableQty: number;
  warehouse: string;
  status: 'Healthy' | 'Near Expiry' | 'Expired';
  mrp: number;
  ptr: number;
  pts: number;
  barcode: string;
  createdBy: string;
  createdDate: string;
  lastUpdatedBy: string;
  lastUpdatedDate: string;
}

const getTodayDateStr = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Use an actual date parsing mapping so we can calculate dynamically
const parseDate = (dateStr: string) => {
  return new Date(dateStr);
};

// const mockData: BatchItem[] = [
//   { id: '1', batchNo: 'B-2024-001', productName: 'Amoxicillin 500mg', sku: 'PRD-001', category: 'Tablet', mfgDate: '2024-01-10', expiryDate: '2026-01-10', availableQty: 5000, warehouse: 'Main Hub', status: 'Active', mrp: 150, ptr: 100, pts: 120, barcode: '8901234567890', createdBy: 'Admin User', createdDate: '2024-01-12', lastUpdatedBy: 'Admin User', lastUpdatedDate: '2025-10-01' },
//   { id: '2', batchNo: 'B-2023-089', productName: 'Paracetamol 650mg', sku: 'PRD-002', category: 'Tablet', mfgDate: '2023-08-15', expiryDate: '2025-08-15', availableQty: 1200, warehouse: 'North Zone', status: 'Active', mrp: 50, ptr: 30, pts: 35, barcode: '8901234567891', createdBy: 'Admin User', createdDate: '2023-08-18', lastUpdatedBy: 'System', lastUpdatedDate: '2024-12-10' },
//   { id: '3', batchNo: 'B-2022-045', productName: 'Cough Syrup 100ml', sku: 'PRD-004', category: 'Syrup', mfgDate: '2022-05-01', expiryDate: '2026-07-20', availableQty: 50, warehouse: 'South Zone', status: 'Near Expiry', mrp: 100, ptr: 60, pts: 75, barcode: '8901234567892', createdBy: 'System', createdDate: '2022-05-05', lastUpdatedBy: 'Admin User', lastUpdatedDate: '2025-11-01' },
//   { id: '4', batchNo: 'B-2021-012', productName: 'Vitamin C 1000mg', sku: 'PRD-005', category: 'Tablet', mfgDate: '2021-02-20', expiryDate: '2023-02-20', availableQty: 0, warehouse: 'Main Hub', status: 'Expired', mrp: 200, ptr: 120, pts: 150, barcode: '8901234567893', createdBy: 'Admin User', createdDate: '2021-02-25', lastUpdatedBy: 'System', lastUpdatedDate: '2023-02-21' },
// ];

export default function BatchWiseStockTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [selectedBatch, setSelectedBatch] = useState<BatchItem | null>(null);
  const [inventoryData, setInventoryData] = useState<any[]>([]);

  const today = getTodayDateStr();

  // Handle clicking outside export menu to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const records = inventoryService.getAll();

    setInventoryData(records);
  }, []);

  // const calculateDaysToExpiry = (expiryDateStr: string) => {
  //   const expDate = parseDate(expiryDateStr);
  //   const diffTime = expDate.getTime() - today.getTime();
  //   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  //   return diffDays;
  // };

  // Ensure data status aligns with real date calculations dynamically for dashboard and mapping
  const dynamicData: BatchItem[] = useMemo(() => {
    return inventoryData.map((item) => {
      const daysToExpiry = getDaysToExpiry(item.expDate);
      const calculatedStatus = getExpiryStatus(item.expDate);
      return {
        id: item.id,

        batchNo: item.batchNo,

        productName: item.productName,

        sku: item.productCode || "",

        category: "",

        mfgDate: item.mfgDate,

        expiryDate: item.expDate,

        availableQty: item.availableQty,

        warehouse: item.warehouse || "Main Warehouse",

        status: calculatedStatus,

        mrp: Number(item.mrp || 0),

        ptr: Number(item.ptr || 0),

        pts: Number(item.pts || 0),

        barcode: "",

        createdBy: "System",

        createdDate: "",

        lastUpdatedBy: "System",

        lastUpdatedDate: "",
      };
    });
  }, [inventoryData, today]);

  const filteredData = dynamicData.filter((item) => {
    const matchSearch = item.productName.toLowerCase().includes(search.toLowerCase()) || item.batchNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const summaryMetrics = useMemo(() => {
    const total = dynamicData.length;
    let healthy = 0;
    let nearExpiry = 0;
    let expired = 0;

    dynamicData.forEach((item) => {
      const status = getExpiryStatus(item.expiryDate);

      if (status === "Healthy") {
        healthy++;
      } else if (status === "Near Expiry") {
        nearExpiry++;
      } else if (status === "Expired") {
        expired++;
      }
    });

    return {
      total,
      healthy,
      nearExpiry,
      expired,
    };
  }, [dynamicData, today]);

  const columns: Column<BatchItem>[] = [
    {
      key: "batchNo",
      label: "Batch No",
      render: (row) => (
        <span className="font-semibold text-slate-900">{row.batchNo}</span>
      ),
    },
    { key: "productName", label: "Product Name" },
    { key: "mfgDate", label: "MFG Date" },
    { key: "expiryDate", label: "Expiry Date" },
    {
      key: "id", // Unique key for the pseudo-column
      label: "Days To Expiry",
      render: (row) => {
        const days = getDaysToExpiry(row.expiryDate);

        if (days <= 0) {
          return <span className="text-rose-600 font-semibold">Expired</span>;
        }

        return <span>{days} Days</span>;
      },
    },
    {
      key: "availableQty",
      label: "Available Qty",
      render: (row) => (
        <span className="font-mono text-slate-700">{row.availableQty}</span>
      ),
    },
    { key: "warehouse", label: "Warehouse" },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const variant =
          row.status === "Healthy"
            ? "success"
            : row.status === "Expired"
              ? "danger"
              : "warning";

        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: "id",
      label: "Actions",
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedBatch(row);
          }}
          className="text-violet-600 font-medium hover:text-violet-800"
        >
          View
        </button>
      ),
    },
  ];

  const getFormattedDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(row => {
      const days = getDaysToExpiry(row.expiryDate);
      return {
        'Batch No': row.batchNo,
        'Product Name': row.productName,
        'MFG Date': row.mfgDate,
        'Expiry Date': row.expiryDate,
        'Days To Expiry': days <= 0 ? 'Expired' : `${days} Days`,
        'Available Qty': row.availableQty,
        'Warehouse': row.warehouse,
        'Status': row.status
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Batch Stock');
    
    const fileName = `batch_wise_stock_tracking_${getFormattedDate()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Batch No', 'Product Name', 'MFG Date', 'Expiry Date', 'Days To Expiry', 'Available Qty', 'Warehouse', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => {
        const days = getDaysToExpiry(row.expiryDate);
        return [
          row.batchNo, 
          `"${row.productName}"`, 
          row.mfgDate, 
          row.expiryDate, 
          days <= 0 ? 'Expired' : `${days} Days`, 
          row.availableQty, 
          `"${row.warehouse}"`, 
          row.status
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `batch_wise_stock_tracking_${getFormattedDate()}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Batch-wise Stock Tracking"
        subtitle="Track inventory by batch number, manufacturing date, expiry date, quantity, and stock movement."
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
                  <button
                    onClick={handleExportExcel}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    role="menuitem"
                  >
                    Export as Excel (.xlsx)
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    role="menuitem"
                  >
                    Export as CSV (.csv)
                  </button>
                </div>
              </div>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Batches"
          value={summaryMetrics.total.toLocaleString()}
          subtitle="Across all products"
          icon={<Layers className="w-6 h-6" />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
        <SummaryCard
          title="Healthy Batches"
          value={summaryMetrics.healthy.toLocaleString()}
          subtitle="Available for sale"
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Near Expiry Batches"
          value={summaryMetrics.nearExpiry.toLocaleString()}
          subtitle="Requires attention"
          icon={<AlertTriangle className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Expired Batches"
          value={summaryMetrics.expired.toLocaleString()}
          subtitle="Stock unfit for sale"
          icon={<Box className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
      </div>

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by batch or product..."
        />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "Healthy", value: "Healthy" },
            { label: "Near Expiry", value: "Near Expiry" },
            { label: "Expired", value: "Expired" },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No batches found."
        />
      </TableCard>

      {/* Batch Details Drawer */}
      <Drawer
        open={!!selectedBatch}
        onClose={() => setSelectedBatch(null)}
        title="Batch Details"
      >
        {selectedBatch && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Product Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Product Name"
                  value={selectedBatch.productName}
                />
                <DrawerField label="SKU" value={selectedBatch.sku} />
                <DrawerField label="Category" value={selectedBatch.category} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Batch Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Batch Number"
                  value={
                    <span className="font-mono text-violet-700 bg-violet-50 px-2 py-1 rounded">
                      {selectedBatch.batchNo}
                    </span>
                  }
                />
                <DrawerField
                  label="Manufacturing Date"
                  value={selectedBatch.mfgDate}
                />
                <DrawerField
                  label="Expiry Date"
                  value={selectedBatch.expiryDate}
                />
                <DrawerField
                  label="Days To Expiry"
                  value={
                    getDaysToExpiry(selectedBatch.expiryDate) <= 0 ? (
                      <span className="text-rose-600 font-semibold">
                        Expired
                      </span>
                    ) : (
                      `${getDaysToExpiry(selectedBatch.expiryDate)} Days`
                    )
                  }
                />
                <DrawerField
                  label="Available Quantity"
                  value={selectedBatch.availableQty.toLocaleString()}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Warehouse Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Warehouse / Location Name"
                  value={selectedBatch.warehouse}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Pricing Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="MRP"
                  value={`₹${selectedBatch.mrp.toFixed(2)}`}
                />
                <DrawerField
                  label="PTR"
                  value={`₹${selectedBatch.ptr.toFixed(2)}`}
                />
                <DrawerField
                  label="PTS"
                  value={`₹${selectedBatch.pts.toFixed(2)}`}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Additional Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Barcode"
                  value={
                    <span className="font-mono text-slate-500">
                      {selectedBatch.barcode}
                    </span>
                  }
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Audit Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Created By"
                  value={selectedBatch.createdBy}
                />
                <DrawerField
                  label="Created Date"
                  value={selectedBatch.createdDate}
                />
                <DrawerField
                  label="Last Updated By"
                  value={selectedBatch.lastUpdatedBy}
                />
                <DrawerField
                  label="Last Updated Date"
                  value={selectedBatch.lastUpdatedDate}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Status Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Status"
                  value={
                    <Badge
                      variant={
                        selectedBatch.status === "Healthy"
                          ? "success"
                          : selectedBatch.status === "Expired"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {selectedBatch.status}
                    </Badge>
                  }
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton
                variant="secondary"
                onClick={() => setSelectedBatch(null)}
              >
                Close
              </ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
