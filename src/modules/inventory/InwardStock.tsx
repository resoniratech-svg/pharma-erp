import { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Download, Filter, ChevronDown, Trash2 } from 'lucide-react';
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
  Drawer,
  DrawerField
} from './components/shared';
import { type Column } from './components/shared';
import { inwardStockService } from "../../services/inwardStockService";
import { productService } from "../../services/productService";
import { batchService, type BatchRecord } from "../../services/batchService";
import { inventoryService } from "../../services/inventoryService";
import { stockLedgerService } from "../../services/stockLedgerService";
import  activityLogService  from "../../services/activityLogService";
import authService from "../../services/authService";
import { warehouseService } from "../../services/warehouseService";

// --- Data Models ---

interface ProductLineItem {
  id: string;
  product: string;
  batchNo: string;
  mfgDate: string;
  expiryDate: string;
  quantity: number;
  ptr: number;
  mrp: number;
}

interface Inward {
  id: string;
  grnNo: string;
  date: string;
  supplier: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  itemsCount: number;
  totalQuantity: number;
  totalValue: number;
  status: "Draft" | "Pending QC" | "Completed" | "Rejected";
  products: ProductLineItem[];
  createdBy: string;
  createdDate: string;
  lastUpdatedBy: string;
  lastUpdatedDate: string;
  remarks?: string;
}

const MOCK_SUPPLIERS = ['PharmaCorp Ltd.', 'HealthPlus Inc.', 'MediCare Supply'];

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

