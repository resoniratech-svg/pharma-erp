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
import { batchService } from "../../services/batchService";
import { productService } from "../../services/productService";

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

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "-";
  if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
    return dateString;
  }
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  }
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  return dateString;
};

export default function BatchWiseStockTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [selectedBatch, setSelectedBatch] = useState<BatchItem | null>(null);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [products] = useState(productService.getProducts());
  const [batches] = useState(batchService.getAll());

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

  // Ensure data status aligns with real date calculations dynamically for dashboard and mapping
  const dynamicData: BatchItem[] = useMemo(() => {
    return inventoryData.map((item) => {
      const batch = batches.find((b) => b.batchNo === item.batchNo && (b.productCode === item.productCode || b.productName === item.productName));
      const product = products.find(p => p.code === item.productCode || p.name === item.productName);
      
      const calculatedStatus = getExpiryStatus(batch?.expDate ?? "");
      
      return {
        id: item.id,
        batchNo: item.batchNo,
        productName: item.productName || product?.name || "",
        sku: item.productCode || product?.code || "",
        category: product?.category || "",
        mfgDate: batch?.mfgDate ?? "",
        expiryDate: batch?.expDate ?? "",
        availableQty: item.availableQty,
        warehouse: `${item.warehouseCode} - ${item.warehouseName}`,
        status: calculatedStatus,
        mrp: Number(batch?.mrp ?? 0),
        ptr: Number(batch?.ptr ?? 0),
        barcode: batch?.barcode ?? "",
        createdBy: item.createdBy || batch?.createdBy || "System",
        createdDate: item.createdDate || batch?.createdDate || "",
        lastUpdatedBy: item.lastUpdatedBy || batch?.lastUpdatedBy || "System",
        lastUpdatedDate: item.lastUpdated || batch?.lastUpdatedDate || "",
      };
    });
  }, [inventoryData, batches, products]);

  const filteredData = dynamicData.filter((item) => {
    const searchLower = search.toLowerCase();
    const matchSearch = item.productName.toLowerCase().includes(searchLower) || 
                        item.batchNo.toLowerCase().includes(searchLower) ||
                        item.sku.toLowerCase().includes(searchLower) ||
                        item.barcode.toLowerCase().includes(searchLower) ||
                        item.warehouse.toLowerCase().includes(searchLower);
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const summaryMetrics = useMemo(() => {
    const total = dynamicData.length;
    let healthy = 0;
    let nearExpiry = 0;
    let expired = 0;

    dynamicData.forEach((item) => {
      const status = item.status;

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
  }, [dynamicData]);

  const columns: Column<BatchItem>[] = [
    {
      key: "batchNo",
      label: "Batch No",
      render: (row) => (
        <span className="font-semibold text-slate-900">{row.batchNo}</span>
      ),
    },
    { key: "productName", label: "Product Name" },
    { key: "mfgDate", label: "MFG Date", render: (row) => formatDate(row.mfgDate) },
    { key: "expiryDate", label: "Expiry Date", render: (row) => formatDate(row.expiryDate) },
    {
      key: "daysToExpiry", 
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
      key: "actions",
      label: "Actions",
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedBatch(row);
          }}
          className="text-[#163c78] font-medium hover:text-[#0c1f3d]"
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
    return `${dd}-${mm}-${yyyy}`;
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(row => {
      const days = getDaysToExpiry(row.expiryDate);
      return {
        'Batch No': row.batchNo,
        'Product Name': row.productName,
        'MFG Date': formatDate(row.mfgDate),
        'Expiry Date': formatDate(row.expiryDate),
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
          formatDate(row.mfgDate), 
          formatDate(row.expiryDate), 
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
          placeholder="Search by batch, product, SKU, barcode or warehouse..."
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
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No batches found."
          />
        </div>
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
                <DrawerField label="Product Code" value={selectedBatch.sku} />
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
                    <span className="font-mono text-violet-700 bg-[#163c78]/10 px-2 py-1 rounded">
                      {selectedBatch.batchNo}
                    </span>
                  }
                />
                <DrawerField
                  label="Manufacturing Date"
                  value={formatDate(selectedBatch.mfgDate)}
                />
                <DrawerField
                  label="Expiry Date"
                  value={formatDate(selectedBatch.expiryDate)}
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
                  label="Warehouse"
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
                      {selectedBatch.barcode || "-"}
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
                  label="Created On"
                  value={formatDate(selectedBatch.createdDate)}
                />
                <DrawerField
                  label="Updated By"
                  value={selectedBatch.lastUpdatedBy}
                />
                <DrawerField
                  label="Updated On"
                  value={formatDate(selectedBatch.lastUpdatedDate)}
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