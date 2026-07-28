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
  DrawerField,
  Drawer
} from './components/shared';
import { type Column } from './components/shared';
import {
  outwardStockService,
  type OutwardStockRecord,
} from "../../services/outwardStockService";
import { inventoryService } from "../../services/inventoryService";
import { warehouseService } from "../../services/warehouseService";
import { productService } from "../../services/productService";
import { stockLedgerService } from "../../services/stockLedgerService";
import { batchService } from "../../services/batchService";
import activityLogService from "../../services/activityLogService";
import authService from "../../services/authService";
import { distributorMasterService } from "../../services/distributorMasterService";

// --- Data Models ---

interface DispatchLineItem {
  id: string;
  product: string;
  batchNo: string;
  availableQty: number;
  dispatchQty: number;
  rate: number;
}

interface Outward {
  id: string;
  dispatchNo: string;
  date: string;
  client: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  referenceNumber?: string;
  itemsCount: number;
  totalQuantity: number;
  totalValue: number;
  status: "Draft" | "Processing" | "Dispatched" | "Cancelled";
  products: DispatchLineItem[];
  createdBy: string;
  createdDate: string;
  lastUpdatedBy: string;
  lastUpdatedDate: string;
}

const MOCK_CLIENTS = ['Apollo Hospitals', 'Care Pharmacy', 'City Clinic'];

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

