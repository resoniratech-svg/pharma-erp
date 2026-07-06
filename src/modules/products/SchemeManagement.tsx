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

import { schemeService } from "../../services/schemeService";
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
}

interface Scheme {
  id: string;
  schemeCode: string;
  name: string;
  type: string;
  applicableTo: 'Product' | 'Category' | 'Brand' | 'All Products';
  applicableSelection: string;
  benefitType: string;
  benefitValue: string;
  minQuantity: string;
  freeQuantity: string;
  validFrom: string;
  validTo: string;
  remarks: string;
  status: 'Active' | 'Upcoming' | 'Expired' | 'Draft' | 'Cancelled';
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

export default function SchemeManagement() {
  const [data, setData] = useState<Scheme[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [benefitTypes, setBenefitTypes] = useState<string[]>([
    "Free Quantity",
    "Percentage Discount",
    "Flat Discount",
    "Cash Back",
  ]);

  const todayStr = new Date().toISOString().split('T')[0];
  const resolveSchemeStatus = (validFromStr: string, validToStr: string, currentStatus: Scheme['status']): Scheme['status'] => {
    if (['Cancelled', 'Draft'].includes(currentStatus)) {
      return currentStatus;
    }
    
    if (todayStr < validFromStr) {
      return 'Upcoming';
    } else if (todayStr > validToStr) {
      return 'Expired';
    } else {
      return 'Active';
    }
  };

  useEffect(() => {
    const savedProducts = productService.getProducts() as Product[];
    setProducts(savedProducts);

    const savedCategories = JSON.parse(localStorage.getItem("product_categories") || "null");
    const extractedCategories = savedCategories || Array.from(new Set(savedProducts.map((p) => p.category).filter(Boolean))) as string[];
    setCategories(extractedCategories);
    if (!savedCategories) {
      localStorage.setItem("product_categories", JSON.stringify(extractedCategories));
    }

    const savedBrands = JSON.parse(localStorage.getItem("product_brands") || "null");
    const extractedBrands = savedBrands || Array.from(new Set(savedProducts.map((p) => p.brand || p.manufacturer).filter(Boolean))) as string[];
    setBrands(extractedBrands);
    if (!savedBrands) {
      localStorage.setItem("product_brands", JSON.stringify(extractedBrands));
    }

    const savedBenefitTypes = JSON.parse(localStorage.getItem("scheme_benefit_types") || "null");
    if (savedBenefitTypes) {
      setBenefitTypes(savedBenefitTypes);
    } else {
      localStorage.setItem("scheme_benefit_types", JSON.stringify([
        "Free Quantity",
        "Percentage Discount",
        "Flat Discount",
        "Cash Back",
      ]));
    }

    const savedData = schemeService.getAll() as Scheme[];
    let loadedData = savedData;
    
    let changed = false;
    
    const updatedData = loadedData.map((item: Scheme) => {
      const resolved = resolveSchemeStatus(item.validFrom, item.validTo, item.status);
      if (resolved !== item.status) {
        changed = true;
        return { ...item, status: resolved };
      }
      return item;
    });

    setData(updatedData);
    if (changed) {
      schemeService.saveAll(updatedData);
    }
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      schemeService.saveAll(data);
    }
  }, [data]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Scheme | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const currentUser = authService.getCurrentUser();

  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [brandSearch, setBrandSearch] = useState("");
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  const [benefitTypeSearch, setBenefitTypeSearch] = useState("");
  const [showBenefitTypeDropdown, setShowBenefitTypeDropdown] = useState(false);

  // Temporary RBAC bypass for client demo
  const canCreate = true;
  const canEdit = true;
  const canDelete = true;

  const [newScheme, setNewScheme] = useState({
    id: '',
    schemeCode: '',
    name: '',
    type: 'Quantity Discount',
    applicableTo: 'All Products' as Scheme['applicableTo'],
    applicableSelection: '',
    benefitType: 'Free Quantity',
    benefitValue: '',
    minQuantity: '',
    freeQuantity: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
    remarks: '',
    status: 'Draft' as Scheme['status'],
  });

  const checkSchemeInUse = (schemeItem: Scheme) => {
    const invoices = JSON.parse(localStorage.getItem("billing_gst_invoices") || "[]");
    return invoices.some((inv: any) =>
      inv.items?.some((item: any) => item.schemeCode === schemeItem.schemeCode)
    );
  };

  const checkSchemeOverlap = (newSch: typeof newScheme, list: Scheme[]) => {
    if (newSch.status !== 'Active') return false;
    return list.some(item => {
      if (item.id === newSch.id || item.status !== 'Active') return false;
      
      if (item.applicableTo === newSch.applicableTo && item.applicableSelection === newSch.applicableSelection) {
        const newFrom = newSch.validFrom;
        const newTo = newSch.validTo;
        const itemFrom = item.validFrom;
        const itemTo = item.validTo;
        return (newFrom <= itemTo && newTo >= itemFrom);
      }
      return false;
    });
  };

  const getApplicableSelectionText = (applicableTo: string, selection: string) => {
    if (applicableTo === "Product") {
      const match = products.find(p => p.code === selection);
      return match ? match.name : `${selection} (Deleted Product)`;
    }
    return selection;
  };

  const columns: Column<Scheme>[] = [
    { key: 'schemeCode', label: 'Scheme Code', render: (row) => <span className="font-mono text-violet-700 bg-violet-50 px-2 py-1 rounded">{row.schemeCode}</span> },
    { key: 'name', label: 'Scheme Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'type', label: 'Type' },
    { key: 'applicableTo', label: 'Applicable To', render: (row) => <span>{row.applicableTo || '-'}</span> },
    { key: 'applicableSelection', label: 'Selection target', render: (row) => <span>{getApplicableSelectionText(row.applicableTo, row.applicableSelection) || '-'}</span> },
    { key: 'validFrom', label: 'Valid From', render: (row) => formatDate(row.validFrom) },
    { key: 'validTo', label: 'Valid To', render: (row) => formatDate(row.validTo) },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : row.status === 'Upcoming' ? 'info' : (row.status === 'Draft' ? 'warning' : 'danger');
        return <Badge variant={variant}>{row.status}</Badge>;
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
              setSelectedScheme(row);
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
      )
    }
  ];

  const filteredData = data.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.schemeCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const handleExport = () => {
    const headers = [
      'Scheme Code', 
      'Scheme Name', 
      'Type', 
      'Applicable To', 
      'Selection', 
      'Benefit Type', 
      'Benefit Value', 
      'Min Qty', 
      'Free Qty', 
      'Valid From', 
      'Valid To',
      'Status'
    ];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          `="${row.schemeCode}"`, 
          `="${row.name}"`, 
          `="${row.type}"`, 
          `="${row.applicableTo || '-'}"`, 
          `="${getApplicableSelectionText(row.applicableTo, row.applicableSelection) || '-'}"`, 
          `="${row.benefitType}"`, 
          `="${row.benefitValue}"`, 
          `="${row.minQuantity || '-'}"`, 
          `="${row.freeQuantity || '-'}"`, 
          `="${formatDate(row.validFrom)}"`, 
          `="${formatDate(row.validTo)}"`, 
          row.status
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'scheme_management_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openNewModal = () => {
    setIsEditingModal(false);
    setProductSearch("");
    setShowProductDropdown(false);
    setCategorySearch("");
    setShowCategoryDropdown(false);
    setBrandSearch("");
    setShowBrandDropdown(false);
    setBenefitTypeSearch("");
    setShowBenefitTypeDropdown(false);
    setNewScheme({
      id: '',
      schemeCode: '',
      name: '',
      type: 'Quantity Discount',
      applicableTo: 'All Products',
      applicableSelection: '',
      benefitType: 'Free Quantity',
      benefitValue: '',
      minQuantity: '',
      freeQuantity: '',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: '',
      remarks: '',
      status: 'Draft'
    });
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!selectedScheme) return;
    if (selectedScheme.status === 'Cancelled' || selectedScheme.status === 'Expired') {
      alert("Error: Cannot edit Cancelled or Expired scheme campaigns.");
      return;
    }
    if (checkSchemeInUse(selectedScheme)) {
      alert("Error: Cannot edit schemes that have already been applied to invoices.");
      return;
    }
    setIsEditingModal(true);
    setProductSearch(
      selectedScheme.applicableTo === "Product" && selectedScheme.applicableSelection
        ? `${selectedScheme.applicableSelection} - ${getApplicableSelectionText(selectedScheme.applicableTo, selectedScheme.applicableSelection)}`
        : ""
    );
    setShowProductDropdown(false);
    setCategorySearch(
      selectedScheme.applicableTo === "Category" ? selectedScheme.applicableSelection : ""
    );
    setShowCategoryDropdown(false);
    setBrandSearch(
      selectedScheme.applicableTo === "Brand" ? selectedScheme.applicableSelection : ""
    );
    setShowBrandDropdown(false);
    setBenefitTypeSearch(selectedScheme.benefitType || "");
    setShowBenefitTypeDropdown(false);

    setNewScheme({
      id: selectedScheme.id,
      schemeCode: selectedScheme.schemeCode,
      name: selectedScheme.name,
      type: selectedScheme.type,
      applicableTo: selectedScheme.applicableTo,
      applicableSelection: selectedScheme.applicableSelection,
      benefitType: selectedScheme.benefitType,
      benefitValue: selectedScheme.benefitValue,
      minQuantity: selectedScheme.minQuantity,
      freeQuantity: selectedScheme.freeQuantity,
      validFrom: selectedScheme.validFrom,
      validTo: selectedScheme.validTo,
      remarks: selectedScheme.remarks,
      status: selectedScheme.status
    });
    setShowModal(true);
  };

