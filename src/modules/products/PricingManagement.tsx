import { useEffect, useState, useRef } from 'react';
import { Plus, Filter, Download, Trash2, Search } from 'lucide-react';
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

interface Pricing {
  id: string;
  productId?: string;
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
  effectiveFrom: string;
  effectiveTo?: string;
  remarks?: string;
  status: "Active" | "Pending Approval" | "Approved" | "Draft" | "Scheduled" | "Cancelled" | "Expired" | "Auto";
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return '';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

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

  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const canCreate = true;
  const canEdit = true;
  const canDelete = true;

  const fetchPricings = async () => {
    try {
      const savedData = await pricingService.getAll();
      const allProducts = await productService.loadProducts();
      
      let loadedData = (savedData.length > 0 ? savedData : []).map((item: any) => {
        const product = allProducts.find((p: any) => p.id === String(item.productId));
        const mrpValue = parseFloat(item.mrp) || 0;
        const ptsValue = parseFloat(item.pts) || 0;
        const ptrValue = parseFloat(item.ptr) || 0;
        const stockistMargin = ptrValue > 0 ? (((ptrValue - ptsValue) / ptrValue) * 100).toFixed(2) : "0";
        const retailMargin = mrpValue > 0 ? (((mrpValue - ptrValue) / mrpValue) * 100).toFixed(2) : "0";
        return {
          ...item,
          productCode: product ? product.code : item.productCode,
          productName: product ? product.name : item.productName,
          stockistMargin: item.stockistMargin || `${stockistMargin}%`,
          retailMargin: item.retailMargin || `${retailMargin}%`
        };
      });
      
      const todayStr = new Date().toISOString().split('T')[0];
      let changed = false;
      
      let updatedData = loadedData.map((item: any) => {
        if (item.status === 'Scheduled' && item.effectiveFrom <= todayStr) {
          changed = true;
          return { ...item, status: 'Active' as const };
        }
        return item;
      });

      if (changed) {
        const productsWithActive = Array.from(new Set(updatedData.filter((i:any) => i.status === 'Active').map((i:any) => i.productCode)));
        productsWithActive.forEach(code => {
          const activeItems = updatedData.filter((i:any) => i.productCode === code && i.status === 'Active');
          if (activeItems.length > 1) {
            activeItems.sort((a:any, b:any) => b.effectiveFrom.localeCompare(a.effectiveFrom));
            const latestActiveId = activeItems[0].id;
            updatedData = updatedData.map((item:any) => {
              if (item.productCode === code && item.status === 'Active' && item.id !== latestActiveId) {
                return { ...item, status: 'Expired' as const };
              }
              return item;
            });
          }
        });
      }

      setData(updatedData);
    } catch (error) {
      console.error("Failed to fetch Pricing", error);
      setData([]);
    }
  };

  useEffect(() => {
    fetchPricings();
  }, []);