function SearchableDropdown({
  value,
  onChange,
  options,
  placeholder,
  allowAdd,
  onAdd,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  allowAdd?: boolean;
  onAdd?: (newVal: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const selected = options.find((o) => o.value === value);
    if (selected) {
      setSearch(selected.label);
    } else {
      setSearch(value || "");
    }
  }, [value, options]);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full text-sm">
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 bg-white text-slate-900 focus:outline-none focus:border-violet-400"
      />
      <ChevronDown
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      />
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }} />
          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((opt) => (
                <div
                  key={opt.value}
                  className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer text-slate-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  {opt.label}
                </div>
              ))
            ) : allowAdd && search.trim() ? (
              <div
                className="px-3 py-2 text-sm text-violet-600 font-medium hover:bg-violet-50 cursor-pointer flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd?.(search.trim());
                  setIsOpen(false);
                }}
              >
                + Add "{search.trim()}"
              </div>
            ) : (
              <div className="px-3 py-2 text-sm text-slate-500">No results found</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function InwardStock() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [inwardRecords, setInwardRecords] = useState<Inward[]>([]);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Inward | null>(null);
  const [products] = useState(productService.getProducts());
  const [batches, setBatches] = useState<BatchRecord[]>([]);

  useEffect(() => {
    batchService.loadBatches().then(setBatches);
  }, []);

  const currentUser = authService.getCurrentUser();
  const warehouses = warehouseService
    .getAll()
    .filter((w) => w.status === "Active");

  const [suppliers, setSuppliers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("erp_suppliers");
      return saved ? JSON.parse(saved) : MOCK_SUPPLIERS;
    } catch {
      return MOCK_SUPPLIERS;
    }
  });

  // Create GRN Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    location: '',
    invoiceNumber: '',
    invoiceDate: '',
    status: 'Completed' as Inward['status'],
    remarks: '',
  });

  const [formProducts, setFormProducts] = useState<ProductLineItem[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedRecords = [...inwardRecords].sort((a, b) => {
    return Number(b.id) - Number(a.id);
  });

  const filteredData = sortedRecords.filter((item) => {
    const matchSearch = item.grnNo.toLowerCase().includes(search.toLowerCase()) || item.supplier.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const columns: Column<Inward>[] = [
    {
      key: "grnNo",
      label: "GRN Number",
      render: (row) => (
        <span className="font-semibold text-violet-700">{row.grnNo}</span>
      ),
    },
    { 
      key: "date", 
      label: "Inward Date",
      render: (row) => formatDate(row.date)
    },
    {
      key: "supplier",
      label: "Supplier / Vendor",
      render: (row) => (
        <span className="font-medium text-slate-800">{row.supplier}</span>
      ),
    },
    {
      key: "warehouseName",
      label: "Location",
      render: (row) => (
        <span>
          {row.warehouseCode} - {row.warehouseName}
        </span>
      ),
    },
    { key: "itemsCount", label: "Total Items" },
    {
      key: "totalQuantity",
      label: "Total Quantity",
      render: (row) => row.totalQuantity.toLocaleString(),
    },
    {
      key: "totalValue",
      label: "Total Value",
      render: (row) =>
        `₹${row.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        let variant: "success" | "warning" | "danger" | "neutral" = "neutral";
        if (row.status === "Completed") variant = "success";
        if (row.status === "Pending QC") variant = "warning";
        if (row.status === "Rejected") variant = "danger";
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
            setSelectedRecord(row);
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
    return `${dd}-${mm}-${yyyy}`;
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(row => ({
      'GRN Number': row.grnNo,
      'Inward Date': formatDate(row.date),
      'Supplier / Vendor': row.supplier,
      'Location': `${row.warehouseCode} - ${row.warehouseName}`,
      'Total Items': row.itemsCount,
      'Total Quantity': row.totalQuantity,
      'Total Value': row.totalValue,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inward Stock');
    
    const fileName = `inward_stock_${getFormattedDate()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['GRN Number', 'Inward Date', 'Supplier / Vendor', 'Location', 'Total Items', 'Total Quantity', 'Total Value', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          row.grnNo, 
          formatDate(row.date), 
          `"${row.supplier}"`, 
          `"${row.warehouseCode} - ${row.warehouseName}"`,
          row.itemsCount, 
          row.totalQuantity, 
          row.totalValue, 
          row.status
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `inward_stock_${getFormattedDate()}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  // Create GRN Form Logic
  const openCreateModal = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      supplier: '',
      location: '',
      invoiceNumber: '',
      invoiceDate: '',
      status: 'Completed',
      remarks: '',
    });
    setFormProducts([]);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    const isDirty = formProducts.length > 0 || formData.supplier !== '' || formData.location !== '' || formData.invoiceNumber !== '';
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        setShowCreateModal(false);
      }
    } else {
      setShowCreateModal(false);
    }
  };

  const handleAddSupplier = (newSupplier: string) => {
    const trimmed = newSupplier.trim();
    if (!trimmed) return;
    if (!suppliers.includes(trimmed)) {
      const updated = [...suppliers, trimmed];
      setSuppliers(updated);
      localStorage.setItem("erp_suppliers", JSON.stringify(updated));
    }
    setFormData({ ...formData, supplier: trimmed });
  };

  useEffect(() => {
    const records = inwardStockService.getAll();

    setInwardRecords(records as Inward[]);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCreateModal) {
        closeCreateModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreateModal, formProducts, formData]);

  const handleAddProductRow = () => {
    setFormProducts([
      ...formProducts, 
      { id: Date.now().toString(), product: '', batchNo: '', mfgDate: '', expiryDate: '', quantity: 0, ptr: 0, mrp: 0 }
    ]);
  };

  const handleProductChange = (
    id: string,
    field: keyof ProductLineItem,
    value: any,
  ) => {
    if (field === "product") {
      const updatedProducts = formProducts.map((row) => {
        if (row.id !== id) return row;

        return {
          ...row,
          product: value,
          batchNo: "",
          mfgDate: "",
          expiryDate: "",
          ptr: 0,
          mrp: 0,
        };
      });

      setFormProducts(updatedProducts);
      return;

    }
    if (field === "batchNo") {
      const selectedBatch = batches.find((batch) => batch.batchNo === value);

      if (selectedBatch) {
        setFormProducts(
          formProducts.map((row) =>
            row.id === id
              ? {
                  ...row,
                  batchNo: value,
                  mfgDate: selectedBatch.mfgDate,
                  expiryDate: selectedBatch.expDate,
                  ptr: Number(selectedBatch.ptr),
                  mrp: Number(selectedBatch.mrp),
                }
              : row,
          ),
        );

        return;
      }
    }

    setFormProducts(
      formProducts.map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleRemoveProductRow = (id: string) => {
    setFormProducts(formProducts.filter(p => p.id !== id));
  };

  const autoCalculatedMetrics = useMemo(() => {
    const totalItems = formProducts.length;
    const totalQuantity = formProducts.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
    const totalValue = formProducts.reduce((acc, curr) => acc + ((Number(curr.quantity) || 0) * (Number(curr.ptr) || 0)), 0);
    return { totalItems, totalQuantity, totalValue };
  }, [formProducts]);

  const handleSaveGRN = async () => {
    const supplier = formData.supplier.trim();
    const location = formData.location.trim();
    const date = formData.date;
    const invoiceNumber = (formData.invoiceNumber || "").trim();
    const remarks = (formData.remarks || "").trim();

    if (!supplier || !location || !date || !invoiceNumber) {
      alert("Please fill all mandatory fields (Supplier, Location, Date, Invoice Number).");
      return;
    }

    if (new Date(date) > new Date()) {
      alert("Inward Date cannot be a future date.");
      return;
    }

    if (remarks.length > 250) {
      alert("Remarks cannot exceed 250 characters.");
      return;
    }

    if (formProducts.length === 0) {
      alert("Please add at least one product.");
      return;
    }

    for (const p of formProducts) {
      if (!p.product || !p.batchNo || !p.mfgDate || !p.expiryDate) {
        alert("Please fill all product fields completely.");
        return;
      }

      const qty = Number(p.quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        alert("Quantity must be a positive integer greater than zero.");
        return;
      }

      if (Number(p.ptr) <= 0) {
        alert("Invalid PTR.");
        return;
      }

      if (Number(p.mrp) <= 0) {
        alert("Invalid MRP.");
        return;
      }

      if (new Date(p.expiryDate) <= new Date(p.mfgDate)) {
        alert(
          `Expiry Date must be greater than Manufacturing Date for batch ${p.batchNo}.`,
        );
        return;
      }
    }

    const newGrnNo = `GRN-${new Date().getFullYear()}-${String(inwardRecords.length + 1).padStart(3, "0")}`;

    const newRecord: Inward = {
      id: Date.now().toString(),
      grnNo: newGrnNo,
      date: formData.date,
      supplier: supplier,
      warehouseId: location,

      warehouseCode:
        warehouseService.getAll().find((w) => w.id === location)
          ?.code ?? "",

      warehouseName:
        warehouseService.getAll().find((w) => w.id === location)
          ?.name ?? "",
      invoiceNumber: invoiceNumber,
      invoiceDate: formData.invoiceDate,
      itemsCount: autoCalculatedMetrics.totalItems,
      totalQuantity: autoCalculatedMetrics.totalQuantity,
      totalValue: autoCalculatedMetrics.totalValue,
      status: formData.status,
      products: [...formProducts],
      remarks: remarks,
      createdBy: currentUser?.fullName ?? "System",

      createdDate: new Date().toLocaleDateString("en-GB").replace(/\//g, "-"),

      lastUpdatedBy: currentUser?.fullName ?? "System",

      lastUpdatedDate: new Date()
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-"),
    };

    const updatedRecords = [newRecord, ...inwardRecords];

    setInwardRecords(updatedRecords);

    inwardStockService.saveAll(updatedRecords);

    const inventory = inventoryService.getAll();

    // 1. Ensure all batches exist in the database (create them if they don't)
    for (const item of formProducts) {
      const product = products.find((p) => p.name === item.product);
      if (!product) continue;

      const batches = batchService.getAll();
      let matchedBatch = batches.find(
        (b) => b.batchNo === item.batchNo && b.productCode === product.code
      );

      if (!matchedBatch) {
        await batchService.addBatch({
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          batchNo: item.batchNo,
          mfgDate: item.mfgDate,
          expDate: item.expiryDate,
          ptr: Number(item.ptr),
          mrp: Number(item.mrp),
          availableQty: Number(item.quantity),
          status: "Active",
        });
      }
    }

    // 2. Add or update inventory records in the database
    for (const item of formProducts) {
      const product = products.find((p) => p.name === item.product);
      const selectedWarehouse = warehouses.find((w) => w.id === location);

      let stock = inventory.find(
        (record) =>
          record.batchNo === item.batchNo && record.warehouseId === location
      );

      if (stock) {
        await inventoryService.updateAvailableQty(
          stock.batchNo,
          stock.warehouseId,
          stock.availableQty + Number(item.quantity)
        );
      } else {
        await inventoryService.addRecord({
          id: Date.now().toString(),
          productCode: product?.code ?? "",
          productName: item.product,
          batchNo: item.batchNo,
          warehouseId: selectedWarehouse?.id ?? "",
          warehouseCode: selectedWarehouse?.code ?? "",
          warehouseName: selectedWarehouse?.name ?? "",
          ptr: Number(item.ptr),
          availableQty: Number(item.quantity),
          reservedQty: 0,
          damagedQty: 0,
          blockedQty: 0,
          expiredQty: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    }


    formProducts.forEach((item) => {
       const product = products.find((p) => p.name === item.product);
       const inventoryRecord = inventoryService.getByBatch(item.batchNo)[0];

      stockLedgerService.addRecord({
        id: Date.now().toString(),

        transactionNo: `GRN-${Date.now()}`,

        transactionDate: new Date().toISOString(),

        productCode: product?.code ?? "",

        productName: item.product,

        batchNo: item.batchNo,

        transactionType: "INWARD",

        inQty: Number(item.quantity),

        outQty: 0,

        balanceQty: inventoryRecord?.availableQty ?? Number(item.quantity),

        remarks: "Goods Received Note",
      });
    });

    activityLogService.addLog({
      userId: currentUser?.id,
      userName: currentUser?.fullName,
      action: "Created Inward GRN",
      module: "Inward Stock",
    });

    // Refresh database cache and state
    const updatedBatches = await batchService.loadBatches();
    setBatches(updatedBatches);
    await inventoryService.loadInventory();

    setFormData({
      date: new Date().toISOString().split("T")[0],
      supplier: "",
      location: "",
      invoiceNumber: "",
      invoiceDate: "",
      status: "Completed",
      remarks: "",
    });

    setFormProducts([]);

    setShowCreateModal(false);

    alert("inward stock management done successfully");
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Inward Stock Management"
        subtitle="Manage Goods Receipt Notes and incoming inventory."
        actions={
          <>
            <div
              className="relative inline-block text-left"
              ref={exportMenuRef}
            >
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
            <ActionButton
              icon={<Plus className="w-4 h-4" />}
              onClick={openCreateModal}
            >
              Create GRN
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search GRN or supplier..."
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
            { label: "Completed", value: "Completed" },
            { label: "Pending QC", value: "Pending QC" },
            { label: "Draft", value: "Draft" },
            { label: "Rejected", value: "Rejected" },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No inward records found."
          />
        </div>
      </TableCard>

      {/* Create GRN Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={closeCreateModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Create Goods Receipt Note (GRN)
              </h2>
              <button
                onClick={closeCreateModal}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-8">
              {/* GRN Information */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  GRN Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      GRN Number
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="Auto Generated"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Inward Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Supplier / Vendor *
                    </label>
                    <SearchableDropdown
                      value={formData.supplier}
                      onChange={(val) =>
                        setFormData({ ...formData, supplier: val })
                      }
                      options={suppliers.map((s) => ({ value: s, label: s }))}
                      placeholder="Select Supplier"
                      allowAdd={true}
                      onAdd={handleAddSupplier}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Location *
                    </label>
                    <select
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    >
                      <option value="">Select Warehouse</option>

                      {warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Invoice / GRN Number *
                    </label>
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          invoiceNumber: e.target.value,
                        })
                      }
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                      placeholder="Enter invoice number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Invoice Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.invoiceDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          invoiceDate: e.target.value,
                        })
                      }
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </section>

              {/* Product Details Grid */}
              <section>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Product Details
                  </h3>
                  <button
                    onClick={handleAddProductRow}
                    className="text-sm text-violet-600 font-medium hover:text-violet-800 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Row
                  </button>
                </div>

                <div className="overflow-x-auto pb-48">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 whitespace-nowrap">Product *</th>
                        <th className="px-3 py-2 whitespace-nowrap">
                          Batch No *
                        </th>
                        <th className="px-3 py-2 whitespace-nowrap">
                          MFG Date
                        </th>
                        <th className="px-3 py-2 whitespace-nowrap">
                          Expiry Date
                        </th>
                        <th className="px-3 py-2 whitespace-nowrap w-24">
                          Quantity *
                        </th>
                        <th className="px-3 py-2 whitespace-nowrap w-24">
                          PTR (₹)
                        </th>
                        <th className="px-3 py-2 whitespace-nowrap w-24">
                          MRP (₹)
                        </th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formProducts.map((prod) => (
                        <tr key={prod.id} className="border-b border-slate-100">
                          <td className="px-2 py-2 min-w-[200px]">
                            <SearchableDropdown
                              value={prod.product}
                              onChange={(val) =>
                                handleProductChange(
                                  prod.id,
                                  "product",
                                  val,
                                )
                              }
                              options={products.map(p => ({ value: p.name, label: p.name }))}
                              placeholder="Select Product"
                            />
                          </td>
                          <td className="px-2 py-2 min-w-[150px]">
                            <SearchableDropdown
                              value={prod.batchNo}
                              onChange={(val) =>
                                handleProductChange(
                                  prod.id,
                                  "batchNo",
                                  val,
                                )
                              }
                              options={batches
                                .filter(
                                  (batch) => batch.productName === prod.product,
                                )
                                .map((batch) => ({ value: batch.batchNo, label: batch.batchNo }))}
                              placeholder="Select Batch"
                            />
                          </td>
                          <td className="px-2 py-2 min-w-[140px]">
                            <input
                              type="text"
                              value={formatDate(prod.mfgDate)}
                              readOnly
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm cursor-not-allowed"
                            />
                          </td>
                          <td className="px-2 py-2 min-w-[140px]">
                            <input
                              type="text"
                              value={formatDate(prod.expiryDate)}
                              readOnly
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm cursor-not-allowed"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={prod.quantity || ""}
                              onChange={(e) =>
                                handleProductChange(
                                  prod.id,
                                  "quantity",
                                  e.target.value,
                                )
                              }
                              className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm"
                              min="1"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={prod.ptr || ""}
                              readOnly
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm cursor-not-allowed"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={prod.mrp || ""}
                              readOnly
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm cursor-not-allowed"
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              onClick={() => handleRemoveProductRow(prod.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {formProducts.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            className="text-center py-6 text-sm text-slate-500"
                          >
                            No products added yet. Click "Add Row" to begin.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Summary Section */}
              <section className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Total Items
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    {autoCalculatedMetrics.totalItems}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Total Quantity
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    {autoCalculatedMetrics.totalQuantity.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Total Value
                  </span>
                  <span className="text-lg font-bold text-violet-700">
                    ₹
                    {autoCalculatedMetrics.totalValue.toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                    )}
                  </span>
                </div>
              </section>

              {/* Status Section */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  Workflow Status & Remarks
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Pending QC">Pending QC</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Remarks (Optional)
                    </label>
                    <input
                      maxLength={250}
                      type="text"
                      value={formData.remarks}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          remarks: e.target.value,
                        })
                      }
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                      placeholder="Add any remarks here"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200">
              <ActionButton variant="secondary" onClick={closeCreateModal}>
                Cancel
              </ActionButton>
              <ActionButton onClick={handleSaveGRN}>Save GRN</ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* GRN View Drawer */}
      <Drawer
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="GRN Details"
      >
        {selectedRecord && (
          <div className="space-y-6">
            {/* GRN Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                GRN Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="GRN Number"
                  value={
                    <span className="font-mono text-violet-700 bg-violet-50 px-2 py-1 rounded">
                      {selectedRecord.grnNo}
                    </span>
                  }
                />
                <DrawerField label="Inward Date" value={formatDate(selectedRecord.date)} />
                <DrawerField
                  label="Supplier / Vendor"
                  value={selectedRecord.supplier}
                />
                <DrawerField
                  label="Location"
                  value={`${selectedRecord.warehouseCode} - ${selectedRecord.warehouseName}`}
                />
                <DrawerField
                  label="Invoice Number"
                  value={selectedRecord.invoiceNumber || "N/A"}
                />
                <DrawerField
                  label="Invoice Date"
                  value={formatDate(selectedRecord.invoiceDate) || "N/A"}
                />
                <DrawerField
                  label="Remarks"
                  value={selectedRecord.remarks || "N/A"}
                />
                <DrawerField
                  label="Status"
                  value={
                    <Badge
                      variant={
                        selectedRecord.status === "Completed"
                          ? "success"
                          : selectedRecord.status === "Pending QC"
                            ? "warning"
                            : selectedRecord.status === "Rejected"
                              ? "danger"
                              : "neutral"
                      }
                    >
                      {selectedRecord.status}
                    </Badge>
                  }
                />
              </div>
            </div>

            {/* Product Details Table */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Product Details
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Batch No</th>
                      <th className="px-3 py-2">MFG Date</th>
                      <th className="px-3 py-2">Expiry Date</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">PTR</th>
                      <th className="px-3 py-2 text-right">MRP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRecord.products.map((prod) => (
                      <tr key={prod.id}>
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {prod.product}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {prod.batchNo}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {formatDate(prod.mfgDate)}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {formatDate(prod.expiryDate)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {prod.quantity}
                        </td>
                        <td className="px-3 py-2 text-right">₹{prod.ptr}</td>
                        <td className="px-3 py-2 text-right">₹{prod.mrp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Summary
              </h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Total Items</span>
                  <span className="font-semibold text-slate-900">
                    {selectedRecord.itemsCount}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Total Quantity</span>
                  <span className="font-semibold text-slate-900">
                    {selectedRecord.totalQuantity.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                  <span className="font-medium text-slate-700">
                    Total Value
                  </span>
                  <span className="text-lg font-bold text-violet-700">
                    ₹
                    {selectedRecord.totalValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Audit Information */}
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