  const handleSaveScheme = () => {
    const trimmedCode = newScheme.schemeCode.trim();
    if (!trimmedCode) {
      alert("Error: Scheme Code cannot be empty or only spaces.");
      return;
    }
    const trimmedName = newScheme.name.trim();
    if (!trimmedName) {
      alert("Error: Scheme Name cannot be empty or only spaces.");
      return;
    }

    if (!newScheme.type || !newScheme.benefitType || !newScheme.benefitValue || !newScheme.validFrom || !newScheme.validTo || !newScheme.status) {
      alert("Please fill all mandatory fields (*).");
      return;
    }

    if (newScheme.applicableTo !== "All Products" && !newScheme.applicableSelection) {
      alert(`Error: Please select a target ${newScheme.applicableTo} for applicability.`);
      return;
    }

    if (newScheme.validTo < newScheme.validFrom) {
      alert("Error: The validity ending date (Valid To) cannot be earlier than start date (Valid From).");
      return;
    }

    const valNum = parseFloat(newScheme.benefitValue) || 0;
    if (valNum <= 0) {
      alert("Error: Benefit Value must be a positive number.");
      return;
    }
    
    if (!/^\d+(\.\d{1,2})?$/.test(newScheme.benefitValue.trim())) {
      alert("Error: Benefit Value must be numeric with up to 2 decimal places.");
      return;
    }

    if (newScheme.benefitType === "Percentage Discount" && valNum > 100) {
      alert("Error: Percentage Discount cannot exceed 100%.");
      return;
    }

    if (newScheme.benefitType === "Free Quantity") {
      const free = parseInt(newScheme.freeQuantity) || 0;
      const min = parseInt(newScheme.minQuantity) || 0;
      if (free <= 0 || min <= 0) {
        alert("Error: Minimum Quantity and Free Quantity must be positive integers.");
        return;
      }
      if (free >= min) {
        alert("Warning: Free Quantity matches or exceeds minimum purchase quantity.");
      }
    }

    const isDuplicateCode = data.some(item => item.schemeCode.trim().toLowerCase() === trimmedCode.toLowerCase() && item.id !== newScheme.id);
    if (isDuplicateCode) {
      alert(`Error: A promotional scheme with code "${trimmedCode}" already exists.`);
      return;
    }

    const isDuplicateName = data.some(
      item => item.name.trim().toLowerCase() === trimmedName.toLowerCase() && item.id !== newScheme.id
    );
    if (isDuplicateName) {
      alert(`Error: A promotional scheme with name "${trimmedName}" already exists.`);
      return;
    }

    const resolvedStatus = resolveSchemeStatus(newScheme.validFrom, newScheme.validTo, newScheme.status);
    const checkedForm = { ...newScheme, status: resolvedStatus };

    if (checkSchemeOverlap(checkedForm, data)) {
      alert(`Error: An active scheme has already been scheduled for "${getApplicableSelectionText(newScheme.applicableTo, newScheme.applicableSelection) || 'All Products'}" within these exact dates.`);
      return;
    }

    const trimmedRemarks = (newScheme.remarks || "").trim().substring(0, 250);

    if (isEditingModal && newScheme.id) {
      const updatedRecord: Scheme = {
        id: newScheme.id,
        schemeCode: trimmedCode,
        name: trimmedName,
        type: newScheme.type,
        applicableTo: newScheme.applicableTo,
        applicableSelection: newScheme.applicableSelection,
        benefitType: newScheme.benefitType,
        benefitValue: newScheme.benefitValue.trim(),
        minQuantity: newScheme.benefitType === "Free Quantity" ? newScheme.minQuantity : "",
        freeQuantity: newScheme.benefitType === "Free Quantity" ? newScheme.freeQuantity : "",
        validFrom: newScheme.validFrom,
        validTo: newScheme.validTo,
        remarks: trimmedRemarks,
        status: resolvedStatus
      };
      
      setData(data.map(item => item.id === updatedRecord.id ? updatedRecord : item));
      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: `Scheme Campaign Updated - Code: ${trimmedCode} (${resolvedStatus})`,
        module: "Scheme Management",
      });
      if (selectedScheme && selectedScheme.id === updatedRecord.id) {
        setSelectedScheme(updatedRecord);
      }
    } else {
      const record: Scheme = {
        id: Date.now().toString(),
        schemeCode: trimmedCode,
        name: trimmedName,
        type: newScheme.type,
        applicableTo: newScheme.applicableTo,
        applicableSelection: newScheme.applicableSelection,
        benefitType: newScheme.benefitType,
        benefitValue: newScheme.benefitValue.trim(),
        minQuantity: newScheme.benefitType === "Free Quantity" ? newScheme.minQuantity : "",
        freeQuantity: newScheme.benefitType === "Free Quantity" ? newScheme.freeQuantity : "",
        validFrom: newScheme.validFrom,
        validTo: newScheme.validTo,
        remarks: trimmedRemarks,
        status: resolvedStatus
      };
      setData([record, ...data]);
      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: `Scheme Campaign Created - Code: ${trimmedCode} (${resolvedStatus})`,
        module: "Scheme Management",
      });
    }
    
    setShowModal(false);
  };

  const handleDelete = () => {
    if (itemToDelete) {
      const inUse = checkSchemeInUse(itemToDelete);
      if (inUse) {
        const updated = data.map(item =>
          item.id === itemToDelete.id ? { ...item, status: 'Cancelled' as const } : item
        );
        setData(updated);
        activityLogService.addLog({
          userId: currentUser?.id,
          userName: currentUser?.fullName,
          action: `Scheme Deleted (Blocked - Marked Cancelled instead due to Invoice usage) - Code: ${itemToDelete.schemeCode}`,
          module: "Scheme Management",
        });
        alert("Warning: This scheme is used in active billing invoices. To preserve transaction logs, it was marked as Cancelled instead of deleted.");
      } else {
        setData(data.filter(item => item.id !== itemToDelete.id));
        activityLogService.addLog({
          userId: currentUser?.id,
          userName: currentUser?.fullName,
          action: `Scheme Deleted - Code: ${itemToDelete.schemeCode}`,
          module: "Scheme Management",
        });
      }
      setItemToDelete(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Scheme Management"
        subtitle="Manage promotional schemes, discounts, and free goods offers."
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
                Create Scheme
              </ActionButton>
            )}
          </>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search schemes..."
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
            { label: "Upcoming", value: "Upcoming" },
            { label: "Expired", value: "Expired" },
            { label: "Draft", value: "Draft" },
            { label: "Cancelled", value: "Cancelled" },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedScheme(row)}
          emptyMessage="No promotional schemes found."
        />
      </TableCard>

      <Drawer
        open={!!selectedScheme}
        onClose={() => setSelectedScheme(null)}
        title="Scheme Details"
      >
        {selectedScheme && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Scheme Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Scheme Code"
                  value={
                    <span className="font-mono text-violet-700 bg-violet-50 px-2 py-1 rounded">
                      {selectedScheme.schemeCode}
                    </span>
                  }
                />
                <DrawerField label="Scheme Name" value={selectedScheme.name} />
                <DrawerField label="Scheme Type" value={selectedScheme.type} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Applicability Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Applicable To"
                  value={selectedScheme.applicableTo || "-"}
                />
                {selectedScheme.applicableTo !== "All Products" && (
                  <DrawerField
                    label="Selection Target"
                    value={getApplicableSelectionText(selectedScheme.applicableTo, selectedScheme.applicableSelection) || "-"}
                  />
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Benefit Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Benefit Type"
                  value={selectedScheme.benefitType}
                />
                <DrawerField
                  label="Benefit Value"
                  value={selectedScheme.benefitValue}
                />
              </div>
            </div>

            {selectedScheme.benefitType === "Free Quantity" && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                  Quantity Criteria
                </h3>
                <div className="space-y-2">
                  <DrawerField
                    label="Min Purchase Qty"
                    value={selectedScheme.minQuantity || "N/A"}
                  />
                  <DrawerField
                    label="Free Qty"
                    value={selectedScheme.freeQuantity || "N/A"}
                  />
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Validity Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Valid From"
                  value={formatDate(selectedScheme.validFrom)}
                />
                <DrawerField label="Valid To" value={formatDate(selectedScheme.validTo)} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Additional & Status
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Remarks"
                  value={selectedScheme.remarks || "N/A"}
                />
                <DrawerField
                  label="Status"
                  value={
                    <Badge
                      variant={
                        selectedScheme.status === "Active"
                          ? "success"
                          : selectedScheme.status === "Upcoming"
                            ? "info"
                            : selectedScheme.status === "Draft"
                              ? "warning"
                              : "danger"
                      }
                    >
                      {selectedScheme.status}
                    </Badge>
                  }
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              {canEdit && 
                selectedScheme.status !== 'Cancelled' && 
                selectedScheme.status !== 'Expired' && 
                !checkSchemeInUse(selectedScheme) && (
                  <ActionButton onClick={openEditModal}>Edit Scheme</ActionButton>
              )}
              <ActionButton
                variant="secondary"
                onClick={() => setSelectedScheme(null)}
              >
                Close
              </ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setItemToDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Delete Scheme
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this promotional scheme? This
              action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-900">
                {isEditingModal ? "Edit Scheme" : "Create Scheme"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors outline-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="md:col-span-2 mt-2 first:mt-0">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                    SCHEME INFORMATION
                  </h3>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Scheme Code *
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    value={newScheme.schemeCode}
                    onChange={(e) =>
                      setNewScheme({ ...newScheme, schemeCode: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-violet-400 bg-white"
                    placeholder="e.g. SCH-10+1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Scheme Type *
                  </label>
                  <select
                    value={newScheme.type}
                    onChange={(e) =>
                      setNewScheme({ ...newScheme, type: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400 bg-white"
                  >
                    <option value="Quantity Discount">Quantity Discount</option>
                    <option value="Cash Discount">Cash Discount</option>
                    <option value="Percentage Discount">
                      Percentage Discount
                    </option>
                    <option value="Free Goods">Free Goods</option>
                    <option value="Seasonal Offer">Seasonal Offer</option>
                    <option value="Launch Offer">Launch Offer</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Scheme Name *
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={newScheme.name}
                    onChange={(e) =>
                      setNewScheme({ ...newScheme, name: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400 bg-white"
                    placeholder="e.g. Buy 10 Get 1 Free"
                  />
                </div>

                <div className="md:col-span-2 mt-4">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                    APPLICABILITY INFORMATION
                  </h3>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Applicable To
                  </label>
                  <select
                    value={newScheme.applicableTo}
                    onChange={(e) => {
                      const value = e.target.value as Scheme['applicableTo'];
                      setNewScheme({
                        ...newScheme,
                        applicableTo: value,
                        applicableSelection: "",
                      });
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400 bg-white"
                  >
                    <option value="Product">Product</option>
                    <option value="Category">Category</option>
                    <option value="Brand">Brand</option>
                    <option value="All Products">All Products</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Selection Target *
                  </label>
                  {newScheme.applicableTo === "All Products" ? (
                    <input
                      type="text"
                      disabled
                      value="Not Applicable"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-100 cursor-not-allowed text-slate-400"
                    />
                  ) : newScheme.applicableTo === "Product" ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setShowProductDropdown(true);
                          if (newScheme.applicableSelection) {
                            setNewScheme({ ...newScheme, applicableSelection: "" });
                          }
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        placeholder="Search Product..."
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 text-slate-900 focus:outline-none focus:border-violet-400 bg-white"
                      />
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer"
                        onClick={() => setShowProductDropdown(!showProductDropdown)}
                      />
                      {showProductDropdown && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowProductDropdown(false)} />
                          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                            {products
                              .filter((p) => p.status === "Active" || !p.status)
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
                                    setNewScheme({ ...newScheme, applicableSelection: product.code });
                                    setProductSearch(`${product.code} - ${product.name}`);
                                    setShowProductDropdown(false);
                                  }}
                                >
                                  <span className="font-medium text-slate-900">{product.code}</span> - {product.name}
                                </div>
                              ))}
                            {products
                              .filter((p) => p.status === "Active" || !p.status)
                              .filter(
                                (p) =>
                                  p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                                  p.code.toLowerCase().includes(productSearch.toLowerCase())
                              ).length === 0 && (
                                <div className="px-3 py-2 text-sm text-slate-500 italic">No matching products found</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ) : newScheme.applicableTo === "Category" ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={categorySearch}
                        onChange={(e) => {
                          setCategorySearch(e.target.value);
                          setShowCategoryDropdown(true);
                          if (newScheme.applicableSelection) {
                            setNewScheme({ ...newScheme, applicableSelection: "" });
                          }
                        }}
                        onFocus={() => setShowCategoryDropdown(true)}
                        placeholder="Search Category..."
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 text-slate-900 focus:outline-none focus:border-violet-400 bg-white"
                      />
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer"
                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      />
                      {showCategoryDropdown && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowCategoryDropdown(false)} />
                          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                            {categories
                              .filter((c) => c.toLowerCase().includes(categorySearch.toLowerCase()))
                              .map((cat) => (
                                <div
                                  key={cat}
                                  className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700"
                                  onClick={() => {
                                    setNewScheme({ ...newScheme, applicableSelection: cat });
                                    setCategorySearch(cat);
                                    setShowCategoryDropdown(false);
                                  }}
                                >
                                  {cat}
                                </div>
                              ))}
                            {categorySearch.trim() !== "" &&
                              !categories.some((c) => c.toLowerCase() === categorySearch.trim().toLowerCase()) && (
                                <div
                                  className="px-3 py-2 text-sm text-violet-600 font-medium hover:bg-violet-50 cursor-pointer rounded flex items-center gap-2"
                                  onClick={() => {
                                    const newCat = categorySearch.trim();
                                    const updatedCategories = [...categories, newCat];
                                    setCategories(updatedCategories);
                                    localStorage.setItem("product_categories", JSON.stringify(updatedCategories));
                                    setNewScheme({ ...newScheme, applicableSelection: newCat });
                                    setCategorySearch(newCat);
                                    setShowCategoryDropdown(false);
                                  }}
                                >
                                  <Plus className="w-4 h-4" /> Add "{categorySearch.trim()}"
                                </div>
                              )}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={brandSearch}
                        onChange={(e) => {
                          setBrandSearch(e.target.value);
                          setShowBrandDropdown(true);
                          if (newScheme.applicableSelection) {
                            setNewScheme({ ...newScheme, applicableSelection: "" });
                          }
                        }}
                        onFocus={() => setShowBrandDropdown(true)}
                        placeholder="Search Brand..."
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 text-slate-900 focus:outline-none focus:border-violet-400 bg-white"
                      />
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer"
                        onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                      />
                      {showBrandDropdown && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowBrandDropdown(false)} />
                          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                            {brands
                              .filter((b) => b.toLowerCase().includes(brandSearch.toLowerCase()))
                              .map((brand) => (
                                <div
                                  key={brand}
                                  className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700"
                                  onClick={() => {
                                    setNewScheme({ ...newScheme, applicableSelection: brand });
                                    setBrandSearch(brand);
                                    setShowBrandDropdown(false);
                                  }}
                                >
                                  {brand}
                                </div>
                              ))}
                            {brandSearch.trim() !== "" &&
                              !brands.some((b) => b.toLowerCase() === brandSearch.trim().toLowerCase()) && (
                                <div
                                  className="px-3 py-2 text-sm text-violet-600 font-medium hover:bg-violet-50 cursor-pointer rounded flex items-center gap-2"
                                  onClick={() => {
                                    const newBrand = brandSearch.trim();
                                    const updatedBrands = [...brands, newBrand];
                                    setBrands(updatedBrands);
                                    localStorage.setItem("product_brands", JSON.stringify(updatedBrands));
                                    setNewScheme({ ...newScheme, applicableSelection: newBrand });
                                    setBrandSearch(newBrand);
                                    setShowBrandDropdown(false);
                                  }}
                                >
                                  <Plus className="w-4 h-4" /> Add "{brandSearch.trim()}"
                                </div>
                              )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 mt-4">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                    BENEFIT INFORMATION
                  </h3>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Benefit Type *
                  </label>
                  <div className="relative">
                  <input
                    type="text"
                    value={benefitTypeSearch}
                    onChange={(e) => {
                      setBenefitTypeSearch(e.target.value);
                      setShowBenefitTypeDropdown(true);
                      if (newScheme.benefitType) {
                        setNewScheme({ ...newScheme, benefitType: "" });
                      }
                    }}
                    onFocus={() => setShowBenefitTypeDropdown(true)}
                    placeholder="Search Benefit Type..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 text-slate-900 focus:outline-none focus:border-violet-400 bg-white"
                  />
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer"
                    onClick={() => setShowBenefitTypeDropdown(!showBenefitTypeDropdown)}
                  />
                  {showBenefitTypeDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowBenefitTypeDropdown(false)} />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                        {benefitTypes
                          .filter((bt) => bt.toLowerCase().includes(benefitTypeSearch.toLowerCase()))
                          .map((type) => (
                            <div
                              key={type}
                              className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700"
                              onClick={() => {
                                setNewScheme({ ...newScheme, benefitType: type });
                                setBenefitTypeSearch(type);
                                setShowBenefitTypeDropdown(false);
                              }}
                            >
                              {type}
                            </div>
                          ))}
                        {benefitTypeSearch.trim() !== "" &&
                          !benefitTypes.some((bt) => bt.toLowerCase() === benefitTypeSearch.trim().toLowerCase()) && (
                            <div
                              className="px-3 py-2 text-sm text-violet-600 font-medium hover:bg-violet-50 cursor-pointer rounded flex items-center gap-2"
                              onClick={() => {
                                const newBenefitType = benefitTypeSearch.trim();
                                const updatedTypes = [...benefitTypes, newBenefitType];
                                setBenefitTypes(updatedTypes);
                                localStorage.setItem("scheme_benefit_types", JSON.stringify(updatedTypes));
                                setNewScheme({ ...newScheme, benefitType: newBenefitType });
                                setBenefitTypeSearch(newBenefitType);
                                setShowBenefitTypeDropdown(false);
                              }}
                            >
                              <Plus className="w-4 h-4" /> Add "{benefitTypeSearch.trim()}"
                            </div>
                          )}
                      </div>
                    </>
                  )}
                </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Benefit Value *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newScheme.benefitValue}
                    onChange={(e) =>
                      setNewScheme({ ...newScheme, benefitValue: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400 bg-white"
                    placeholder="e.g. 5"
                  />
                </div>

                {newScheme.benefitType === "Free Quantity" && (
                  <>
                    <div className="md:col-span-2 mt-4">
                      <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                        QUANTITY CRITERIA
                      </h3>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-700">
                        Minimum Purchase Quantity *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={newScheme.minQuantity}
                        onChange={(e) =>
                          setNewScheme({ ...newScheme, minQuantity: e.target.value.replace(/[^0-9]/g, "") })
                        }
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400 bg-white"
                        placeholder="e.g. 10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-700">
                        Free Quantity *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={newScheme.freeQuantity}
                        onChange={(e) =>
                          setNewScheme({ ...newScheme, freeQuantity: e.target.value.replace(/[^0-9]/g, "") })
                        }
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400 bg-white"
                        placeholder="e.g. 1"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2 mt-4">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                    VALIDITY INFORMATION
                  </h3>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Valid From *
                  </label>
                  <input
                    type="date"
                    value={newScheme.validFrom}
                    onChange={(e) =>
                      setNewScheme({ ...newScheme, validFrom: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Valid To *
                  </label>
                  <input
                    type="date"
                    value={newScheme.validTo}
                    onChange={(e) =>
                      setNewScheme({ ...newScheme, validTo: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400 bg-white"
                  />
                </div>

                <div className="md:col-span-2 mt-4">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                    ADDITIONAL & STATUS INFORMATION
                  </h3>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Remarks
                  </label>
                  <textarea
                    rows={2}
                    maxLength={250}
                    value={newScheme.remarks}
                    onChange={(e) =>
                      setNewScheme({ ...newScheme, remarks: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400 bg-white"
                    placeholder="Enter remarks..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Status *
                  </label>
                  <select
                    value={newScheme.status}
                    onChange={(e) =>
                      setNewScheme({
                        ...newScheme,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400 bg-white"
                  >
                    <option value="Draft">Draft (Manual)</option>
                    <option value="Cancelled">Cancelled (Manual)</option>
                    {['Active', 'Upcoming', 'Expired'].includes(newScheme.status) && (
                      <option value={newScheme.status} disabled>{newScheme.status} (System Auto)</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                <ActionButton
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </ActionButton>
                <ActionButton onClick={handleSaveScheme}>
                  {isEditingModal ? "Save Changes" : "Create Scheme"}
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}