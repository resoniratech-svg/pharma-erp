import { useEffect, useState } from 'react';
import { Plus, Filter, Download, Trash2 } from 'lucide-react';
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
import  activityLogService  from "../../services/activityLogService";
import { hasModulePermission } from '../../utils/permissionUtils';
import { productService } from "../../services/productService";
import { getExpiryStatus } from "../../utils/expiryUtils";

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

  mrp: string;
  ptr: string;
  pts: string;

  barcode: string;
  remarks: string;

  status:
    | "Healthy"
    | "Near Expiry"
    | "Expired";
}

const initialMockData: Batch[] = [
  {
    id: "1",
    batchNo: "B-2026-001",
    productName: "Amoxicillin 500mg",
    manufacturer: "PharmaCorp",
    mfgDate: "2026-01-10",
    expDate: "2028-01-09",
    mrp: "150",
    ptr: "100",
    pts: "120",
    barcode: "8901234567890",
    remarks: "Good",
    status: "Healthy",
  },
  {
    id: "2",
    batchNo: "B-2025-890",
    productName: "Paracetamol 650mg",
    manufacturer: "HealthPlus",
    mfgDate: "2025-12-15",
    expDate: "2027-12-14",
    mrp: "50",
    ptr: "30",
    pts: "35",
    barcode: "8901234567891",
    remarks: "",
    status: "Healthy",
  },
];

