import { useState, useRef, useEffect, useMemo } from 'react';
import { Download, Filter, AlertCircle, IndianRupee, Clock, ChevronDown, Trash2 } from 'lucide-react';
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
import { inventoryService } from "../../services/inventoryService";
import { batchService } from "../../services/batchService";
import { productService } from "../../services/productService";
import { warehouseService } from "../../services/warehouseService";
import { stockLedgerService } from "../../services/stockLedgerService";
import {
  getExpiryStatus,
  getDaysToExpiry,
} from "../../utils/expiryUtils";

interface CalculatedExpiryStock {
  id: string;
  productCode: string;
  productName: string;
  batchNo: string;
  barcode: string;
  warehouseId: string;
  warehouseName: string;
  expiryDate: string;
  availableQty: number;
  unitCost: number;
  daysToExpiry: number;
  estimatedLoss: number;
  status: "Healthy" | "Near Expiry" | "Expired";
  createdDate: string;
  lastUpdatedDate: string;
  createdBy: string;
  lastUpdatedBy: string;
}

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

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹ ${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹ ${(value / 100000).toFixed(2)} L`;
  return `₹ ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export default function ExpiryStock() {
  const inventory = inventoryService.getAll();
  const batches = batchService.getAll();
  const products = productService.getProducts();
  const warehouses = warehouseService.getAll();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [selectedRecord, setSelectedRecord] =
    useState<CalculatedExpiryStock | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const calculatedData: CalculatedExpiryStock[] = useMemo(() => {
    return inventory.map((stock) => {
      const batch = batches.find((b) => b.batchNo === stock.batchNo);
      const warehouse = warehouses.find((w) => w.id === stock.warehouseId);
      const product = products.find((p) => p.code === stock.productCode);

      const expiryDate = batch?.expDate ?? "";
      const daysToExpiry = getDaysToExpiry(expiryDate);
      const status = getExpiryStatus(expiryDate);
      
      return {
        id: stock.id,
        productCode: stock.productCode,
        productName: stock.productName,
        batchNo: stock.batchNo,
        barcode: batch?.barcode || product?.barcode || "",
        warehouseId: stock.warehouseId,
        warehouseName: warehouse?.name ?? "",
        expiryDate,
        availableQty: stock.availableQty,
        unitCost: Number(product?.purchasePrice ?? 0),
        estimatedLoss: stock.availableQty * Number(product?.purchasePrice ?? 0),
        daysToExpiry,
        status: status as CalculatedExpiryStock["status"],
        createdDate: batch?.createdDate || stock.lastUpdated,
        lastUpdatedDate: batch?.lastUpdatedDate || stock.lastUpdated,
        createdBy: batch?.createdBy || "System",
        lastUpdatedBy: batch?.lastUpdatedBy || "System",
      };
    });
  }, [inventory, batches, warehouses, products]);

  const dashboardMetrics = useMemo(() => {
    let totalExpiringBatches = 0;
    let expiredBatches = 0;
    let expiryStockValue = 0; 
    let estimatedLoss = 0; 

    calculatedData.forEach((c) => {
      if (c.status === "Near Expiry") {
        totalExpiringBatches++;
        expiryStockValue += c.estimatedLoss;
      }
      if (c.status === "Expired") {
        expiredBatches++;
        estimatedLoss += c.estimatedLoss;
      }
    });

    return {
      totalExpiringBatches,
      expiredBatches,
      expiryStockValue,
      estimatedLoss,
    };
  }, [calculatedData]);

  const filteredData = calculatedData.filter((item) => {
    const term = search.toLowerCase();
    const matchSearch =
      item.productName.toLowerCase().includes(term) ||
      item.productCode.toLowerCase().includes(term) ||
      item.batchNo.toLowerCase().includes(term) ||
      item.barcode.toLowerCase().includes(term) ||
      item.warehouseName.toLowerCase().includes(term);
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const statusOrder: Record<string, number> = {
    "Expired": 1,
    "Near Expiry": 2,
    "Healthy": 3,
  };

  const sortedData = [...filteredData].sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return a.daysToExpiry - b.daysToExpiry;
  });

  const columns: Column<CalculatedExpiryStock>[] = [
    {
      key: "productName",
      label: "Product Name",
    },
    {
      key: "productCode",
      label: "SKU",
    },
    {
      key: "batchNo",
      label: "Batch No",
    },
    {
      key: "warehouseName",
      label: "Warehouse",
    },
    {
      key: "availableQty",
      label: "Available Qty",
    },
    {
      key: "expiryDate",
      label: "Expiry Date",
      render: (row) => <span className={row.status === 'Expired' ? 'text-rose-600 font-semibold' : ''}>{formatDate(row.expiryDate)}</span>
    },
    {
      key: "daysToExpiry",
      label: "Days To Expiry",
      render: (row) =>
        row.daysToExpiry < 0 ? "Expired" : `${row.daysToExpiry} Days`,
    },
    {
      key: "estimatedLoss",
      label: "Estimated Loss",
      render: (row) => `₹ ${row.estimatedLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        let variant: "success" | "warning" | "danger" | "neutral" = "success";
        if (row.status === "Near Expiry") variant = "warning";
        if (row.status === "Expired") variant = "danger";
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: "id",
      label: "Actions",
      render: (row) => (
        <button
          onClick={() => setSelectedRecord(row)}
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
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
  };

  const handleDispose = (record: CalculatedExpiryStock) => {
    const inventoryRecords = inventoryService.getAll();

    const updatedInventory = inventoryRecords.map((item) => {
      if (
        item.batchNo === record.batchNo &&
        item.warehouseId === record.warehouseId
      ) {
        return {
          ...item,
          expiredQty: item.expiredQty + item.availableQty,
          availableQty: 0,
          lastUpdated: new Date().toISOString(),
        };
      }
      return item;
    });

    inventoryService.saveAll(updatedInventory);

    stockLedgerService.addRecord({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      productCode: record.productCode,
      batchNo: record.batchNo,
      warehouseId: record.warehouseId,
      transactionType: "Disposed",
      quantity: record.availableQty,
      referenceNo: "DISPOSAL",
    });

    alert("Stock disposed successfully.");
    setSelectedRecord(null);
  };

  const handleExportExcel = () => {
    const exportData = sortedData.map((row) => ({
      "Product Name": row.productName,
      SKU: row.productCode,
      "Batch No": row.batchNo,
      Warehouse: row.warehouseName,
      "Available Qty": row.availableQty,
      "Expiry Date": formatDate(row.expiryDate),
      "Days To Expiry": row.daysToExpiry < 0 ? "Expired" : row.daysToExpiry,
      "Estimated Loss": row.estimatedLoss,
      Status: row.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expiry Stock Tracking");

    const fileName = `expiry_stock_tracking_${getFormattedDate()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = [
      "Product Name",
      "SKU",
      "Batch No",
      "Warehouse",
      "Available Qty",
      "Expiry Date",
      "Days To Expiry",
      "Estimated Loss",
      "Status",
    ];
    const csvContent = [
      headers.join(","),
      ...sortedData.map((row) =>
        [
          `"${row.productName}"`,
          `"${row.productCode}"`,
          `"${row.batchNo}"`,
          `"${row.warehouseName}"`,
          row.availableQty,
          formatDate(row.expiryDate),
          row.daysToExpiry < 0 ? "Expired" : row.daysToExpiry,
          row.estimatedLoss,
          row.status,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const fileName = `expiry_stock_tracking_${getFormattedDate()}.csv`;
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Expiry Stock Tracking"
        subtitle="Monitor expired batches and items nearing expiration."
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton
              variant="secondary"
              icon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export Report
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
          title="Total Expiring Batches"
          value={dashboardMetrics.totalExpiringBatches.toString()}
          subtitle="Within threshold"
          icon={<Clock className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Expired Batches"
          value={dashboardMetrics.expiredBatches.toString()}
          subtitle="Past expiry date"
          icon={<AlertCircle className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
        <SummaryCard
          title="Expiry Stock Value"
          value={formatCurrency(dashboardMetrics.expiryStockValue)}
          subtitle="Value nearing expiry"
          icon={<IndianRupee className="w-6 h-6" />}
          colorClass="text-[#163c78]"
          bgClass="bg-[#163c78]/10"
        />
        <SummaryCard
          title="Estimated Loss"
          value={formatCurrency(dashboardMetrics.estimatedLoss)}
          subtitle="Value of expired stock"
          icon={<Trash2 className="w-6 h-6" />}
          colorClass="text-slate-600"
          bgClass="bg-slate-100"
        />
      </div>

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search product, SKU, batch, barcode or warehouse..."
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
            data={sortedData}
            emptyMessage="No expiry issues found. Great job!"
          />
        </div>
      </TableCard>

      <Drawer
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Expiry Stock Details"
      >
        {selectedRecord && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Product Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Product Name"
                  value={selectedRecord.productName}
                />
                <DrawerField
                  label="Product Code"
                  value={
                    <span className="font-mono text-slate-600">
                      {selectedRecord.productCode}
                    </span>
                  }
                />
                <DrawerField
                  label="Status"
                  value={
                    <Badge
                      variant={
                        selectedRecord.status === "Expired"
                          ? "danger"
                          : selectedRecord.status === "Near Expiry"
                            ? "warning"
                            : "success"
                      }
                    >
                      {selectedRecord.status}
                    </Badge>
                  }
                />
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
                    <span className="font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                      {selectedRecord.batchNo}
                    </span>
                  }
                />
                <DrawerField
                  label="Expiry Date"
                  value={
                    <span
                      className={
                        selectedRecord.status === "Expired"
                          ? "text-rose-600 font-semibold"
                          : ""
                      }
                    >
                      {formatDate(selectedRecord.expiryDate)}
                    </span>
                  }
                />
                <div className="pt-2">
                  <DrawerField
                    label="Days To Expiry"
                    value={
                      <span
                        className={`text-lg font-bold ${selectedRecord.daysToExpiry < 0 ? "text-rose-600" : "text-amber-600"}`}
                      >
                        {selectedRecord.daysToExpiry < 0
                          ? "Expired"
                          : `${selectedRecord.daysToExpiry} Days`}
                      </span>
                    }
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Inventory Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Warehouse"
                  value={selectedRecord.warehouseName}
                />

                <DrawerField
                  label="Available Quantity"
                  value={
                    <span className="font-semibold text-slate-900">
                      {selectedRecord.availableQty.toLocaleString()}
                    </span>
                  }
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Financial Information
              </h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Unit Cost</span>
                  <span className="font-semibold text-slate-900">
                    ₹{" "}
                    {selectedRecord.unitCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                  <span className="font-medium text-slate-700">
                    Estimated Loss
                  </span>
                  <span className="text-lg font-bold text-rose-600">
                    ₹{" "}
                    {selectedRecord.estimatedLoss.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Audit Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Created By"
                  value={selectedRecord.createdBy}
                />
                <DrawerField
                  label="Created On"
                  value={formatDate(selectedRecord.createdDate)}
                />
                <DrawerField
                  label="Updated By"
                  value={selectedRecord.lastUpdatedBy}
                />
                <DrawerField
                  label="Updated On"
                  value={formatDate(selectedRecord.lastUpdatedDate)}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton
                variant="primary"
                onClick={() => handleDispose(selectedRecord)}
              >
                Dispose Stock
              </ActionButton>
              <ActionButton
                variant="secondary"
                onClick={() => setSelectedRecord(null)}
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