// Client Searchable Dropdown Component
function ClientCombobox({ 
  value, 
  onChange, 
  clients 
}: { 
  value: string; 
  onChange: (v: string) => void; 
  clients: string[] 
}) {
  const [search, setSearch] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = clients.filter(c => c.toLowerCase().includes(search.toLowerCase()));
  const exactMatch = clients.find(c => c.toLowerCase() === search.toLowerCase());

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search or add distributor..."
      />
      {open && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filtered.map(c => (
            <div
              key={c}
              className="px-3 py-2 cursor-pointer hover:bg-slate-50 text-sm text-slate-700"
              onClick={() => {
                onChange(c);
                setSearch(c);
                setOpen(false);
              }}
            >
              {c}
            </div>
          ))}
          {!exactMatch && search.trim() && (
            <div
              className="px-3 py-2 cursor-pointer hover:bg-slate-50 text-sm text-[#163c78] font-medium border-t border-slate-100"
              onClick={() => {
                const newClient = search.trim();
                onChange(newClient);
                setSearch(newClient);
                setOpen(false);
              }}
            >
              + Add "{search.trim()}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OutwardStock() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [outwardRecords, setOutwardRecords] = useState<Outward[]>([]);
  
  useEffect(() => {
    async function loadOutward() {
      const records = await outwardStockService.getAll();
      setOutwardRecords(records.map(r => ({
        id: r.id || '',
        dispatchNo: r.dispatchNo,
        date: r.date,
        client: r.client,
        warehouseId: String(r.warehouseId),
        warehouseCode: r.warehouseCode || '',
        warehouseName: r.warehouseName || '',
        referenceNumber: r.referenceNumber,
        itemsCount: r.itemsCount,
        totalQuantity: r.totalQuantity,
        totalValue: r.totalValue,
        status: (r.status as Outward['status']) || 'Processing',
        products: (r.items || []).map((item: any) => ({
          id: String(item.id || Math.random()),
          product: item.product?.name || `Product ${item.productId}`,
          batchNo: item.batch?.batchNumber || `Batch ${item.batchId}`,
          availableQty: Number(item.quantity || 0),
          dispatchQty: Number(item.quantity || 0),
          rate: Number(item.rate || 0),
        })),
        createdBy: '',
        createdDate: r.date,
        lastUpdatedBy: '',
        lastUpdatedDate: r.date,
      })));
    }
    loadOutward();
  }, []);

  useEffect(() => {
    batchService.loadBatches();
    inventoryService.loadInventory();
  }, []);
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Outward | null>(null);
  
  // Extract unique distributors dynamically from master profile + transaction records
  const knownClients = useMemo(() => {
    const unique = new Set<string>();
    
    try {
      const createdDists = distributorMasterService.getAll();
      createdDists.forEach(d => {
        if (d.name) {
          unique.add(d.name);
        } else if (d.code) {
          unique.add(d.code);
        }
      });
    } catch (e) {
      console.error(e);
    }

    outwardRecords.forEach(r => {
      if (r.client) unique.add(r.client);
    });

    return Array.from(unique).sort();
  }, [outwardRecords]);

  // Create Dispatch Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    client: '',
    warehouseId: "",
    referenceNumber: '',
    status: 'Processing' as Outward['status'],
    transporter: 'Delhivery',
    lrNumber: '',
    vehicleNumber: '',
    driverName: '',
    driverMobile: '',
    expectedDeliveryDate: '',
  });

  const [formProducts, setFormProducts] = useState<DispatchLineItem[]>([]);
  const [localClients, setLocalClients] = useState<string[]>([]);

  useEffect(() => {
    setLocalClients(knownClients);
  }, [knownClients]);

  const inventory = inventoryService.getAll();

  const availableProducts = inventory
    .filter((s) => s.warehouseId === formData.warehouseId && s.availableQty > 0)
    .reduce(
      (acc, item) => {
        if (!acc.find((p) => p.productCode === item.productCode)) {
          acc.push(item);
        }
        return acc;
      },
      [] as typeof inventory,
    );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredData = outwardRecords.filter((item) => {
    const searchLower = search.toLowerCase();
    const matchSearch = 
      item.dispatchNo.toLowerCase().includes(searchLower) || 
      item.client.toLowerCase().includes(searchLower) ||
      item.warehouseName.toLowerCase().includes(searchLower) ||
      item.warehouseCode.toLowerCase().includes(searchLower) ||
      (item.referenceNumber && item.referenceNumber.toLowerCase().includes(searchLower));
    
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const columns: Column<Outward>[] = [
    { key: 'dispatchNo', label: 'Dispatch Number', render: (row) => <span className="font-semibold text-violet-700">{row.dispatchNo}</span> },
    { key: 'date', label: 'Outward Date', render: (row) => formatDate(row.date) },
    { key: 'client', label: 'Distributor / Buyer', render: (row) => <span className="font-medium text-slate-800">{row.client}</span> },
    {
      key: "warehouseName",
      label: "Warehouse",
      render: (row: Outward) => `${row.warehouseCode} - ${row.warehouseName}`,
    },
    { key: 'itemsCount', label: 'Total Items' },
    { key: 'totalQuantity', label: 'Total Quantity', render: (row) => row.totalQuantity.toLocaleString() },
    { key: 'totalValue', label: 'Total Value', render: (row) => `₹${row.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' = 'neutral';
        if (row.status === 'Dispatched') variant = 'success';
        if (row.status === 'Processing') variant = 'info';
        if (row.status === 'Cancelled') variant = 'danger';
        if (row.status === 'Draft') variant = 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord(row);
          }}
          className="text-[#163c78] font-medium hover:text-[#0c1f3d]"
        >
          View
        </button>
      )
    }
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
      'Dispatch Number': row.dispatchNo,
      'Outward Date': formatDate(row.date),
      'Distributor / Buyer': row.client,
      'Warehouse': `${row.warehouseCode} - ${row.warehouseName}`,
      'Reference Number': row.referenceNumber || '',
      'Total Items': row.itemsCount,
      'Total Quantity': row.totalQuantity,
      'Total Value': row.totalValue,
      'Status': row.status,
      'Created By': row.createdBy,
      'Created On': formatDate(row.createdDate),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Outward Stock');
    
    const fileName = `outward_stock_${getFormattedDate()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Dispatch Number', 'Outward Date', 'Distributor / Buyer', 'Warehouse', 'Reference Number', 'Total Items', 'Total Quantity', 'Total Value', 'Status', 'Created By', 'Created On'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          row.dispatchNo, 
          formatDate(row.date), 
          `"${row.client}"`, 
          `"${row.warehouseCode} - ${row.warehouseName}"`,
          `"${row.referenceNumber || ''}"`,
          row.itemsCount, 
          row.totalQuantity, 
          row.totalValue, 
          row.status,
          `"${row.createdBy}"`,
          formatDate(row.createdDate)
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `outward_stock_${getFormattedDate()}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  // Create Dispatch Logic
  const openCreateModal = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      client: '',
      warehouseId: '',
      referenceNumber: '',
      status: 'Processing',
      transporter: 'Delhivery',
      lrNumber: '',
      vehicleNumber: '',
      driverName: '',
      driverMobile: '',
      expectedDeliveryDate: '',
    });
    setFormProducts([]);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    const isDirty = formProducts.length > 0 || formData.client !== '' || formData.warehouseId !== '' || formData.referenceNumber !== '';
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        setShowCreateModal(false);
      }
    } else {
      setShowCreateModal(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCreateModal) {
        closeCreateModal();
      }
      if (e.key === 'Escape' && selectedRecord) {
        setSelectedRecord(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreateModal, formProducts, formData, selectedRecord]);

  const handleAddProductRow = () => {
    setFormProducts([
      ...formProducts, 
      { id: Date.now().toString(), product: '', batchNo: '', availableQty: 0, dispatchQty: 0, rate: 0 }
    ]);
  };

  const handleProductChange = (id: string, field: keyof DispatchLineItem, value: any) => {
    setFormProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: value };
      
      // Auto-populate batch info when batchNo changes
      if (field === "batchNo" && updated.product) {
        const batchInfo = inventory.find(
          (stock) =>
            stock.productName === updated.product &&
            stock.batchNo === value &&
            stock.warehouseId === formData.warehouseId,
        );

        if (batchInfo) {
          updated.availableQty = batchInfo.availableQty;
          updated.rate = batchInfo.ptr;
        } else {
          updated.availableQty = 0;
          updated.rate = 0;
        }
      }
      
      // Reset batch info if product changes
      if (field === 'product') {
        updated.batchNo = '';
        updated.availableQty = 0;
        updated.rate = 0;
      }

      // Format dispatch qty as integer
      if (field === 'dispatchQty') {
        updated.dispatchQty = Math.floor(Number(value)) || 0;
      }
      
      return updated;
    }));
  };

  const handleRemoveProductRow = (id: string) => {
    setFormProducts(formProducts.filter(p => p.id !== id));
  };

  const autoCalculatedMetrics = useMemo(() => {
    const totalItems = formProducts.length;
    const totalQuantity = formProducts.reduce((acc, curr) => acc + (Number(curr.dispatchQty) || 0), 0);
    const totalValue = formProducts.reduce((acc, curr) => acc + ((Number(curr.dispatchQty) || 0) * (Number(curr.rate) || 0)), 0);
    return { totalItems, totalQuantity, totalValue };
  }, [formProducts]);

  const handleSaveDispatch = () => {
    const trimmedClient = formData.client.trim();
    const trimmedRef = formData.referenceNumber.trim();
    
    if (!formData.date) {
      alert("Please select a Dispatch Date.");
      return;
    }
    
    if (!trimmedClient) {
      alert("Please select or enter a valid Client.");
      return;
    }
    
    if (!formData.warehouseId) {
      alert("Please select a Dispatch From Location.");
      return;
    }
    
    if (trimmedRef.length > 50) {
      alert("Reference Number cannot exceed 50 characters.");
      return;
    }

    if (!formData.transporter || !formData.lrNumber.trim() || !formData.vehicleNumber.trim() || !formData.expectedDeliveryDate) {
      alert("Please fill all required logistics fields (*): Transporter, LR Number, Vehicle Number, and Expected Delivery Date.");
      return;
    }

    if (formProducts.length === 0) {
      alert("Please add at least one product to dispatch.");
      return;
    }

    for (const p of formProducts) {
      if (!p.product || !p.batchNo || !p.dispatchQty) {
        alert("Please select a Product, Batch No, and enter Dispatch Qty for all rows.");
        return;
      }
      if (Number(p.dispatchQty) <= 0 || !Number.isInteger(Number(p.dispatchQty))) {
        alert(`Dispatch quantity must be a valid integer greater than zero for batch ${p.batchNo}.`);
        return;
      }
      if (Number(p.dispatchQty) > p.availableQty) {
        alert(`Dispatch quantity cannot exceed Available Qty (${p.availableQty}) for batch ${p.batchNo}.`);
        return;
      }
    }

    // Update local clients if it's a new one
    if (!localClients.includes(trimmedClient)) {
      setLocalClients(prev => [...prev, trimmedClient].sort());
    }

    // Save Logic
    const newDispatchNo = `OUT-${new Date().getFullYear()}-${String(outwardRecords.length + 1).padStart(3, '0')}`;
    const selectedWarehouse = warehouseService
       .getAll()
       .find((w) => w.id === formData.warehouseId);
       
    const newRecord: any = {
      dispatchNo: newDispatchNo,
      date: new Date(formData.date).toISOString(),
      client: trimmedClient,
      warehouseId: Number(selectedWarehouse?.id) || 0,
      referenceNumber: trimmedRef,
      itemsCount: autoCalculatedMetrics.totalItems,
      totalQuantity: autoCalculatedMetrics.totalQuantity,
      totalValue: autoCalculatedMetrics.totalValue,
      status: formData.status,
      transporter: formData.transporter,
      lrNumber: formData.lrNumber,
      vehicleNumber: formData.vehicleNumber,
      driverName: formData.driverName,
      driverMobile: formData.driverMobile,
      expectedDeliveryDate: formData.expectedDeliveryDate,
      items: formProducts.map(p => {
        const productId = productService.getProducts().find(prod => prod.name === p.product)?.id || 0;
        const batchId = batchService.getAll().find(b => b.batchNo === p.batchNo && b.productId === String(productId))?.id || 0;
        return {
          productId: Number(productId),
          batchId: Number(batchId),
          quantity: Number(p.dispatchQty),
          rate: Number(p.rate)
        };
      })
    };

    const invalidItems = newRecord.items.filter((item: any) => !item.productId || !item.batchId);
    if (invalidItems.length > 0) {
      alert("Failed to find valid Product ID or Batch ID in database. Please ensure product and batch exist.");
      return;
    }

    outwardStockService.add(newRecord).then(async success => {
      if (success) {
        const records = await outwardStockService.getAll();
        setOutwardRecords(records.map(r => ({
          id: r.id || '',
          dispatchNo: r.dispatchNo,
          date: r.date,
          client: r.client,
          warehouseId: String(r.warehouseId),
          warehouseCode: '',
          warehouseName: '',
          referenceNumber: r.referenceNumber,
          itemsCount: r.itemsCount,
          totalQuantity: r.totalQuantity,
          totalValue: r.totalValue,
          status: (r.status as Outward['status']) || 'Processing',
          products: [],
          createdBy: '',
          createdDate: r.date,
          lastUpdatedBy: '',
          lastUpdatedDate: r.date,
        })));
      } else {
        alert("Failed to save dispatch to backend");
      }
    });

    // Keeping local ledger log for dashboard mockup compatibility
    formProducts.forEach((item) => {
      const product = productService
        .getProducts()
        .find((p) => p.name === item.product);

      const stock = inventoryService.getAll().find(
        (s) =>
          s.batchNo === item.batchNo && s.warehouseId === formData.warehouseId,
      );

      stockLedgerService.addRecord({
        id: Date.now().toString() + Math.random().toString(),
        transactionNo: newDispatchNo,
        transactionDate: new Date().toISOString(),
        productCode: product?.code ?? "",
        productName: item.product,
        batchNo: item.batchNo,
        transactionType: "OUTWARD",
        inQty: 0,
        outQty: Number(item.dispatchQty),
        balanceQty: stock?.availableQty ?? 0,
        remarks: "Dispatch",
      });
    });

    const currentUser = authService.getCurrentUser();

    activityLogService.addLog({
      userId: currentUser?.id,
      userName: currentUser?.fullName,
      action: "Created Dispatch",
      module: "Outward Stock",
    });

    setShowCreateModal(false);
    setFormProducts([]);
    alert("Dispatch created successfully!");
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Outward Stock Management"
        subtitle="Manage inventory leaving the warehouse and delivery challans."
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
              Create Dispatch
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search dispatch, client, warehouse, or ref..."
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
            { label: "Dispatched", value: "Dispatched" },
            { label: "Processing", value: "Processing" },
            { label: "Draft", value: "Draft" },
            { label: "Cancelled", value: "Cancelled" },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No outward records found."
          />
        </div>
      </TableCard>

      {/* Create Dispatch Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCreateModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Create Dispatch
              </h2>
              <button
                onClick={closeCreateModal}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-8">
              {/* Dispatch Information */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  Dispatch Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Dispatch Number
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
                      Dispatch Date *
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
                      Distributor / Buyer *
                    </label>
                    <ClientCombobox 
                      value={formData.client} 
                      onChange={(val) => setFormData({ ...formData, client: val })} 
                      clients={localClients} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Dispatch From Location *
                    </label>
                    <select
                      value={formData.warehouseId}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          warehouseId: e.target.value,
                        });
                        setFormProducts([]); // Reset products if warehouse changes
                      }}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    >
                      <option value="">Select Warehouse</option>
                      {warehouseService
                        .getAll()
                        .filter((w) => w.status === "Active")
                        .map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.code} - {warehouse.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Reference Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.referenceNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          referenceNumber: e.target.value,
                        })
                      }
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                      placeholder="e.g. SO-2026-001"
                      maxLength={50}
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
                    disabled={!formData.warehouseId}
                    className={`text-sm font-medium flex items-center ${!formData.warehouseId ? 'text-slate-400 cursor-not-allowed' : 'text-[#163c78] hover:text-[#0c1f3d]'}`}
                    title={!formData.warehouseId ? "Select a warehouse first" : ""}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Row
                  </button>
                </div>

                <div className="overflow-x-auto pb-4">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 whitespace-nowrap">Product</th>
                        <th className="px-3 py-2 whitespace-nowrap">
                          Batch No
                        </th>
                        <th className="px-3 py-2 whitespace-nowrap w-32">
                          Available Qty
                        </th>
                        <th className="px-3 py-2 whitespace-nowrap w-32">
                          Dispatch Qty
                        </th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formProducts.map((prod) => (
                        <tr key={prod.id} className="border-b border-slate-100">
                          <td className="px-2 py-2 min-w-[200px]">
                            <select
                              value={prod.product}
                              onChange={(e) =>
                                handleProductChange(
                                  prod.id,
                                  "product",
                                  e.target.value,
                                )
                              }
                              className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm"
                            >
                              <option value="">Select Product</option>

                              {availableProducts.map((p) => (
                                <option
                                  key={p.productCode}
                                  value={p.productName}
                                >
                                  {p.productName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2 min-w-[150px]">
                            <select
                              value={prod.batchNo}
                              onChange={(e) =>
                                handleProductChange(
                                  prod.id,
                                  "batchNo",
                                  e.target.value,
                                )
                              }
                              className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm"
                              disabled={!prod.product}
                            >
                              <option value="">Select Batch</option>
                              {prod.product &&
                                inventory
                                  .filter(
                                    (s) =>
                                      s.productName === prod.product &&
                                      s.warehouseId === formData.warehouseId &&
                                      s.availableQty > 0,
                                  )
                                  .map((batch) => (
                                    <option
                                      key={batch.batchNo}
                                      value={batch.batchNo}
                                    >
                                      {batch.batchNo}
                                    </option>
                                  ))}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              readOnly
                              value={prod.availableQty || ""}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-500 cursor-not-allowed"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={prod.dispatchQty || ""}
                              onChange={(e) =>
                                handleProductChange(
                                  prod.id,
                                  "dispatchQty",
                                  e.target.value,
                                )
                              }
                              className={`w-full border rounded px-2 py-1.5 text-sm ${prod.dispatchQty > prod.availableQty ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                              min="1"
                              max={prod.availableQty}
                              placeholder="0"
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
                            colSpan={5}
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

              {/* Logistics & Transport Details */}
              <section className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-4">
                  Logistics & Transport Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Transporter *
                    </label>
                    <select
                      value={formData.transporter}
                      onChange={(e) => setFormData({ ...formData, transporter: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
                    >
                      <option value="Delhivery">Delhivery</option>
                      <option value="VRL Logistics">VRL Logistics</option>
                      <option value="Gati">Gati</option>
                      <option value="Blue Dart">Blue Dart</option>
                      <option value="Trackon">Trackon</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      LR Number / Challan No *
                    </label>
                    <input
                      type="text"
                      value={formData.lrNumber}
                      onChange={(e) => setFormData({ ...formData, lrNumber: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                      placeholder="e.g. 654321"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Vehicle Number *
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                      placeholder="e.g. TS 09 EX 1234"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Driver Name
                    </label>
                    <input
                      type="text"
                      value={formData.driverName}
                      onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                      placeholder="e.g. Ramesh Kumar"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Driver Mobile
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={formData.driverMobile}
                      onChange={(e) => setFormData({ ...formData, driverMobile: e.target.value.replace(/\D/g, '') })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Expected Delivery Date *
                    </label>
                    <input
                      type="date"
                      value={formData.expectedDeliveryDate}
                      onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </section>

              {/* Status Section */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  Dispatch Status
                </h3>
                <div className="w-full md:w-1/2">
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
                    <option value="Processing">Processing</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200">
              <ActionButton variant="secondary" onClick={closeCreateModal}>
                Cancel
              </ActionButton>
              <ActionButton onClick={handleSaveDispatch}>
                Save Dispatch
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Details View Drawer */}
      <Drawer
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Dispatch Details"
      >
        {selectedRecord && (
          <div className="space-y-6">
            {/* Dispatch Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Dispatch Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Dispatch Number"
                  value={
                    <span className="font-mono text-violet-700 bg-[#163c78]/10 px-2 py-1 rounded">
                      {selectedRecord.dispatchNo}
                    </span>
                  }
                />
                <DrawerField
                  label="Dispatch Date"
                  value={formatDate(selectedRecord.date)}
                />
                <DrawerField
                  label="Distributor / Buyer"
                  value={selectedRecord.client}
                />
                <DrawerField
                  label="Warehouse"
                  value={`${selectedRecord.warehouseCode} - ${selectedRecord.warehouseName}`}
                />
                <DrawerField
                  label="Reference Number"
                  value={selectedRecord.referenceNumber || "N/A"}
                />
                <DrawerField
                  label="Status"
                  value={
                    <Badge
                      variant={
                        selectedRecord.status === "Dispatched"
                          ? "success"
                          : selectedRecord.status === "Processing"
                            ? "info"
                            : selectedRecord.status === "Cancelled"
                              ? "danger"
                              : "warning"
                      }
                    >
                      {selectedRecord.status}
                    </Badge>
                  }
                />
              </div>
            </div>

            {/* Product Details */}
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
                      <th className="px-3 py-2 text-right">Quantity</th>
                      <th className="px-3 py-2 text-right">Rate</th>
                      <th className="px-3 py-2 text-right">Value</th>
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
                        <td className="px-3 py-2 text-right font-medium">
                          {prod.dispatchQty.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right">₹{prod.rate}</td>
                        <td className="px-3 py-2 text-right">
                          ₹
                          {(prod.dispatchQty * prod.rate).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dispatch Summary */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Dispatch Summary
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Total Items"
                  value={selectedRecord.itemsCount.toString()}
                />
                <DrawerField
                  label="Total Quantity"
                  value={selectedRecord.totalQuantity.toLocaleString()}
                />
                <DrawerField
                  label="Total Value"
                  value={`₹${selectedRecord.totalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                />
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