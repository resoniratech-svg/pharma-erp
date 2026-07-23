// src/modules/products/BarcodeManagement.tsx
import { useState, useEffect } from "react";
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
import { barcodeService, type BarcodeRecord } from "../../services/barcodeService";
import { productService } from "../../services/productService";
import activityLogService from "../../services/activityLogService";
import authService from "../../services/authService";

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

interface InvoiceItem {
  productCode: string;
  barcode?: string;
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

export default function BarcodeManagement() {
  const [data, setData] = useState<BarcodeRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const currentUser = authService.getCurrentUser();
  
  const [selectedBarcode, setSelectedBarcode] = useState<BarcodeRecord | null>(null);
  const [itemToDelete, setItemToDelete] = useState<BarcodeRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  useEffect(() => {
    productService.loadProducts().then((savedProducts) => {
      setProducts((savedProducts as Product[]) || []);
    });
    barcodeService.loadBarcodes().then((savedData) => {
      setData(savedData || []);
    });
  }, []);

  const canCreate = true;
  const canEdit = true;
  const canDelete = true;

  const [newBarcode, setNewBarcode] = useState<{
    id: string;
    productName: string;
    productCode: string;
    type: string;
    barcodeNumber: string;
    status: 'Active' | 'Inactive' | 'Unassigned';
    remarks: string;
  }>({
    id: '',
    productName: '',
    productCode: '',
    type: 'EAN-13',
    barcodeNumber: '',
    status: 'Active',
    remarks: ''
  });

  const checkBarcodeInUse = (barcodeItem: BarcodeRecord) => {
    const invoices = JSON.parse(localStorage.getItem("billing_gst_invoices") || "[]") as Invoice[];
    return invoices.some((inv) =>
      inv.items?.some((item) => item.barcode === barcodeItem.barcode)
    );
  };

  const getProductDisplay = (code: string, fallbackName: string) => {
    const match = products.find(p => p.code === code);
    return match ? match.name : `${fallbackName} (Deleted Product)`;
  };

  const generateAutoBarcode = (type: string): string => {
    if (type === 'EAN-13') {
      const codeBase = "890" + Math.floor(1000000000 + Math.random() * 9000000000).toString().slice(0, 9);
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(codeBase[i]) * (i % 2 === 0 ? 1 : 3);
      }
      const checksum = (10 - (sum % 10)) % 10;
      return codeBase + checksum.toString();
    } else if (type === 'Code 128') {
      return "C128-" + Math.floor(100000 + Math.random() * 900000).toString();
    } else {
      return "QR-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
  };

  const columns: Column<BarcodeRecord>[] = [
    { key: 'productCode', label: 'Product Code' },
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{getProductDisplay(row.productCode, row.productName)}</span> },
    { key: 'barcode', label: 'Barcode', render: (row) => row.barcode ? <span className="font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded">{row.barcode}</span> : <span className="text-slate-400 italic">Unassigned</span> },
    { key: 'type', label: 'Barcode Type', render: (row) => row.barcode ? row.type : '-' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : (row.status === 'Unassigned' ? 'warning' : 'neutral');
        return <Badge variant={variant as any}>{row.status}</Badge>;
      },
    },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBarcode(row);
            }}
            className="text-[#163c78] font-medium hover:text-[#0c1f3d]"
          >
            View
          </button>
          {canDelete && row.barcode && (
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
      )
    }
  ];

  const filteredData = data.filter((item) => {
    const matchSearch = item.barcode.toLowerCase().includes(search.toLowerCase()) || 
                        getProductDisplay(item.productCode, item.productName).toLowerCase().includes(search.toLowerCase()) ||
                        item.productCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  }).sort((a, b) => {
    // Sort by status first
    const statusOrder: Record<string, number> = { 'Active': 0, 'Inactive': 1, 'Unassigned': 2 };
    const orderA = statusOrder[a.status] ?? 3;
    const orderB = statusOrder[b.status] ?? 3;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // Then sort by date (newest first)
    const dateA = new Date(a.assignedDate || 0).getTime();
    const dateB = new Date(b.assignedDate || 0).getTime();
    return dateB - dateA;
  });

  const handleExport = () => {
    const headers = ['Product Code', 'Product Name', 'Barcode', 'Barcode Type', 'Status', 'Assigned Date'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          `="${row.productCode}"`,
          `="${getProductDisplay(row.productCode, row.productName)}"`, 
          `="${row.barcode}"`, 
          row.type, 
          row.status,
          formatDate(row.assignedDate)
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'barcode_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProductSelect = (productCode: string) => {
    const product = products.find((p) => p.code === productCode);
    if (product) {
      setNewBarcode((prev) => ({
        ...prev,
        productName: product.name,
        productCode: product.code,
      }));
    } else {
      setNewBarcode((prev) => ({
        ...prev,
        productName: '',
        productCode: '', 
      }));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setShowProductDropdown(false);
    setProductSearch("");
  };

  const openNewModal = () => {
    setIsEditingModal(false);
    setValidationError('');
    setProductSearch('');
    setShowProductDropdown(false);
    setNewBarcode({
      id: '',
      productName: '',
      productCode: '',
      type: 'EAN-13',
      barcodeNumber: '',
      status: 'Active',
      remarks: ''
    });
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!selectedBarcode) return;
    setIsEditingModal(true);
    setValidationError('');
    setShowProductDropdown(false);
    setProductSearch(selectedBarcode.productCode ? `${selectedBarcode.productCode} - ${getProductDisplay(selectedBarcode.productCode, selectedBarcode.productName)}` : "");
    setNewBarcode({
      id: selectedBarcode.id,
      productName: selectedBarcode.productName,
      productCode: selectedBarcode.productCode,
      type: selectedBarcode.type,
      barcodeNumber: selectedBarcode.barcode,
      status: selectedBarcode.status,
      remarks: selectedBarcode.remarks || ''
    });
    setShowModal(true);
  };

  const handleSaveBarcode = () => {
    setValidationError('');
    
    const trimmedBarcode = newBarcode.barcodeNumber.trim();
    const trimmedRemarks = newBarcode.remarks.trim().substring(0, 250);

    if (!newBarcode.productCode || !newBarcode.type || !newBarcode.status) {
      setValidationError("Please fill all mandatory fields (*).");
      return;
    }

    const matchingProduct = products.find(p => p.code === newBarcode.productCode);
    if (!matchingProduct) {
      setValidationError("Please select a valid existing active product.");
      return;
    }

    let resolvedBarcodeNum = trimmedBarcode;
    
    if (resolvedBarcodeNum === "") {
      let isGenDuplicate = true;
      let attempts = 0;
      while (isGenDuplicate && attempts < 15) {
        resolvedBarcodeNum = generateAutoBarcode(newBarcode.type);
        isGenDuplicate = barcodeService.barcodeExists(resolvedBarcodeNum);
        attempts++;
      }
    }

    if (!resolvedBarcodeNum) {
      setValidationError("Barcode cannot be empty or only spaces.");
      return;
    }

    const existingByBarcode = barcodeService.getBarcodeByValue(resolvedBarcodeNum);
    if (existingByBarcode && existingByBarcode.id !== newBarcode.id) {
      setValidationError("This Barcode Number is already assigned to another product. Barcodes must be unique.");
      return;
    }
    
    const today = new Date().toISOString();

    if (isEditingModal && newBarcode.id) {
      if (newBarcode.status === 'Active') {
        const others = data.filter(b => b.productCode === newBarcode.productCode && b.id !== newBarcode.id && b.status === 'Active');
        others.forEach(o => {
          barcodeService.updateBarcode(o.id, { status: 'Inactive' });
        });
      }

      const updated = barcodeService.updateBarcode(newBarcode.id, {
        barcode: resolvedBarcodeNum,
        type: newBarcode.type,
        status: newBarcode.status as any,
        remarks: trimmedRemarks
      });

      if (updated) {
        setData(barcodeService.getAll());
        
        if (newBarcode.status === 'Active') {
          const productList = productService.getProducts();
          const matchedProduct = productList.find((p: any) => p.code === updated.productCode);
          if (matchedProduct) {
            productService.updateProduct(matchedProduct.id, {
              ...matchedProduct,
              barcode: updated.barcode
            }).catch(err => console.error("Failed to sync barcode to database:", err));
          }
          const updatedProducts = productList.map((p: any) =>
            p.code === updated.productCode ? { ...p, barcode: updated.barcode } : p
          );
          productService.saveProducts(updatedProducts);
        }

        activityLogService.addLog({
          userId: currentUser?.id,
          userName: currentUser?.fullName,
          action: `Barcode Updated - Product: ${matchingProduct.name}, Barcode: ${resolvedBarcodeNum}`,
          module: "Barcode Management",
        });
        
        if (selectedBarcode && selectedBarcode.id === updated.id) {
          setSelectedBarcode(updated);
        }
      }
    } else {
      if (newBarcode.status === 'Active') {
        const others = data.filter(b => b.productCode === newBarcode.productCode && b.status === 'Active');
        others.forEach(o => {
          barcodeService.updateBarcode(o.id, { status: 'Inactive' });
        });
      }

      const created = barcodeService.createBarcode({
        barcode: resolvedBarcodeNum,
        productCode: newBarcode.productCode,
        productName: matchingProduct.name,
        type: newBarcode.type,
        assignedDate: today,
        generatedBy: currentUser?.fullName || 'Admin User',
        generatedDate: today,
        status: newBarcode.status as any,
        remarks: trimmedRemarks
      });

      setData(barcodeService.getAll());

      if (newBarcode.status === 'Active') {
        const productList = productService.getProducts();
        const matchedProduct = productList.find((p: any) => p.code === created.productCode);
        if (matchedProduct) {
          productService.updateProduct(matchedProduct.id, {
            ...matchedProduct,
            barcode: created.barcode
          }).catch(err => console.error("Failed to sync barcode to database:", err));
        }
        const updatedProducts = productList.map((p: any) =>
          p.code === created.productCode ? { ...p, barcode: created.barcode } : p
        );
        productService.saveProducts(updatedProducts);
      }

      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: `Barcode Created - Product: ${matchingProduct.name}, Barcode: ${resolvedBarcodeNum}`,
        module: "Barcode Management",
      });
    }
    
    closeModal();
  };

  const handleDelete = () => {
    if (itemToDelete) {
      const inUse = checkBarcodeInUse(itemToDelete);
      if (inUse) {
        barcodeService.updateBarcode(itemToDelete.id, { status: 'Inactive' });
        setData(barcodeService.getAll());
        activityLogService.addLog({
          userId: currentUser?.id,
          userName: currentUser?.fullName,
          action: `Barcode marked Inactive (Delete Blocked due to invoice references) - Barcode: ${itemToDelete.barcode}`,
          module: "Barcode Management",
        });
        alert("Warning: This barcode is referenced in invoices. It has been marked as Inactive instead of deleted to preserve history.");
      } else {
        barcodeService.deleteBarcode(itemToDelete.id);
        setData(barcodeService.getAll());
        
        // Sync barcode deletion to backend database
        const productList = productService.getProducts();
        const matchedProduct = productList.find((p: any) => p.code === itemToDelete.productCode);
        if (matchedProduct) {
          productService.updateProduct(matchedProduct.id, {
            ...matchedProduct,
            barcode: ''
          }).catch(err => console.error("Failed to clear barcode in database:", err));
        }

        activityLogService.addLog({
          userId: currentUser?.id,
          userName: currentUser?.fullName,
          action: `Barcode Deleted - Barcode: ${itemToDelete.barcode}`,
          module: "Barcode Management",
        });
      }
      setItemToDelete(null);
    }
  };

  const activeProducts = products.filter(p => !p.status || p.status === 'Active');
  const selectedProduct = products.find(p => p.code === newBarcode.productCode);

  return (
    <div className="animate-in fade-in duration-500 bg-white">
      <PageHeader
        title="Barcode Management"
        subtitle="Manage product barcodes, EAN/UPC mapping, and generation."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExport}>
              Export
            </ActionButton>
            {canCreate && (
              <ActionButton icon={<Plus className="w-4 h-4" />} onClick={openNewModal}>
                Generate Barcode
              </ActionButton>
            )}
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search barcode or product..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Active', value: 'Active' },
            { label: 'Unassigned', value: 'Unassigned' },
            { label: 'Inactive', value: 'Inactive' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedBarcode(row)}
          emptyMessage="No barcodes found."
        />
      </TableCard>

      {/* Barcode Details Drawer */}
      <Drawer
        open={!!selectedBarcode}
        onClose={() => setSelectedBarcode(null)}
        title="Barcode Details"
      >
        {selectedBarcode && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Product Information</h3>
              <div className="space-y-2">
                <DrawerField label="Product Name" value={getProductDisplay(selectedBarcode.productCode, selectedBarcode.productName)} />
                <DrawerField label="Product Code" value={selectedBarcode.productCode} />
                <DrawerField label="Category" value={products.find(p => p.code === selectedBarcode.productCode)?.category || "N/A"} />
                <DrawerField label="Manufacturer" value={products.find(p => p.code === selectedBarcode.productCode)?.manufacturer || "N/A"} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Barcode Information</h3>
              <div className="space-y-2">
                <DrawerField label="Barcode Number" value={
                  <span className="font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded">{selectedBarcode.barcode}</span>
                } />
                <DrawerField label="Barcode Type" value={selectedBarcode.type} />
                <DrawerField
                  label="Status"
                  value={
                    <Badge variant={selectedBarcode.status === 'Active' ? 'success' : (selectedBarcode.status === 'Unassigned' ? 'warning' : 'neutral')}>
                      {selectedBarcode.status}
                    </Badge>
                  }
                />
                <DrawerField label="Remarks" value={selectedBarcode.remarks || 'N/A'} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Audit Information</h3>
              <div className="space-y-2">
                <DrawerField label="Generated By" value={selectedBarcode.generatedBy || 'System'} />
                <DrawerField label="Generated Date" value={formatDate(selectedBarcode.generatedDate || selectedBarcode.assignedDate)} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              {canEdit && selectedBarcode.status !== 'Inactive' && (
                <ActionButton onClick={openEditModal}>Edit Barcode</ActionButton>
              )}
              <ActionButton variant="secondary" onClick={() => setSelectedBarcode(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setItemToDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Barcode Record</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this barcode record? If this barcode has already been used in billing invoices, it will be marked Inactive instead of permanently deleted.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setItemToDelete(null)} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate / Edit Barcode Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-900">{isEditingModal ? 'Edit Barcode' : 'Generate Barcode'}</h2>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors outline-none">✕</button>
            </div>

            <div className="p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {validationError && (
                <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 font-medium">
                  {validationError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PRODUCT INFORMATION */}
                <div className="md:col-span-2 mt-2 first:mt-0">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">PRODUCT INFORMATION</h3>
                </div>
                
                <div className="relative md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Product *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={isEditingModal ? getProductDisplay(newBarcode.productCode, newBarcode.productName) : productSearch}
                      onChange={(e) => {
                        if (!isEditingModal) {
                          setProductSearch(e.target.value);
                          setShowProductDropdown(true);
                          if (newBarcode.productCode) {
                            setNewBarcode({ ...newBarcode, productCode: "", productName: "" });
                          }
                        }
                      }}
                      onFocus={() => !isEditingModal && setShowProductDropdown(true)}
                      placeholder="Search Product..."
                      className={`w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-violet-400 ${isEditingModal ? "bg-slate-50 text-slate-500 cursor-not-allowed" : "bg-white text-slate-900"}`}
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
                        {activeProducts
                          .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.code.toLowerCase().includes(productSearch.toLowerCase()))
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
                        {activeProducts.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.code.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-sm text-slate-500 italic">No matching active products found</div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Product Code</label>
                  <input 
                    value={newBarcode.productCode} 
                    readOnly 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" 
                    placeholder="Auto-populated"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Category</label>
                  <input 
                    value={selectedProduct?.category || ""} 
                    readOnly 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" 
                    placeholder="Auto-populated"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Manufacturer</label>
                  <input 
                    value={selectedProduct?.manufacturer || ""} 
                    readOnly 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" 
                    placeholder="Auto-populated"
                  />
                </div>

                {/* BARCODE INFORMATION */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">BARCODE INFORMATION</h3>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Barcode Type *</label>
                  <select 
                    value={newBarcode.type} 
                    onChange={(e) => setNewBarcode({ ...newBarcode, type: e.target.value })} 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:border-violet-400"
                  >
                    <option value="EAN-13">EAN-13</option>
                    <option value="Code 128">Code 128</option>
                    <option value="QR Code">QR Code</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Barcode Number *</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newBarcode.barcodeNumber} 
                      onChange={(e) => setNewBarcode({ ...newBarcode, barcodeNumber: e.target.value })} 
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 font-mono bg-white text-slate-900 focus:outline-none focus:border-violet-400" 
                      placeholder="Leave blank to auto-generate"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const autoCode = generateAutoBarcode(newBarcode.type);
                        setNewBarcode({ ...newBarcode, barcodeNumber: autoCode });
                      }}
                      className="px-3 py-2 bg-[#163c78]/10 text-[#163c78] border border-violet-200 rounded-lg text-sm font-medium hover:bg-violet-100 transition-colors"
                    >
                      Auto-Generate
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Remarks</label>
                  <textarea
                    rows={2}
                    maxLength={250}
                    value={newBarcode.remarks}
                    onChange={(e) => setNewBarcode({ ...newBarcode, remarks: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400"
                  />
                </div>

                {/* ASSIGNMENT INFORMATION */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">ASSIGNMENT INFORMATION</h3>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Status *</label>
                  <select 
                    value={newBarcode.status} 
                    onChange={(e) => setNewBarcode({ ...newBarcode, status: e.target.value as any })} 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:border-violet-400"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Unassigned">Unassigned</option>
                  </select>
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
              <ActionButton onClick={handleSaveBarcode}>
                {isEditingModal ? 'Save Changes' : 'Generate Barcode'}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}