export default function BatchManagement() {
  const currentUser = JSON.parse(localStorage.getItem("authUser") || "{}");

  const [batches, setBatches] = useState<Batch[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  useEffect(() => {
    const savedBatches = batchService.getAll() as unknown as Batch[];
    if (savedBatches.length > 0) {
      setBatches(savedBatches);
    } else {
      setBatches(initialMockData);
      batchService.saveAll(initialMockData as any);
    }
  }, []);

  useEffect(() => {
    if (batches.length > 0) {
      batchService.saveAll(batches as any);
    }
  }, [batches]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
  
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);

  const activeRole = localStorage.getItem("activeRole") || "";

  const canView = hasModulePermission(activeRole, "Products & Master", "View");
  const canCreate = hasModulePermission(activeRole, "Products & Master", "Create");
  const canEdit = hasModulePermission(activeRole, "Products & Master", "Edit");
  const canDelete = hasModulePermission(activeRole, "Products & Master", "Delete");

  const [newBatch, setNewBatch] = useState<Partial<Batch> & { unit?: string }>({
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
    mrp: "",
    ptr: "",
    pts: "",
    barcode: "",
    remarks: "",
    status: "Healthy",
  });

  const calculateShelfLife = (mfg?: string, exp?: string) => {
    if (!mfg || !exp) return '';
    const start = new Date(mfg);
    const end = new Date(exp);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };
  
  useEffect(() => {
    const savedProducts = productService.getProducts();
    setProducts(savedProducts);
  }, []);

  const handleProductSelect = (productName: string) => {
    const product = products.find((p) => p.name === productName);

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
      });
    } else {
      setNewBatch({
        ...newBatch,
        productName,
      });
    }
  };

  const handleSaveBatch = () => {
    if (
      !newBatch.batchNo ||
      !newBatch.productName ||
      !newBatch.mfgDate ||
      !newBatch.expDate
    ) {
      alert("Please fill all mandatory fields.");
      return;
    }
    
    // Date Validation
    if (new Date(newBatch.mfgDate) >= new Date(newBatch.expDate)) {
      alert("Expiry Date must be greater than Manufacturing Date.");
      return;
    }

    // Duplicate batch validation
    const duplicateBatch = batches.find(
      (batch) =>
        batch.batchNo.trim().toLowerCase() ===
          newBatch.batchNo?.trim().toLowerCase() && batch.id !== newBatch.id,
    );

    if (duplicateBatch) {
      alert("Batch Number already exists.");
      return;
    }

    if (isEditingModal && newBatch.id) {
      const updatedBatch: Batch = {
        ...newBatch,
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
        barcode: newBatch.barcode || "",
        remarks: newBatch.remarks || "",
        status: getExpiryStatus(newBatch.expDate || "") as Batch["status"],
      } as Batch;

      setBatches(
        batches.map((b) => (b.id === updatedBatch.id ? updatedBatch : b)),
      );
      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: "Batch Updated",
        module: "Batch Management",
      });
      if (selectedBatch && selectedBatch.id === updatedBatch.id) {
        setSelectedBatch(updatedBatch);
      }
    } else {
      const batch: Batch = {
        id: Date.now().toString(),
        batchNo: newBatch.batchNo!,
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
        mrp: newBatch.mrp || "",
        ptr: newBatch.ptr || "",
        pts: newBatch.pts || "",
        barcode: newBatch.barcode || "",
        remarks: newBatch.remarks || "",
        status: getExpiryStatus(newBatch.expDate || "") as Batch["status"],
      };
      setBatches([batch, ...batches]);

      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: "Batch Created",
        module: "Batch Management",
      });
    }
    setShowBatchModal(false);
  };


  const handleDeleteBatch = () => {
    if (!batchToDelete) return;

    setBatches(batches.filter((b) => b.id !== batchToDelete.id));

    activityLogService.addLog({
      userId: currentUser?.id,
      userName: currentUser?.fullName,
      action: "Batch Deleted",
      module: "Batch Management",
    });

    setBatchToDelete(null);
  };

  const openNewBatchModal = () => {
    setIsEditingModal(false);
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
    setIsEditingModal(true);
    const product = products.find((p) => p.name === selectedBatch.productName);
    setNewBatch({
      ...selectedBatch,
      unit: product?.type || ''
    });
    setShowBatchModal(true);
  };

  const handleExport = () => {
    const headers = ['Batch No', 'Product Name', 'Mfg Date', 'Exp Date', 'Quantity', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [row.batchNo, `"${row.productName}"`, row.mfgDate, row.expDate, row.status].join(','))
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
        <span className="font-semibold text-slate-900">{row.productName}</span>
      ),
    },
    { key: "mfgDate", label: "Mfg Date" },
    { key: "expDate", label: "Exp Date" },
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
    const matchSearch = item.batchNo.toLowerCase().includes(search.toLowerCase()) || item.productName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });


  if (!canView) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-slate-500 mt-2">
          You do not have permission to view Batch Management.
        </p>
      </div>
    );
  }

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
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {isEditingModal ? "Edit Batch" : "Create New Batch"}
              </h2>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  Batch Information
                </h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Batch Number *
                </label>
                <input
                  maxLength={20}
                  value={newBatch.batchNo}
                  onChange={(e) =>
                    !isEditingModal &&
                    setNewBatch({ ...newBatch, batchNo: e.target.value })
                  }
                  readOnly={isEditingModal}
                  className={`w-full border border-slate-200 rounded-lg px-3 py-2 ${isEditingModal ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Product *
                </label>
                <select
                  value={newBatch.productName}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p.id || p.code} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Manufacturer
                </label>
                <input
                  value={newBatch.manufacturer}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                />
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  Manufacturing & Expiry Information
                </h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Manufacturing Date *
                </label>
                <input
                  type="date"
                  value={newBatch.mfgDate}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, mfgDate: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  value={newBatch.expDate}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, expDate: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Shelf Life
                </label>
                <input
                  value={calculateShelfLife(newBatch.mfgDate, newBatch.expDate)}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                />
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  Product Information
                </h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Product type
                </label>
                <input
                  value={newBatch.unit || ""}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                />
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  Pricing Information
                </h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">MRP</label>
                <input
                  value={newBatch.mrp}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">PTR</label>
                <input
                  value={newBatch.ptr}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">PTS</label>
                <input
                  value={newBatch.pts}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                />
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  Additional Information
                </h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Barcode
                </label>
                <input
                  value={newBatch.barcode}
                  maxLength={20}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, barcode: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Remarks
                </label>
                <textarea
                  rows={2}
                  value={newBatch.remarks}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, remarks: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <ActionButton
                variant="secondary"
                onClick={() => setShowBatchModal(false)}
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Delete Batch
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this batch? This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setBatchToDelete(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBatch}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors"
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
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Batch Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Batch Number"
                  value={selectedBatch.batchNo || "N/A"}
                  
                />
                <DrawerField
                  label="Product Name"
                  value={selectedBatch.productName || "N/A"}
                />
                <DrawerField
                  label="Product Code"
                  value={selectedBatch.productCode || "N/A"}
                />
                <DrawerField
                  label="HSN Code"
                  value={selectedBatch.hsnCode || "N/A"}
                />
                <DrawerField label="GST %" value={selectedBatch.gst || "N/A"} />
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
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Manufacturing Details
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Manufacturing Date"
                  value={selectedBatch.mfgDate || "N/A"}
                />
                <DrawerField
                  label="Expiry Date"
                  value={selectedBatch.expDate || "N/A"}
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
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Pricing Details
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="MRP"
                  value={selectedBatch.mrp ? `₹${selectedBatch.mrp}` : "N/A"}
                />
                <DrawerField
                  label="PTR"
                  value={selectedBatch.ptr ? `₹${selectedBatch.ptr}` : "N/A"}
                />
                <DrawerField
                  label="PTS"
                  value={selectedBatch.pts ? `₹${selectedBatch.pts}` : "N/A"}
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
                
                  value={selectedBatch.barcode || "N/A"}
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
              {canEdit && (
                <ActionButton onClick={openEditBatchModal}>
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