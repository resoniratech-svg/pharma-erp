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
import { pricingService } from "../../services/pricingService";

import { productService } from "../../services/productService";
import activityLogService from "../../services/activityLogService";
import authService from "../../services/authService";
import { hasModulePermission } from "../../utils/permissionUtils";

interface Pricing {
  id: string;
  productCode: string;
  productName: string;
  hsnCode?: string;
gst?: string;
composition?: string;
packingType?: string;
scheme?: string;


  stockistMargin?: string;
  retailMargin?: string;
  category?: string;
  mrp: string;
  pts: string;
  ptr: string;
  remarks?: string;
  status: "Active" | "Pending Review" | "Draft" | "Scheduled" | "Cancelled";
}

// const mockProducts = [
//   { code: 'PRD-001', name: 'Amoxicillin 500mg', category: 'Capsule', currentMrp: '150.00', currentPts: '105.00', currentPtr: '120.00' },
//   { code: 'PRD-002', name: 'Paracetamol 650mg', category: 'Tablet', currentMrp: '45.00', currentPts: '32.00', currentPtr: '38.00' },
//   { code: 'PRD-003', name: 'Cough Syrup 100ml', category: 'Syrup', currentMrp: '85.00', currentPts: '60.00', currentPtr: '72.00' },
//   { code: 'PRD-004', name: 'Vitamin C 1000mg', category: 'Tablet', currentMrp: '120.00', currentPts: '85.00', currentPtr: '100.00' },
//   { code: 'PRD-005', name: 'Ibuprofen 400mg', category: 'Tablet', currentMrp: '65.00', currentPts: '45.00', currentPtr: '55.00' },
// ];

const initialMockData: Pricing[] = [
  {
    id: "1",
    productCode: "PRD-001",
    productName: "Amoxicillin 500mg",
    category: "Capsule",
    mrp: "₹ 150.00",
    pts: "₹ 105.00",
    ptr: "₹ 120.00",
    stockistMargin: "12.50%",
    retailMargin: "20.00%",
    remarks: "",
    status: "Active",
  },
  {
    id: "2",
    productCode: "PRD-002",
    productName: "Paracetamol 650mg",
    category: "Tablet",
    mrp: "₹ 45.00",
    pts: "₹ 32.00",
    ptr: "₹ 38.00",
    stockistMargin: "15.79%",
    retailMargin: "15.56%",
    remarks: "",
    status: "Active",
  },
  {
    id: "3",
    productCode: "PRD-003",
    productName: "Cough Syrup 100ml",
    category: "Syrup",
    mrp: "₹ 85.00",
    pts: "₹ 60.00",
    ptr: "₹ 72.00",
    stockistMargin: "16.67%",
    retailMargin: "15.29%",
    remarks: "",
    status: "Pending Review",
  },
  {
    id: "4",
    productCode: "PRD-004",
    productName: "Vitamin C 1000mg",
    category: "Tablet",
    mrp: "₹ 120.00",
    pts: "₹ 85.00",
    ptr: "₹ 100.00",
    stockistMargin: "15.00%",
    retailMargin: "16.67%",
    remarks: "",
    status: "Active",
  },
  {
    id: "5",
    productCode: "PRD-005",
    productName: "Ibuprofen 400mg",
    category: "Tablet",
    mrp: "₹ 65.00",
    pts: "₹ 45.00",
    ptr: "₹ 55.00",
    stockistMargin: "18.18%",
    retailMargin: "15.38%",
    remarks: "",
    status: "Active",
  },
];