  useEffect(() => {
    productService.loadProducts().then(refreshedProducts => {
      setProducts(refreshedProducts.filter((p: any) => p.status === 'Active'));
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: "",
    remarks: "",
    status: "Auto" as Pricing["status"],
  });

  const checkPricingInUse = (pricingItem: Pricing) => {
    const invoices = JSON.parse(localStorage.getItem("billing_gst_invoices") || "[]");
    return invoices.some((inv: any) =>
      inv.items.some((item: any) => 
        item.productCode === pricingItem.productCode && 
        `₹ ${Number(item.ptr).toFixed(2)}` === pricingItem.ptr
      )
    );
  };

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

  useEffect(() => {
    const margins = calculateMargins(newPricing.mrp, newPricing.pts, newPricing.ptr);
    setNewPricing(prev => ({
      ...prev,
      stockistMargin: margins.stockistMargin,
      retailMargin: margins.retailMargin
    }));
  }, [newPricing.mrp, newPricing.pts, newPricing.ptr]);

  const resolvePricingStatus = (effFromStr: string, effToStr: string | undefined, currentStatus: string): Pricing['status'] => {
    if (['Cancelled', 'Draft', 'Pending Approval', 'Approved'].includes(currentStatus)) {
      return currentStatus as Pricing['status'];
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (effToStr && todayStr > effToStr) {
      return 'Expired';
    }
    if (effFromStr > todayStr) {
      return 'Scheduled';
    } else {
      return 'Active';
    }
  };

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
            : row.status === "Pending Approval" || row.status === "Approved"
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
            className="text-[#163c78] font-medium hover:text-[#0c1f3d]"
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
    const searchTerm = search?.toLowerCase() || "";
    const matchSearch = (item.productCode?.toLowerCase() || "").includes(searchTerm) || (item.productName?.toLowerCase() || "").includes(searchTerm);
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
      "Effective From",
      "Effective To",
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
          row.stockistMargin,
          row.retailMargin,
          formatDate(row.effectiveFrom) || "",
          formatDate(row.effectiveTo) || "",
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
      productId: product.id,
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
    setProductSearch(`${product.code} - ${product.name}`);
    setShowProductDropdown(false);
  };

  const openNewModal = () => {
    setIsEditingModal(false);
    setProductSearch('');
    setNewPricing({
      id: "",
      productId: "",
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
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: "",
      remarks: "",
      status: "Auto",
    });
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!selectedPricing) return;
    if (selectedPricing.status === 'Cancelled' || selectedPricing.status === 'Expired') {
      alert("Error: Cannot revise Cancelled or Expired pricing records.");
      return;
    }
    setIsEditingModal(true);
    const product = products.find((p) => p.code === selectedPricing.productCode);
    setProductSearch(`${selectedPricing.productCode} - ${selectedPricing.productName}`);
    
    let modalStatus = selectedPricing.status;
    if (['Active', 'Scheduled', 'Expired'].includes(modalStatus)) {
      modalStatus = "Auto" as any;
    }

    setNewPricing({
      id: selectedPricing.id,
      productId: product?.id || "",
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
      effectiveFrom: selectedPricing.effectiveFrom || new Date().toISOString().split('T')[0],
      effectiveTo: selectedPricing.effectiveTo || "",
      remarks: selectedPricing.remarks || "",
      status: modalStatus,
    });
    setShowModal(true);
  };

  const handleSavePricing = async () => {
    if (!newPricing.productName || !newPricing.mrp || !newPricing.ptr || !newPricing.effectiveFrom) {
      alert("Please fill all mandatory fields (*). Product, MRP, PTR, PTS and Effective From are required.");
      return;
    }

    const mrpVal = parseFloat(newPricing.mrp) || 0;
    const ptrVal = parseFloat(newPricing.ptr) || 0;
    const ptsVal = parseFloat(newPricing.pts) || 0;

    if (mrpVal <= 0 || ptrVal <= 0 || ptsVal <= 0) {
      alert("Error: Prices must be positive values greater than 0.");
      return;
    }
    if (mrpVal <= ptrVal) {
      alert("Error: MRP must be strictly greater than PTR.");
      return;
    }
    if (ptrVal <= ptsVal) {
      alert("Error: PTR must be strictly greater than PTS.");
      return;
    }

    if (newPricing.effectiveTo && newPricing.effectiveTo < newPricing.effectiveFrom) {
      alert(`Error: Effective To date cannot be earlier than Effective From date (${formatDate(newPricing.effectiveFrom)}).`);
      return;
    }

    if (parseFloat(newPricing.stockistMargin) < 0 || parseFloat(newPricing.retailMargin) < 0) {
      alert("Error: Margin values cannot be negative.");
      return;
    }

    const trimmedRemarks = newPricing.remarks?.trim() || "";
    if (trimmedRemarks.length > 250) {
      alert("Error: Remarks cannot exceed 250 characters.");
      return;
    }

    const isDuplicate = data.some(
      (item) => item.productCode === newPricing.productCode && item.effectiveFrom === newPricing.effectiveFrom && item.id !== newPricing.id
    );
    if (isDuplicate) {
      alert(`Error: A pricing revision for product "${newPricing.productName}" on effective date "${formatDate(newPricing.effectiveFrom)}" already exists.`);
      return;
    }

    const resolvedStatus = resolvePricingStatus(newPricing.effectiveFrom, newPricing.effectiveTo, newPricing.status);

    let resolvedList = data;
    if (resolvedStatus === 'Active') {
      resolvedList = data.map(item => 
        (item.productCode === newPricing.productCode && item.status === 'Active' && item.id !== newPricing.id)
          ? { ...item, status: 'Expired' as const }
          : item
      );
    }
    
    try {
      if (isEditingModal && newPricing.id && selectedPricing) {
        const payload: Partial<PricingMaster> = {
          productId: newPricing.productId ? Number(newPricing.productId) : 0, 
          mrp: mrpVal,
          ptr: ptrVal,
          pts: ptsVal,
          margin: newPricing.stockistMargin ? parseFloat(newPricing.stockistMargin.toString().replace('%', '')) : 0,
          effectiveDate: newPricing.effectiveFrom ? new Date(newPricing.effectiveFrom).toISOString() : undefined,
        };
        
        const updatedRecord = await pricingService.update(newPricing.id, payload);
        
        const mappedRecord: Pricing = {
          id: updatedRecord.id as string,
          productCode: newPricing.productCode || "N/A",
          productName: newPricing.productName,
          category: newPricing.category,
          hsnCode: newPricing.hsnCode,
          gst: newPricing.gst,
          composition: newPricing.composition,
          packingType: newPricing.packingType,
          scheme: newPricing.scheme,
          mrp: `₹ ${mrpVal.toFixed(2)}`,
          pts: `₹ ${ptsVal.toFixed(2)}`,
          ptr: `₹ ${ptrVal.toFixed(2)}`,
          stockistMargin: newPricing.stockistMargin,
          retailMargin: newPricing.retailMargin,
          effectiveFrom: newPricing.effectiveFrom,
          effectiveTo: newPricing.effectiveTo || undefined,
          remarks: trimmedRemarks,
          status: resolvedStatus,
          updatedBy: currentUser?.fullName,
          updatedAt: new Date().toISOString(),
          createdBy: selectedPricing.createdBy,
          createdAt: selectedPricing.createdAt,
        };
        setData(resolvedList.map(item => item.id === newPricing.id ? mappedRecord : item));

        if (resolvedStatus === 'Active') {
          const productsList = productService.getProducts();
          const updatedProducts = productsList.map((product) =>
            product.code === updatedRecord.productCode
              ? {
                  ...product,
                  mrp: mrpVal.toFixed(2),
                  pts: ptsVal.toFixed(2),
                  ptr: ptrVal.toFixed(2),
                }
              : product
          );
          productService.saveProducts(updatedProducts);
          setProducts(updatedProducts.filter((p: any) => p.status === 'Active'));

          // Sync updated pricing to product master database
          const matchedProduct = productsList.find(p => p.code === updatedRecord.productCode || p.id === String(updatedRecord.productId));
          if (matchedProduct) {
            productService.updateProduct(matchedProduct.id, {
              ...matchedProduct,
              mrp: String(mrpVal),
              ptr: String(ptrVal),
              pts: String(ptsVal)
            }).catch(err => console.error("Failed to sync updated Pricing to product master:", err));
          }
        }
        
        activityLogService.addLog({
          userId: currentUser?.id,
          userName: currentUser?.fullName,
          action: `Pricing Revision Updated - Product: ${newPricing.productName}, MRP: ₹${mrpVal.toFixed(2)}, PTR: ₹${ptrVal.toFixed(2)}`,
          module: "PTR / PTS / PTD Pricing",
        });
        setSelectedPricing(mappedRecord);
      } else {
        const payload: Partial<PricingMaster> = {
          productId: newPricing.productId ? Number(newPricing.productId) : 0, 
          mrp: mrpVal,
          ptr: ptrVal,
          pts: ptsVal,
          margin: newPricing.stockistMargin ? parseFloat(newPricing.stockistMargin.toString().replace('%', '')) : 0,
          effectiveDate: newPricing.effectiveFrom ? new Date(newPricing.effectiveFrom).toISOString() : undefined,
        };
        
        const newRecord = await pricingService.create(payload);
        
        const mappedRecord: Pricing = {
          id: newRecord.id as string,
          productCode: newPricing.productCode || "N/A",
          productName: newPricing.productName,
          category: newPricing.category,
          hsnCode: newPricing.hsnCode,
          gst: newPricing.gst,
          composition: newPricing.composition,
          packingType: newPricing.packingType,
          scheme: newPricing.scheme,
          mrp: `₹ ${mrpVal.toFixed(2)}`,
          pts: `₹ ${ptsVal.toFixed(2)}`,
          ptr: `₹ ${ptrVal.toFixed(2)}`,
          stockistMargin: newPricing.stockistMargin,
          retailMargin: newPricing.retailMargin,
          effectiveFrom: newPricing.effectiveFrom,
          effectiveTo: newPricing.effectiveTo || undefined,
          remarks: trimmedRemarks,
          status: resolvedStatus,
          createdBy: currentUser?.fullName,
          createdAt: new Date().toISOString(),
          updatedBy: currentUser?.fullName,
          updatedAt: new Date().toISOString(),
        };
        setData([mappedRecord, ...resolvedList]);

        if (resolvedStatus === 'Active') {
          const productsList = productService.getProducts();
          const updatedProducts = productsList.map((product) =>
            product.code === mappedRecord.productCode
              ? {
                  ...product,
                  mrp: mrpVal.toFixed(2),
                  pts: ptsVal.toFixed(2),
                  ptr: ptrVal.toFixed(2),
                }
              : product
          );
          productService.saveProducts(updatedProducts);
          setProducts(updatedProducts.filter((p: any) => p.status === 'Active'));

          // Sync new pricing to product master database
          const matchedProduct = productsList.find(p => p.code === mappedRecord.productCode || p.id === String(mappedRecord.productId));
          if (matchedProduct) {
            productService.updateProduct(matchedProduct.id, {
              ...matchedProduct,
              mrp: String(mrpVal),
              ptr: String(ptrVal),
              pts: String(ptsVal)
            }).catch(err => console.error("Failed to sync new Pricing to product master:", err));
          }
        }

        activityLogService.addLog({
          userId: currentUser?.id,
          userName: currentUser?.fullName,
          action: `Pricing Revision Created - Product: ${newPricing.productName}, MRP: ₹${mrpVal.toFixed(2)}, PTR: ₹${ptrVal.toFixed(2)}`,
          module: "PTR / PTS / PTD Pricing",
        });
      }
      
      setShowModal(false);
    } catch (error) {
      console.error("Error saving Pricing:", error);
      alert("Failed to save Pricing revision.");
    }
};

  const handleDelete = async () => {
    if (itemToDelete) {
      const inUse = checkPricingInUse(itemToDelete);
      if (inUse) {
        try {
          await pricingService.update(itemToDelete.id, { status: 'Cancelled' as any });
          const updated = data.map(item =>
            item.id === itemToDelete.id ? { ...item, status: 'Cancelled' as any } : item
          );
          setData(updated);
          activityLogService.addLog({
            userId: currentUser?.id,
            userName: currentUser?.fullName,
            action: `Pricing Revision Cancelled (Delete Blocked due to Invoice usage) - Product: ${itemToDelete.productName}`,
            module: "PTR / PTS / PTD Pricing",
          });
          alert("Warning: This pricing revision is used in invoices. To preserve financial history, it was marked as Cancelled instead of deleted.");
        } catch (error) {
           console.error("Error cancelling pricing:", error);
           alert("Failed to cancel pricing.");
        }
      } else {
        try {
          await pricingService.delete(itemToDelete.id);
          setData(data.filter(item => item.id !== itemToDelete.id));
          activityLogService.addLog({
            userId: currentUser?.id,
            userName: currentUser?.fullName,
            action: `Pricing Revision Deleted for Product: ${itemToDelete.productName}`,
            module: "PTR / PTS / PTD Pricing",
          });
        } catch (error) {
           console.error("Error deleting pricing:", error);
           alert("Failed to delete pricing.");
        }
      }
      setItemToDelete(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="PTR / PTS Pricing"
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
            { label: "Pending Approval", value: "Pending Approval" },
            { label: "Approved", value: "Approved" },
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
                  label="Effective From"
                  value={formatDate(selectedPricing.effectiveFrom) || "N/A"}
                />

                <DrawerField
                  label="Effective To"
                  value={formatDate(selectedPricing.effectiveTo) || "N/A"}
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
                          : selectedPricing.status === "Pending Approval" || selectedPricing.status === "Approved"
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

            {(selectedPricing.createdBy || selectedPricing.updatedBy) && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                  Audit Information
                </h3>
                <div className="space-y-2">
                  {selectedPricing.createdBy && (
                    <>
                      <DrawerField label="Created By" value={selectedPricing.createdBy} />
                      <DrawerField label="Created Date" value={formatDate(selectedPricing.createdAt) || "N/A"} />
                    </>
                  )}
                  {selectedPricing.updatedBy && (
                    <>
                      <DrawerField label="Updated By" value={selectedPricing.updatedBy} />
                      <DrawerField label="Updated Date" value={formatDate(selectedPricing.updatedAt) || "N/A"} />
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              {canEdit && selectedPricing.status !== 'Cancelled' && selectedPricing.status !== 'Expired' && (
                <ActionButton onClick={openEditModal}>
                  Revise Pricing
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

      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setItemToDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {isEditingModal ? "Revise Pricing" : "Update Pricing"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  PRODUCT INFORMATION
                </h3>
              </div>
              
              <div className="md:col-span-2 relative" ref={dropdownRef}>
                <label className="block text-sm font-medium mb-1">
                  Product *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                      if (!e.target.value) {
                        setNewPricing(prev => ({
                          ...prev,
                          productCode: "",
                          productName: "",
                          category: "",
                          hsnCode: "",
                          gst: "",
                          composition: "",
                          packingType: "",
                          scheme: "",
                        }));
                      }
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    disabled={isEditingModal}
                    placeholder="Search by Code or Name..."
                    className={`w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isEditingModal ? "bg-slate-50 text-slate-500 cursor-not-allowed" : "bg-white"
                    }`}
                  />
                  {showProductDropdown && !isEditingModal && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {products
                        .filter(p => 
                          p.code.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.name.toLowerCase().includes(productSearch.toLowerCase())
                        )
                        .map(p => (
                          <div
                            key={p.code}
                            className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                            onClick={() => handleProductSelect(p.code)}
                          >
                            <span className="font-medium text-slate-900">{p.code}</span>
                            <span className="text-slate-500 ml-2">- {p.name}</span>
                          </div>
                        ))}
                      {products.filter(p => 
                          p.code.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.name.toLowerCase().includes(productSearch.toLowerCase())
                        ).length === 0 && (
                        <div className="px-4 py-3 text-sm text-slate-500 text-center">
                          No active products found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Product Code
                </label>
                <input
                  value={newPricing.productCode}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <input
                  value={newPricing.category}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  HSN Code
                </label>
                <input
                  value={newPricing.hsnCode}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GST %</label>
                <input
                  value={newPricing.gst}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Composition
                </label>
                <input
                  value={newPricing.composition}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Packing Type
                </label>
                <input
                  value={newPricing.packingType}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Scheme</label>
                <input
                  value={newPricing.scheme}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500"
                />
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  PRICING INFORMATION
                </h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">MRP *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">₹</span>
                  <input
                    type="number"
                    value={newPricing.mrp}
                    onChange={(e) => setNewPricing({ ...newPricing, mrp: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">PTS *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">₹</span>
                  <input
                    type="number"
                    value={newPricing.pts}
                    onChange={(e) => setNewPricing({ ...newPricing, pts: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">PTR *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">₹</span>
                  <input
                    type="number"
                    value={newPricing.ptr}
                    onChange={(e) => setNewPricing({ ...newPricing, ptr: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Retail Margin %
                </label>
                <input
                  value={newPricing.retailMargin}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Effective From *
                </label>
                <input
                  type="date"
                  value={newPricing.effectiveFrom}
                  onChange={(e) => setNewPricing({ ...newPricing, effectiveFrom: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Effective To
                </label>
                <input
                  type="date"
                  value={newPricing.effectiveTo}
                  min={newPricing.effectiveFrom}
                  onChange={(e) => setNewPricing({ ...newPricing, effectiveTo: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

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
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Auto">Auto-calculated (Active/Scheduled/Expired)</option>
                  <option value="Draft">Draft</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Approved">Approved</option>
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
                  Save Pricing
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}