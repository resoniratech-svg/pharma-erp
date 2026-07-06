import { useEffect, useState } from 'react';
import { Plus, Filter, Download, Trash2, ChevronDown } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Drawer,
  DrawerField,
  Badge,
} from './components/shared';
import { type Column } from './types';
import { batchService, type BatchRecord } from "../../services/batchService";
import activityLogService from "../../services/activityLogService";
import authService from "../../services/authService";

import { productService } from "../../services/productService";
import { getExpiryStatus } from "../../utils/expiryUtils";
import { barcodeService } from "../../services/barcodeService";

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  manufacturer?: string;
  brand?: string;
  status?: string;
  hsnCode?: string;
  gst?: string;
  composition?: string;
  packingType?: string;
  scheme?: string;
  type?: string;
  mrp?: string;
  ptr?: string;
  pts?: string;
  barcode?: string;
}

interface Batch {
  id: string;
  batchNo: string;
  productName: string;
  productCode?: string;
  hsnCode?: string;
  gst?: string;
  unit?: string;
  composition?: string;
  packingType?: string;
  scheme?: string;
  manufacturer: string;
  mfgDate: string;
  expDate: string;
  receivedQty: number;
  availableQty: number;
  mrp: string;
  ptr: string;
  pts: string;
  barcode: string;
  remarks: string;
  status: "Healthy" | "Near Expiry" | "Expired" | "Inactive";
}

interface InvoiceItem {
  productCode: string;
  batchNo?: string;
}