export default function PricingManagement() {
  const [data, setData] = useState<Pricing[]>([]);
  
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedPricing, setSelectedPricing] = useState<Pricing | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Pricing | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const currentUser = authService.getCurrentUser();

  

  const activeRole = localStorage.getItem("activeRole") || "";

  const canCreate = hasModulePermission(
    activeRole,
    "Products & Master",
    "Create",
  );

  const canEdit = hasModulePermission(activeRole, "Products & Master", "Edit");

  const canDelete = hasModulePermission(
    activeRole,
    "Products & Master",
    "Delete",
  );

  useEffect(() => {
    const savedData = pricingService.getAll();

    if (savedData.length > 0) {
      setData(savedData);
    } else {
      setData(initialMockData);
      pricingService.saveAll(initialMockData);
    }
    

  }, []);


  useEffect(() => {
    if (data.length > 0) {
      pricingService.saveAll(data);
    }
  }, [data]);


  useEffect(() => {
    const savedProducts = productService.getProducts();
    setProducts(savedProducts);
  }, []);

  const [newPricing, setNewPricing] = useState({
    id: "",
    productName: "",
    productCode: "",
    category: "",
    hsnCode: "",
    gst: "",
    composition: "",
    packingType: "",
    scheme: "",
    mrp: "",
    pts: "",
    ptr: "",
    stockistMargin: "",
    retailMargin: "",

    remarks: "",
    status: "Draft" as
      | "Draft"
      | "Scheduled"
      | "Active"
      | "Cancelled"
      | "Pending Review",
  });

  const columns: Column<Pricing>[] = [
    { key: "productCode", label: "Code" },
    {
      key: "productName",
      label: "Product Name",
      render: (row) => (
        <span className="font-semibold text-slate-900">{row.productName}</span>
      ),
    },
    { key: "mrp", label: "MRP" },
    { key: "pts", label: "PTS (To Stockist)" },
    { key: "ptr", label: "PTR (To Retailer)" },
    
    {
      key: "stockistMargin",
      label: "Stockist Margin %",
    },
    {
      key: "retailMargin",
      label: "Retail Margin %",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const variant =
          row.status === "Active" || row.status === "Scheduled"
            ? "success"
            : row.status === "Pending Review"
              ? "warning"
              : row.status === "Draft" || row.status === "Cancelled"
                ? "neutral"
                : "danger";
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
              setSelectedPricing(row);
            }}
            className="text-violet-600 font-medium hover:text-violet-800"
          >
            View
          </button>
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setItemToDelete(row);
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

  const filteredData = data.filter((item) => {
    const matchSearch = item.productCode.toLowerCase().includes(search.toLowerCase()) || item.productName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const handleExport = () => {
    const headers = [
      "Code",
      "Product Name",
      "MRP",
      "PTS",
      "PTR",
      "Stockist Margin %",
      "Retail Margin %",
      "Status",
    ];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          row.productCode, 
          `"${row.productName}"`, 
          row.mrp.replace(/[^0-9.]/g, ''), 
          row.pts.replace(/[^0-9.]/g, ''), 
          row.ptr.replace(/[^0-9.]/g, ''), 
          `"${row.stockistMargin,
row.retailMargin}"`, 
          row.status
        ].join(',')
      )
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'pricing_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProductSelect = (productCode: string) => {
    const product = products.find((p) => p.code === productCode);

    if (!product) return;

    setNewPricing({
      ...newPricing,

      productName: product.name,
      productCode: product.code,

      category: product.category || "",

      mrp: product.mrp || "",
      pts: product.pts || "",
      ptr: product.ptr || "",
      hsnCode: product.hsnCode || "",

      gst: product.gst || "",

      composition: product.composition || "",

      packingType: product.packingType || "",

      scheme: product.scheme || "",
    });
  };

  const openNewModal = () => {
    setIsEditingModal(false);
    setNewPricing({
      id: "",
      productName: "",
      productCode: "",
      category: "",
      hsnCode: "",
      gst: "",
      composition: "",
      packingType: "",
      scheme: "",
      mrp: "",
      pts: "",
      ptr: "",
      stockistMargin: "",
      retailMargin: "",
      remarks: "",
      status: "Draft",
    });
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!selectedPricing) return;
    setIsEditingModal(true);
    const product = products.find(
      (p) => p.code === selectedPricing.productCode,
    );
    setNewPricing({
      id: selectedPricing.id,
      productName: selectedPricing.productName,
      productCode: selectedPricing.productCode,
      category: selectedPricing.category || product?.category || "",
      hsnCode: product?.hsnCode || "",

      gst: product?.gst || "",

      composition: product?.composition || "",

      packingType: product?.packingType || "",

      scheme: product?.scheme || "",
      mrp: selectedPricing.mrp.replace(/[^0-9.]/g, ""),

      pts: selectedPricing.pts.replace(/[^0-9.]/g, ""),

      ptr: selectedPricing.ptr.replace(/[^0-9.]/g, ""),

      stockistMargin: selectedPricing.stockistMargin || "",
      retailMargin: selectedPricing.retailMargin || "",

      remarks: selectedPricing.remarks || "",

      status: selectedPricing.status,
    });
    setShowModal(true);
  };

  //  const calculateMargin = (pts: string, ptr: string) => {
  //    const ptsNum = parseFloat(pts);
  //    const ptrNum = parseFloat(ptr);

  //    if (!isNaN(ptsNum) && !isNaN(ptrNum) && ptrNum > 0) {
  //      return `${(((ptrNum - ptsNum) / ptrNum) * 100).toFixed(1)}%`;
  //    }

  //    return "0%";
  //  };



   const calculateMargins = (mrp: string, pts: string, ptr: string) => {
     const mrpValue = parseFloat(mrp) || 0;
     const ptsValue = parseFloat(pts) || 0;
     const ptrValue = parseFloat(ptr) || 0;

     const stockistMargin =
       ptrValue > 0
         ? (((ptrValue - ptsValue) / ptrValue) * 100).toFixed(2)
         : "0";

     const retailMargin =
       mrpValue > 0
         ? (((mrpValue - ptrValue) / mrpValue) * 100).toFixed(2)
         : "0";

     return {
       stockistMargin: `${stockistMargin}%`,
       retailMargin: `${retailMargin}%`,
     };
   };



  const handleSavePricing = () => {
    if (
  !newPricing.productName ||
  !newPricing.mrp ||
  !newPricing.pts ||
  !newPricing.ptr ||
  !newPricing.status
){
      alert("Please fill all mandatory fields (*).");
      return;
    }
    
    if (isEditingModal && newPricing.id && selectedPricing) {
      const updatedRecord: Pricing = {
        id: newPricing.id,
        productCode: newPricing.productCode || "N/A",
        productName: newPricing.productName,
        category: newPricing.category,
        hsnCode: newPricing.hsnCode,
        gst: newPricing.gst,
        composition: newPricing.composition,
        packingType: newPricing.packingType,
        scheme: newPricing.scheme,
        mrp: `₹ ${Number(newPricing.mrp).toFixed(2)}`,
        pts: `₹ ${Number(newPricing.pts).toFixed(2)}`,
        ptr: `₹ ${Number(newPricing.ptr).toFixed(2)}`,

        stockistMargin: newPricing.stockistMargin,

        retailMargin: newPricing.retailMargin,

        remarks: newPricing.remarks,

        status: newPricing.status as any,
      };
      
      setData(data.map(item => item.id === updatedRecord.id ? updatedRecord : item));

      const products = productService.getProducts();

      const updatedProducts = products.map((product) =>
        product.code === updatedRecord.productCode
          ? {
              ...product,
              
              pts: Number(newPricing.pts).toFixed(2),
              ptr: Number(newPricing.ptr).toFixed(2),
            }
          : product,
      );

      productService.saveProducts(updatedProducts);

     
      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: "Pricing Updated",
        module: "PTR / PTS / PTD Pricing",
      });
      if (selectedPricing && selectedPricing.id === updatedRecord.id) {
        setSelectedPricing(updatedRecord);
      }
    } else {
      const record: Pricing = {
        id: Date.now().toString(),
        productCode: newPricing.productCode || "N/A",
        productName: newPricing.productName,
        category: newPricing.category,
        hsnCode: newPricing.hsnCode,
        gst: newPricing.gst,
        composition: newPricing.composition,
        packingType: newPricing.packingType,
        scheme: newPricing.scheme,
        mrp: `₹ ${Number(newPricing.mrp).toFixed(2)}`,
        pts: `₹ ${Number(newPricing.pts).toFixed(2)}`,
        ptr: `₹ ${Number(newPricing.ptr).toFixed(2)}`,

        stockistMargin: newPricing.stockistMargin,

        retailMargin: newPricing.retailMargin,

        remarks: newPricing.remarks,

        status: newPricing.status as any,
      };
      setData([record, ...data]);
      const products = productService.getProducts();

      const updatedProducts = products.map((product) =>
        product.code === record.productCode
          ? {
              ...product,
            
              pts: Number(newPricing.pts).toFixed(2),
              ptr: Number(newPricing.ptr).toFixed(2),
            }
          : product,
      );

      productService.saveProducts(updatedProducts);

      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: "Pricing Created",
        module: "PTR / PTS / PTD Pricing",
      });
    }
    
    setShowModal(false);
  };

  const handleDelete = () => {
    if (itemToDelete) {
      setData(data.filter(item => item.id !== itemToDelete.id));
      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: "Pricing Deleted",
        module: "PTR / PTS / PTD Pricing",
      });
      setItemToDelete(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="PTR / PTS / PTD Pricing"
        subtitle="Manage MRP, PTS, PTR, and product margins."
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
                onClick={openNewModal}
              >
                Update Pricing
              </ActionButton>
            )}
          </>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search product..."
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
            { label: "Active", value: "Active" },
            { label: "Pending Review", value: "Pending Review" },
            { label: "Draft", value: "Draft" },
            { label: "Scheduled", value: "Scheduled" },
            { label: "Cancelled", value: "Cancelled" },
            { label: "Expired", value: "Expired" },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedPricing(row)}
          emptyMessage="No pricing records found."
        />
      </TableCard>

      {/* Pricing Details Drawer */}
      <Drawer
        open={!!selectedPricing}
        onClose={() => setSelectedPricing(null)}
        title="Pricing Details"
      >
        {selectedPricing && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Product Information
              </h3>

              <div className="space-y-2">
                <DrawerField
                  label="Product Code"
                  value={selectedPricing.productCode}
                />

                <DrawerField
                  label="Product Name"
                  value={selectedPricing.productName}
                />

                <DrawerField
                  label="Category"
                  value={selectedPricing.category || "N/A"}
                />

                <DrawerField
                  label="HSN Code"
                  value={selectedPricing.hsnCode || "N/A"}
                />

                <DrawerField
                  label="GST %"
                  value={
                    selectedPricing.gst ? `${selectedPricing.gst}%` : "N/A"
                  }
                />

                <DrawerField
                  label="Composition"
                  value={selectedPricing.composition || "N/A"}
                />

                <DrawerField
                  label="Packing Type"
                  value={selectedPricing.packingType || "N/A"}
                />

                <DrawerField
                  label="Scheme"
                  value={selectedPricing.scheme || "N/A"}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Pricing Information
              </h3>
              <div className="space-y-2">
                <DrawerField label="MRP" value={selectedPricing.mrp} />

                <DrawerField label="PTS" value={selectedPricing.pts} />

                <DrawerField label="PTR" value={selectedPricing.ptr} />

                <DrawerField
                  label="Retail Margin %"
                  value={selectedPricing.retailMargin || "N/A"}
                />

                <DrawerField
                  label="Stockist Margin %"
                  value={selectedPricing.stockistMargin || "N/A"}
                />

                <DrawerField
                  label="Remarks"
                  value={selectedPricing.remarks || "N/A"}
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
                        selectedPricing.status === "Active" ||
                        selectedPricing.status === "Scheduled"
                          ? "success"
                          : selectedPricing.status === "Pending Review"
                            ? "warning"
                            : selectedPricing.status === "Draft" ||
                                selectedPricing.status === "Cancelled"
                              ? "neutral"
                              : "danger"
                      }
                    >
                      {selectedPricing.status}
                    </Badge>
                  }
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              {canEdit && (
                <ActionButton onClick={openEditModal}>
                  Edit Pricing
                </ActionButton>
              )}
              <ActionButton
                variant="secondary"
                onClick={() => setSelectedPricing(null)}
              >
                Close
              </ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Delete Pricing Record
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this pricing record? This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {isEditingModal ? "Edit Pricing" : "Update Pricing"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PRODUCT INFORMATION */}
              <div className="md:col-span-2 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  PRODUCT INFORMATION
                </h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Product Name *
                </label>

                <select
                  value={newPricing.productCode}
                  onChange={(e) =>
                    !isEditingModal && handleProductSelect(e.target.value)
                  }
                  disabled={isEditingModal}
                  className={`w-full border border-slate-200 rounded-lg px-3 py-2 ${
                    isEditingModal
                      ? "bg-slate-50 opacity-70 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <option value="">Select Product</option>

                  {products.map((p) => (
                    <option key={p.id} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Product Code
                </label>
                <input
                  value={newPricing.productCode}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <input
                  value={newPricing.category}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  HSN Code
                </label>

                <input
                  value={newPricing.hsnCode}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GST %</label>

                <input
                  value={newPricing.gst}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Composition
                </label>

                <input
                  value={newPricing.composition}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Packing Type
                </label>

                <input
                  value={newPricing.packingType}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Scheme</label>

                <input
                  value={newPricing.scheme}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                />
              </div>

              {/* NEW PRICING INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  PRICING INFORMATION
                </h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">MRP *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={newPricing.mrp}
                    onChange={(e) => {
                      const updatedMrp = e.target.value;

                      const margins = calculateMargins(
                        updatedMrp,
                        newPricing.pts,
                        newPricing.ptr,
                      );

                      setNewPricing({
                        ...newPricing,
                        mrp: updatedMrp,
                        stockistMargin: margins.stockistMargin,
                        retailMargin: margins.retailMargin,
                      });
                    }}
                    className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">PTS *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={newPricing.pts}
                    onChange={(e) => {
                      const updatedPts = e.target.value;

                      const margins = calculateMargins(
                        newPricing.mrp,
                        updatedPts,
                        newPricing.ptr,
                      );

                      setNewPricing({
                        ...newPricing,
                        pts: updatedPts,
                        stockistMargin: margins.stockistMargin,
                        retailMargin: margins.retailMargin,
                      });
                    }}
                    className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">PTR *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={newPricing.ptr}
                    onChange={(e) => {
                      const updatedPtr = e.target.value;

                      const margins = calculateMargins(
                        newPricing.mrp,
                        newPricing.pts,
                        updatedPtr,
                      );

                      setNewPricing({
                        ...newPricing,
                        ptr: updatedPtr,
                        stockistMargin: margins.stockistMargin,
                        retailMargin: margins.retailMargin,
                      });
                    }}
                    className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Stockist Margin %
                </label>

                <input
                  value={newPricing.stockistMargin}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Retail Margin %
                </label>

                <input
                  value={newPricing.retailMargin}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Remarks
                </label>

                <textarea
                  rows={2}
                  value={newPricing.remarks}
                  onChange={(e) =>
                    setNewPricing({
                      ...newPricing,
                      remarks: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              {/* STATUS INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  STATUS INFORMATION
                </h3>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={newPricing.status}
                  onChange={(e) =>
                    setNewPricing({
                      ...newPricing,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="Draft">Draft</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Active">Active</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                <ActionButton
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </ActionButton>

                <ActionButton onClick={handleSavePricing}>
                  {isEditingModal ? "Save Changes" : "Save Pricing"}
                </ActionButton>
              </div>
            </div>{" "}
            {/* CLOSE GRID */}
          </div>{" "}
          {/* CLOSE MODAL CONTAINER */}
        </div>
      )}
    </div>
  );
}