interface Invoice {
  items?: InvoiceItem[];
}

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function BatchManagement() {
  const currentUser = authService.getCurrentUser();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
  
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);
  
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Temporary RBAC bypass for client demo
  const canCreate = true;
  const canEdit = true;
  const canDelete = true;

  const [newBatch, setNewBatch] = useState<Partial<Batch>>({
    batchNo: "",
    productName: "",
    productCode: "",
    hsnCode: "",
    gst: "",
    composition: "",
    packingType: "",
    scheme: "",
    manufacturer: "",
    unit: "",
    mfgDate: "",
    expDate: "",
    receivedQty: 0,
    availableQty: 0,
    mrp: "",
    ptr: "",
    pts: "",
    barcode: "",
    remarks: "",
    status: "Healthy",
  });

  useEffect(() => {
    const savedProducts = productService.getProducts() as Product[];
    setProducts(savedProducts || []);
  }, []);

  useEffect(() => {
    const savedBatches = batchService.getAll() as unknown as Batch[];
    setBatches(savedBatches || []);
  }, []);

  useEffect(() => {
    if (batches.length > 0) {
      batchService.saveAll(batches as unknown as BatchRecord[]);
    }
  }, [batches]);

  const calculateShelfLife = (mfg?: string, exp?: string) => {
    if (!mfg || !exp) return '';
    const start = new Date(mfg);
    const end = new Date(exp);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  const getProductDisplay = (code: string, fallbackName: string) => {
    const match = products.find(p => p.code === code);
    return match ? match.name : `${fallbackName} (Deleted Product)`;
  };

  const handleProductSelect = (productCode: string) => {
    const product = products.find((p) => p.code === productCode);
    const activeBarcode = barcodeService.getBarcodeByProduct(productCode);
    const barcodeValue = activeBarcode ? activeBarcode.barcode : "";

    if (product) {
      setNewBatch({
        ...newBatch,
        productName: product.name,
        productCode: product.code || "",
        hsnCode: product.hsnCode || "",
        gst: product.gst || "",
        composition: product.composition || "",
        packingType: product.packingType || "",
        scheme: product.scheme || "",
        manufacturer: product.manufacturer || "",
        unit: product.type || "",
        mrp: product.mrp || "",
        ptr: product.ptr || "",
        pts: product.pts || "",
        barcode: barcodeValue,
      });
    } else {
      setNewBatch({
        ...newBatch,
        productCode: "",
        productName: "",
        barcode: "",
      });
    }
  };

  const checkBatchInUse = (batchItem: Batch) => {
    const invoices = JSON.parse(localStorage.getItem("billing_gst_invoices") || "[]") as Invoice[];
    return invoices.some((inv) =>
      inv.items?.some((item) => item.batchNo === batchItem.batchNo && item.productCode === batchItem.productCode)
    );
  };

  const handleSaveBatch = () => {
    const trimmedBatchNo = newBatch.batchNo?.trim() || "";
    if (!trimmedBatchNo) {
      alert("Error: Batch Number cannot be empty or only spaces.");
      return;
    }

    if (
      !newBatch.productCode ||
      !newBatch.mfgDate ||
      !newBatch.expDate ||
      newBatch.receivedQty === undefined ||
      newBatch.receivedQty === null ||
      newBatch.receivedQty.toString().trim() === ""
    ) {
      alert("Please fill all mandatory fields.");
      return;
    }
    
    const activeBarcode = barcodeService.getBarcodeByProduct(newBatch.productCode);
    if (!activeBarcode) {
      alert("Please assign a barcode to this product in Barcode Management before creating this batch.");
      return;
    }

    const received = Number(newBatch.receivedQty);
    if (!Number.isInteger(received) || received <= 0) {
      alert("Error: Received Quantity must be a positive integer greater than zero.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mfgDateObj = new Date(newBatch.mfgDate);
    mfgDateObj.setHours(0, 0, 0, 0);

    if (mfgDateObj > today) {
      alert("Error: Manufacturing Date cannot be in the future.");
      return;
    }

    if (mfgDateObj >= new Date(newBatch.expDate)) {
      alert("Error: Expiry Date must be strictly greater than Manufacturing Date.");
      return;
    }

    const duplicateBatch = batches.find(
      (batch) =>
        batch.batchNo.trim().toLowerCase() === trimmedBatchNo.toLowerCase() && 
        batch.productCode === newBatch.productCode &&
        batch.id !== newBatch.id
    );

    if (duplicateBatch) {
      alert(`Error: Batch Number "${trimmedBatchNo}" already exists for this product.`);
      return;
    }

    const resolvedStatus = newBatch.status === 'Inactive' ? 'Inactive' : (getExpiryStatus(newBatch.expDate || "") as Batch["status"]);
    const trimmedRemarks = (newBatch.remarks || "").trim().substring(0, 250);

    if (isEditingModal && newBatch.id) {
      const originalBatch = batches.find(b => b.id === newBatch.id);
      const diff = received - (originalBatch?.receivedQty || 0);
      const newAvailable = Math.max(0, (originalBatch?.availableQty || 0) + diff);

      if (newAvailable > received) {
        alert("Error: Available Quantity cannot exceed Received Quantity.");
        return;
      }

      const updatedBatch: Batch = {
        ...newBatch,
        batchNo: trimmedBatchNo,
        productCode: newBatch.productCode,
        hsnCode: newBatch.hsnCode,
        gst: newBatch.gst,
        composition: newBatch.composition,
        packingType: newBatch.packingType,
        scheme: newBatch.scheme,
        unit: newBatch.unit || "",
        manufacturer: newBatch.manufacturer || "",
        mrp: newBatch.mrp || "",
        ptr: newBatch.ptr || "",
        pts: newBatch.pts || "",
        barcode: activeBarcode.barcode,
        remarks: trimmedRemarks,
        receivedQty: received,
        availableQty: Math.min(newAvailable, received),
        status: resolvedStatus,
      } as Batch;

      setBatches(
        batches.map((b) => (b.id === updatedBatch.id ? updatedBatch : b))
      );
      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: `Batch Updated - Code: ${trimmedBatchNo} (Qty: ${received})`,
        module: "Batch Management",
      });
      if (selectedBatch && selectedBatch.id === updatedBatch.id) {
        setSelectedBatch(updatedBatch);
      }
    } else {
      const batch: Batch = {
        id: Date.now().toString(),
        batchNo: trimmedBatchNo,
        productName: newBatch.productName!,
        productCode: newBatch.productCode,
        hsnCode: newBatch.hsnCode,
        gst: newBatch.gst,
        composition: newBatch.composition,
        packingType: newBatch.packingType,
        scheme: newBatch.scheme,
        unit: newBatch.unit || "",
        manufacturer: newBatch.manufacturer || "",
        mfgDate: newBatch.mfgDate!,
        expDate: newBatch.expDate!,
        receivedQty: received,
        availableQty: received,
        mrp: newBatch.mrp || "",
        ptr: newBatch.ptr || "",
        pts: newBatch.pts || "",
        barcode: activeBarcode.barcode,
        remarks: trimmedRemarks,
        status: resolvedStatus,
      };
      setBatches([batch, ...batches]);

      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: `Batch Created - Code: ${trimmedBatchNo} (Qty: ${received})`,
        module: "Batch Management",
      });
    }
    closeModal();
  };

  const handleDeleteBatch = () => {
    if (!batchToDelete) return;

    const inUse = checkBatchInUse(batchToDelete);
    if (inUse) {
      const updated = batches.map(b =>
        b.id === batchToDelete.id ? { ...b, status: 'Inactive' as const } : b
      );
      setBatches(updated);
      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: `Batch Deleted (Blocked - Marked Inactive due to Invoice references) - Code: ${batchToDelete.batchNo}`,
        module: "Batch Management",
      });
      alert("Warning: This batch is referenced in billing invoices. To preserve transaction logs, it was marked as Inactive instead of deleted.");
    } else {
      setBatches(batches.filter((b) => b.id !== batchToDelete.id));
      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: `Batch Deleted - Code: ${batchToDelete.batchNo}`,
        module: "Batch Management",
      });
    }
    setBatchToDelete(null);
  };

  const openNewBatchModal = () => {
    setIsEditingModal(false);
    setProductSearch("");
    setShowProductDropdown(false);
    setNewBatch({
      batchNo: "",
      productName: "",
      productCode: "",
      hsnCode: "",
      gst: "",
      composition: "",
      packingType: "",
      scheme: "",
      manufacturer: "",
      unit: "",
      mfgDate: "",
      expDate: "",
      receivedQty: 0,
      availableQty: 0,
      mrp: "",
      ptr: "",
      pts: "",
      barcode: "",
      remarks: "",
      status: "Healthy"
    });
    setShowBatchModal(true);
  };

  const openEditBatchModal = () => {
    if (!selectedBatch) return;
    
    // Prevent editing batches that have already been referenced in invoices
    if (checkBatchInUse(selectedBatch)) {
      alert("Error: This batch has already been referenced in active invoices and cannot be edited to preserve history.");
      return;
    }

    setIsEditingModal(true);
    setShowProductDropdown(false);
    setProductSearch(selectedBatch.productCode ? `${selectedBatch.productCode} - ${getProductDisplay(selectedBatch.productCode, selectedBatch.productName)}` : "");
    const product = products.find((p) => p.code === selectedBatch.productCode);
    const activeBarcode = selectedBatch.productCode ? barcodeService.getBarcodeByProduct(selectedBatch.productCode) : undefined;
    setNewBatch({
      ...selectedBatch,
      unit: product?.type || '',
      barcode: activeBarcode ? activeBarcode.barcode : selectedBatch.barcode
    });
    setShowBatchModal(true);
  };

  const closeModal = () => {
    setShowBatchModal(false);
    setShowProductDropdown(false);
    setProductSearch("");
  };

  const handleExport = () => {
    const headers = ['Batch No', 'Product Code', 'Product Name', 'Mfg Date', 'Exp Date', 'Received Qty', 'Available Qty', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [
        `="${row.batchNo}"`,
        `="${row.productCode || '-'}"`,
        `="${getProductDisplay(row.productCode || "", row.productName)}"`,
        formatDate(row.mfgDate),
        formatDate(row.expDate),
        row.receivedQty,
        row.availableQty,
        row.status
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'batches_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<Batch>[] = [
    { key: "batchNo", label: "Batch No" },
    {
      key: "productName",
      label: "Product Name",
      render: (row) => (
        <span className="font-semibold text-slate-900">{getProductDisplay(row.productCode || "", row.productName)}</span>
      ),
    },
    { key: "mfgDate", label: "Mfg Date", render: (row) => formatDate(row.mfgDate) },
    { key: "expDate", label: "Exp Date", render: (row) => formatDate(row.expDate) },
    { key: "receivedQty", label: "Received Qty" },
    { key: "availableQty", label: "Available Qty" },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const variant =
          row.status === "Healthy"
            ? "success"
            : row.status === "Expired"
              ? "danger"
              : row.status === "Inactive"
                ? "neutral"
                : "warning";

        return <Badge variant={variant as any}>{row.status}</Badge>;
      },
    },
    {
      key: "id",
      label: "Actions",
      render: (row) => (
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBatch(row);
            }}
            className="text-violet-600 font-medium hover:text-violet-800"
          >
            View
          </button>
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setBatchToDelete(row);
              }}
              className="text-rose-600 font-medium hover:text-rose-800"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const filteredData = batches.filter((item) => {
    const matchSearch = item.batchNo.toLowerCase().includes(search.toLowerCase()) || 
                        getProductDisplay(item.productCode || "", item.productName).toLowerCase().includes(search.toLowerCase()) ||
                        (item.productCode || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Batch Management"
        subtitle="Track batches, expiry dates, and batch health status."
        actions={
          <>
            <ActionButton
              variant="secondary"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExport}
            >
              Export
            </ActionButton>
            {canCreate && (
              <ActionButton
                icon={<Plus className="w-4 h-4" />}
                onClick={openNewBatchModal}
              >
                New Batch
              </ActionButton>
            )}
          </>
        }
      />

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
            { label: "Inactive", value: "Inactive" },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedBatch(row)}
          emptyMessage="No batches found matching your criteria."
        />
      </TableCard>

      {/* Shared Create / Edit Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-900">
                {isEditingModal ? "Edit Batch" : "Create New Batch"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors outline-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BATCH INFORMATION */}
                <div className="md:col-span-2 mt-2 first:mt-0">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">BATCH INFORMATION</h3>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Batch Number *</label>
                  <input
                    maxLength={20}
                    value={newBatch.batchNo}
                    onChange={(e) =>
                      !isEditingModal &&
                      setNewBatch({ ...newBatch, batchNo: e.target.value })
                    }
                    readOnly={isEditingModal}
                    className={`w-full border border-slate-200 rounded-lg px-3 py-2 ${isEditingModal ? "bg-slate-50 text-slate-500 cursor-not-allowed" : "text-slate-900 focus:outline-none focus:border-violet-400"}`}
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Product *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={isEditingModal ? getProductDisplay(newBatch.productCode || "", newBatch.productName || "") : productSearch}
                      onChange={(e) => {
                        if (!isEditingModal) {
                          setProductSearch(e.target.value);
                          setShowProductDropdown(true);
                          if (newBatch.productCode) {
                            setNewBatch({ ...newBatch, productCode: "", productName: "" });
                          }
                        }
                      }}
                      onFocus={() => !isEditingModal && setShowProductDropdown(true)}
                      placeholder="Search Product..."
                      className={`w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 ${isEditingModal ? "bg-slate-50 text-slate-500 cursor-not-allowed" : "bg-white text-slate-900 focus:outline-none focus:border-violet-400"}`}
                      readOnly={isEditingModal}
                    />
                    {!isEditingModal && (
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer"
                        onClick={() => setShowProductDropdown(!showProductDropdown)}
                      />
                    )}
                  </div>
                  {showProductDropdown && !isEditingModal && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowProductDropdown(false)} />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                        {products
                          .filter((p) => p.status === "Active")
                          .filter(
                            (p) =>
                              p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                              p.code.toLowerCase().includes(productSearch.toLowerCase())
                          )
                          .map((product) => (
                            <div
                              key={product.code}
                              className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700"
                              onClick={() => {
                                handleProductSelect(product.code);
                                setProductSearch(`${product.code} - ${product.name}`);
                                setShowProductDropdown(false);
                              }}
                            >
                              <span className="font-medium text-slate-900">{product.code}</span> - {product.name}
                            </div>
                          ))}
                        {products
                          .filter((p) => p.status === "Active")
                          .filter(
                            (p) =>
                              p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                              p.code.toLowerCase().includes(productSearch.toLowerCase())
                          ).length === 0 && (
                          <div className="px-3 py-2 text-sm text-slate-500 italic">No matching active products found</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Manufacturer</label>
                  <input
                    value={newBatch.manufacturer}
                    readOnly
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>

                {/* INVENTORY INFORMATION */}
                <div className="md:col-span-2 mt-4 first:mt-0">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">INVENTORY INFORMATION</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Received Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={newBatch.receivedQty || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setNewBatch({ ...newBatch, receivedQty: Number(val) });
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Available Quantity</label>
                  <input
                    type="number"
                    value={isEditingModal ? newBatch.availableQty : newBatch.receivedQty}
                    readOnly
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>

                {/* MANUFACTURING & EXPIRY */}
                <div className="md:col-span-2 mt-4 first:mt-0">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">MANUFACTURING & EXPIRY INFORMATION</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Manufacturing Date *</label>
                  <input
                    type="date"
                    value={newBatch.mfgDate}
                    onChange={(e) =>
                      setNewBatch({ ...newBatch, mfgDate: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Expiry Date *</label>
                  <input
                    type="date"
                    value={newBatch.expDate}
                    onChange={(e) =>
                      setNewBatch({ ...newBatch, expDate: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Shelf Life</label>
                  <input
                    value={calculateShelfLife(newBatch.mfgDate, newBatch.expDate)}
                    readOnly
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>

                {/* PRODUCT INFORMATION */}
                <div className="md:col-span-2 mt-4 first:mt-0">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">PRODUCT INFORMATION</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Product Type</label>
                  <input
                    value={newBatch.unit || ""}
                    readOnly
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>

                {/* PRICING INFORMATION */}
                <div className="md:col-span-2 mt-4 first:mt-0">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">PRICING INFORMATION</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">MRP</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                      <input
                        value={newBatch.mrp}
                        readOnly
                        className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">PTR</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                      <input
                        value={newBatch.ptr}
                        readOnly
                        className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">PTS</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                      <input
                        value={newBatch.pts}
                        readOnly
                        className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* ADDITIONAL INFORMATION */}
                <div className="md:col-span-2 mt-4 first:mt-0">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">ADDITIONAL INFORMATION</h3>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Barcode</label>
                  <input
                    value={newBatch.barcode || "Not Assigned"}
                    readOnly
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Remarks</label>
                  <textarea
                    rows={2}
                    maxLength={250}
                    value={newBatch.remarks}
                    onChange={(e) =>
                      setNewBatch({ ...newBatch, remarks: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400"
                  />
                </div>
              </div>

            </div>

            {/* FOOTER ACTIONS */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl mt-auto">
              <ActionButton
                variant="secondary"
                onClick={closeModal}
              >
                Cancel
              </ActionButton>
              <ActionButton onClick={handleSaveBatch}>
                {isEditingModal ? "Save Changes" : "Save Batch"}
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {batchToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Delete Batch</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to delete this batch? This action cannot be undone.
              {checkBatchInUse(batchToDelete) && (
                <span className="block mt-2 text-amber-600 font-medium">
                  Note: This batch is referenced in invoices. It will be marked as Inactive.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <ActionButton
                variant="secondary"
                onClick={() => setBatchToDelete(null)}
              >
                Cancel
              </ActionButton>
              <button
                onClick={handleDeleteBatch}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Details Drawer */}
      <Drawer
        open={!!selectedBatch}
        onClose={() => setSelectedBatch(null)}
        title="Batch Details"
      >
        {selectedBatch && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                Batch Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Batch Number"
                  value={selectedBatch.batchNo || "N/A"}
                />
                <DrawerField
                  label="Product Name"
                  value={getProductDisplay(selectedBatch.productCode || "", selectedBatch.productName)}
                />
                <DrawerField
                  label="Product Code"
                  value={selectedBatch.productCode || "N/A"}
                />
                <DrawerField
                  label="HSN Code"
                  value={selectedBatch.hsnCode || "N/A"}
                />
                <DrawerField label="GST %" value={selectedBatch.gst ? `${selectedBatch.gst}%` : "N/A"} />
                <DrawerField
                  label="Composition"
                  value={selectedBatch.composition || "N/A"}
                />
                <DrawerField
                  label="Product Type"
                  value={selectedBatch.unit || "N/A"}
                />
                <DrawerField
                  label="Packing Type"
                  value={selectedBatch.packingType || "N/A"}
                />
                <DrawerField
                  label="Scheme"
                  value={selectedBatch.scheme || "N/A"}
                />
                <DrawerField
                  label="Manufacturer"
                  value={selectedBatch.manufacturer || "N/A"}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                Manufacturing Details
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Manufacturing Date"
                  value={formatDate(selectedBatch.mfgDate)}
                />
                <DrawerField
                  label="Expiry Date"
                  value={formatDate(selectedBatch.expDate)}
                />
                <DrawerField
                  label="Shelf Life"
                  value={
                    calculateShelfLife(
                      selectedBatch.mfgDate,
                      selectedBatch.expDate,
                    ) || "N/A"
                  }
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                Inventory Details
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Received Quantity"
                  value={selectedBatch.receivedQty?.toString() || "0"}
                />
                <DrawerField
                  label="Available Quantity"
                  value={selectedBatch.availableQty?.toString() || "0"}
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                Pricing Details
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="MRP"
                  value={selectedBatch.mrp ? `₹ ${selectedBatch.mrp}` : "N/A"}
                />
                <DrawerField
                  label="PTR"
                  value={selectedBatch.ptr ? `₹ ${selectedBatch.ptr}` : "N/A"}
                />
                <DrawerField
                  label="PTS"
                  value={selectedBatch.pts ? `₹ ${selectedBatch.pts}` : "N/A"}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                Additional Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Barcode"
                  value={selectedBatch.barcode || "Not Assigned"}
                />
                <DrawerField
                  label="Remarks"
                  value={selectedBatch.remarks || "N/A"}
                />
                <DrawerField
                  label="Status"
                  value={
                    <Badge
                      variant={
                        selectedBatch.status === "Healthy"
                          ? "success"
                          : selectedBatch.status === "Expired"
                            ? "danger"
                            : selectedBatch.status === "Inactive"
                              ? "neutral"
                              : "warning"
                      }
                    >
                      {selectedBatch.status}
                    </Badge>
                  }
                />
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
              {canEdit && (
                <ActionButton className="min-w-[140px]" onClick={openEditBatchModal}>
                  Edit Batch
                </ActionButton>
              )}
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