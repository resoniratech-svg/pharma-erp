import { useEffect, useState, useRef } from 'react';
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
import { productService } from "../../services/productService";
import { packingTypeService } from "../../services/packingTypeService";
import { compositionService } from "../../services/compositionService";
import { schemeService } from "../../services/schemeService";
import activityLogService from "../../services/activityLogService";
import { hsnService, type HSNCode } from '../../services/hsnService';
import { GetCurrentGSTByHSN } from './GSTManagement';

interface Product {
  id: string;
  code: string;
  name: string;
  genericName: string;
  brandName: string;
  category: string;
  type: string;
  manufacturer: string;
  composition?: string;
  scheme?: string;
  packingType: string;
  unitsPerPack: string;
  packsInBox?: string;
  totalUnits?: string;
  mrp: string;
  ptr: string;
  pts: string;
  ptd?: string;
  purchasePrice?: string;
  sellingPrice?: string;
  gst: string;
  hsnCode: string;
  minimumStock?: string;
  reorderLevel?: string;
  batchTracking?: boolean;
  expiryTracking?: boolean;
  status: "Active" | "Inactive" | "Discontinued";
}

const initialProducts: Product[] = [
  {
    id: "1",
    code: "PRD-000001",
    name: "Amoxicillin 500mg",
    genericName: "Amoxicillin",
    brandName: "AmoxiCare",
    category: "Antibiotics",
    type: "Capsule",
    manufacturer: "PharmaCorp",
    composition: "Amoxicillin 500mg",
    scheme: "Buy 1 get 10",
    packingType: "Blister Pack",
    unitsPerPack: "10",
    packsInBox: "20",
    totalUnits: "200",
    mrp: "120",
    ptr: "105",
    pts: "95",
    ptd: "90",
    purchasePrice: "90",
    sellingPrice: "120",
    gst: "12",
    hsnCode: "30041000",
    minimumStock: "100",
    reorderLevel: "50",
    batchTracking: true,
    expiryTracking: true,
    status: "Active",
  },
  {
    id: "2",
    code: "PRD-000002",
    name: "Paracetamol 650mg",
    genericName: "Paracetamol",
    brandName: "ParaFast",
    category: "Analgesics",
    type: "Tablet",
    manufacturer: "HealthPlus",
    composition: "Paracetamol 650mg",
    packingType: "Strip",
    unitsPerPack: "15",
    packsInBox: "10",
    totalUnits: "150",
    mrp: "45",
    ptr: "38",
    pts: "35",
    ptd: "30",
    purchasePrice: "30",
    sellingPrice: "45",
    gst: "12",
    hsnCode: "30049011",
    minimumStock: "200",
    reorderLevel: "75",
    batchTracking: true,
    expiryTracking: true,
    status: "Active",
  }
];

export default function ProductMaster() {
  const currentUser = JSON.parse(
    localStorage.getItem("authUser") || "{}"
  );

  const activeRole = localStorage.getItem('activeRole') || '';

  const canCreate = true;
  const canEdit = true;
  const canDelete = true;

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [showManufacturerDropdown, setShowManufacturerDropdown] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  
  const [packingTypes, setPackingTypes] = useState<any[]>([]);
  const [showPackingTypeDropdown, setShowPackingTypeDropdown] = useState(false);
  const [packingTypeSearch, setPackingTypeSearch] = useState("");

  const [compositions, setCompositions] = useState<any[]>([]);
  const [showCompositionDropdown, setShowCompositionDropdown] = useState(false);
  const [compositionSearch, setCompositionSearch] = useState("");

  const [schemes, setSchemes] = useState<any[]>([]);
  const [showSchemeDropdown, setShowSchemeDropdown] = useState(false);
  const [schemeSearch, setSchemeSearch] = useState("");

  const [activeHSNs, setActiveHSNs] = useState<HSNCode[]>([]);
  const [showHsnDropdown, setShowHsnDropdown] = useState(false);
  const [hsnSearch, setHsnSearch] = useState("");
  
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [newProduct, setNewProduct] = useState({
    code: "",
    name: "",
    genericName: "",
    brandName: "",
    category: "",
    type: "",
    manufacturer: "",
    composition: "",
    scheme: "",
    packingType: "",
    unitsPerPack: "",
    packsInBox: "",
    totalUnits: "",
    hsnCode: "",
    minimumStock: "",
    reorderLevel: "",
    batchTracking: true,
    expiryTracking: true,
    status: "Active" as Product["status"],
    mrp: "",
    ptr: "",
    pts: "",
    ptd: "",
    purchasePrice: "",
    sellingPrice: "",
    gst: "",
  });

  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleAlphanumericChange = (fieldName: string, rawValue: string) => {
    const sanitizedValue = rawValue.replace(/[^a-zA-Z0-9 ]/g, "");
    const cappedValue = sanitizedValue.slice(0, 50);
    setNewProduct((prev) => ({
      ...prev,
      [fieldName]: cappedValue,
    }));
  };

  const handleNumericChange = (fieldName: string, rawValue: string, maxLength: number) => {
    const sanitizedValue = rawValue.replace(/[^0-9]/g, "");
    const cappedValue = sanitizedValue.slice(0, maxLength);
    setNewProduct((prev) => ({
      ...prev,
      [fieldName]: cappedValue,
    }));
  };

  const handlePriceChange = (fieldName: string, rawValue: string) => {
    let sanitizedValue = rawValue.replace(/[^0-9.]/g, "");
    const parts = sanitizedValue.split('.');
    if (parts.length > 2) {
      sanitizedValue = parts[0] + '.' + parts.slice(1).join('');
    }
    const newParts = sanitizedValue.split('.');
    if (newParts.length === 2 && newParts[1].length > 2) {
      sanitizedValue = newParts[0] + '.' + newParts[1].substring(0, 2);
    }
    setNewProduct((prev) => ({
      ...prev,
      [fieldName]: sanitizedValue,
    }));
  };

  const handleHsnSelection = (code: string) => {
    setNewProduct(prev => ({ ...prev, hsnCode: code }));
    setHsnSearch(code);
    const gstMapping = GetCurrentGSTByHSN(code);
    if (gstMapping && gstMapping.gstPercent) {
      setNewProduct(prev => ({ ...prev, gst: String(gstMapping.gstPercent).replace('%', '') }));
    } else {
      setNewProduct(prev => ({ ...prev, gst: '' }));
    }
  };

  useEffect(() => {
    if (newProduct.unitsPerPack && newProduct.packsInBox) {
      const calcTotal = (Number(newProduct.unitsPerPack) * Number(newProduct.packsInBox)).toString();
      if (newProduct.totalUnits !== calcTotal) {
        setNewProduct(prev => ({ ...prev, totalUnits: calcTotal }));
      }
    } else {
      if (newProduct.totalUnits !== "") {
        setNewProduct(prev => ({ ...prev, totalUnits: "" }));
      }
    }
  }, [newProduct.unitsPerPack, newProduct.packsInBox]);

  useEffect(() => {
    const savedProducts = productService.getProducts();

    if (savedProducts.length > 0) {
      setProducts(savedProducts);
      if (!localStorage.getItem("pharma_erp_products")) {
        localStorage.setItem("pharma_erp_products", JSON.stringify(savedProducts));
      }
    } else {
      setProducts(initialProducts);
      productService.saveProducts(initialProducts);
      localStorage.setItem("pharma_erp_products", JSON.stringify(initialProducts));
    }

    const defaultCategories = [
      "Antibiotics",
      "Analgesics",
      "Antipyretics",
      "Anti-inflammatory",
      "Antifungals",
      "Antivirals",
      "Cardiac",
      "Diabetic",
      "Respiratory",
      "Gastroenterology",
      "Neurology",
      "Dermatology",
      "Orthopedics",
      "Pediatrics",
      "Vitamins & Supplements",
      "Medical Devices",
      "Surgical Items",
    ];
    const savedCategories = JSON.parse(localStorage.getItem("product_categories") || "null");
    setCategories(savedCategories || defaultCategories);

    const defaultTypes = ["Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Cream", "Drops", "Inhaler", "Suppository", "Powder"];
    const savedTypes = JSON.parse(localStorage.getItem("product_types") || "null");
    setProductTypes(savedTypes || defaultTypes);

    const defaultManufacturers = ["PharmaCorp", "HealthPlus", "MediCare", "VitaLife"];
    const savedManufacturers = JSON.parse(localStorage.getItem("product_manufacturers") || "null");
    setManufacturers(savedManufacturers || defaultManufacturers);

    const savedPackingTypes = packingTypeService.getAll();
    setPackingTypes(savedPackingTypes.filter((item: any) => item.status === "Active"));

    const savedCompositions = compositionService.getAll();
    setCompositions(savedCompositions.filter((item: any) => item.status === "Active"));

    const savedSchemes = schemeService.getAll();
    setSchemes(savedSchemes.filter((item: any) => item.status === "Active"));

    setActiveHSNs(hsnService.getActive());
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      productService.saveProducts(products);
      localStorage.setItem("pharma_erp_products", JSON.stringify(products));
    }
  }, [products]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showNewProductModal) {
        setShowNewProductModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showNewProductModal]);

  const checkProductInUse = (id: string) => {
    const invoices = JSON.parse(localStorage.getItem("billing_gst_invoices") || "[]");
    const isUsedInInvoices = invoices.some((inv: any) => inv.items.some((item: any) => item.productId === id));
    const inventory = JSON.parse(localStorage.getItem("billing_inventory") || "{}");
    const productInventory = inventory[id] || [];
    const hasStock = productInventory.some((b: any) => b.stock > 0);
    return isUsedInInvoices || hasStock;
  };

  const autoGenerateProductCode = () => {
    const maxCodeNumber = products.reduce((max, p) => {
      const match = p.code.match(/PRD-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    return `PRD-${String(maxCodeNumber + 1).padStart(6, "0")}`;
  };

  const handleExport = () => {
    const headers = ["Code", "Product Name", "Category", "Manufacturer", "MRP", "PTR", "PTS", "GST %", "Status"];
    const rows = filteredData.map((item) => [item.code, item.name, item.category, item.manufacturer, item.mrp, item.ptr, item.pts, item.gst, item.status]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "products_master_export.csv";
    link.click();
  };

  const handleSaveProduct = () => {
    if (!newProduct.code || !newProduct.name || !newProduct.type || !newProduct.manufacturer || !newProduct.packingType) {
      alert("Please fill all mandatory fields (*). Product Code, Name, Type, Manufacturer, and Packing Type are required.");
      return;
    }

    if (!newProduct.mrp) {
      alert("MRP is required.");
      return;
    }
    if (!newProduct.ptr) {
      alert("PTR is required.");
      return;
    }
    if (!newProduct.pts) {
      alert("PTS is required.");
      return;
    }

    const mrpVal = parseFloat(newProduct.mrp) || 0;
    const ptrVal = parseFloat(newProduct.ptr) || 0;
    const ptsVal = parseFloat(newProduct.pts) || 0;

    if (mrpVal <= 0 || ptrVal <= 0 || ptsVal <= 0) {
      alert("Prices must be greater than zero.");
      return;
    }
    if (mrpVal === ptrVal) {
      alert("MRP and PTR cannot be equal.");
      return;
    }
    if (ptrVal === ptsVal) {
      alert("PTR and PTS cannot be equal.");
      return;
    }
    if (mrpVal <= ptrVal) {
      alert("MRP must be greater than PTR.");
      return;
    }
    if (ptrVal <= ptsVal) {
      alert("PTR must be greater than PTS.");
      return;
    }

    const purchaseVal = newProduct.purchasePrice ? parseFloat(newProduct.purchasePrice) : null;
    const sellingVal = newProduct.sellingPrice ? parseFloat(newProduct.sellingPrice) : null;

    if (purchaseVal !== null && purchaseVal <= 0) {
      alert("Purchase Price must be greater than zero.");
      return;
    }
    if (sellingVal !== null && sellingVal <= 0) {
      alert("Selling Price must be greater than zero.");
      return;
    }
    if (purchaseVal !== null && sellingVal !== null) {
      if (sellingVal < purchaseVal) {
        alert("Selling Price cannot be less than Purchase Price.");
        return;
      }
    }

    if (newProduct.unitsPerPack) {
      const units = parseFloat(newProduct.unitsPerPack);
      if (isNaN(units) || !Number.isInteger(units) || units <= 0) {
        alert("Units Per Pack must be greater than zero.");
        return;
      }
    }
    if (newProduct.packsInBox) {
      const packs = parseFloat(newProduct.packsInBox);
      if (isNaN(packs) || !Number.isInteger(packs) || packs <= 0) {
        alert("Packs In Box must be greater than zero.");
        return;
      }
    }

    const minStock = newProduct.minimumStock ? parseFloat(newProduct.minimumStock) : null;
    const reorderLvl = newProduct.reorderLevel ? parseFloat(newProduct.reorderLevel) : null;
    if (minStock !== null && reorderLvl !== null) {
      if (minStock < reorderLvl) {
        alert("Minimum Stock cannot be less than Reorder Level.");
        return;
      }
    }

    const isCodeDuplicate = products.some((p) => p.code.trim().toLowerCase() === newProduct.code.trim().toLowerCase() && p.id !== editingProductId);
    if (isCodeDuplicate) {
      alert(`Error: Product Code "${newProduct.code}" is already assigned to another product.`);
      return;
    }

    const normalizedName = newProduct.name.trim().replace(/\s+/g, ' ');
    if (normalizedName === "") {
      alert("Product Name cannot contain only spaces.");
      return;
    }

    const isNameDuplicate = products.some((p) => p.name.trim().replace(/\s+/g, ' ').toLowerCase() === normalizedName.toLowerCase() && p.id !== editingProductId);
    if (isNameDuplicate) {
      alert("Product Name already exists.");
      return;
    }

    let logAction = editMode ? `Product Updated (${newProduct.code})` : `Product Created (${newProduct.code})`;
    let updatedList: Product[] = [];

    const calculatedTotalUnits = newProduct.unitsPerPack && newProduct.packsInBox ? (Number(newProduct.unitsPerPack) * Number(newProduct.packsInBox)).toString() : (newProduct.totalUnits || "0");

    if (editMode && editingProductId) {
      updatedList = products.map((product) =>
        product.id === editingProductId ? { 
          ...product, 
          ...newProduct, 
          totalUnits: calculatedTotalUnits 
        } : product
      );
      setProducts(updatedList);
    } else {
      const product: Product = {
        id: Date.now().toString(),
        code: newProduct.code,
        name: newProduct.name,
        genericName: newProduct.genericName,
        brandName: newProduct.brandName,
        category: newProduct.category,
        type: newProduct.type,
        manufacturer: newProduct.manufacturer,
        composition: newProduct.composition,
        scheme: newProduct.scheme,
        packingType: newProduct.packingType,
        unitsPerPack: newProduct.unitsPerPack,
        packsInBox: newProduct.packsInBox,
        totalUnits: calculatedTotalUnits,
        hsnCode: newProduct.hsnCode,
        minimumStock: newProduct.minimumStock,
        reorderLevel: newProduct.reorderLevel,
        batchTracking: newProduct.batchTracking,
        expiryTracking: newProduct.expiryTracking,
        status: newProduct.status,
        mrp: newProduct.mrp, 
        ptr: newProduct.ptr, 
        pts: newProduct.pts, 
        ptd: newProduct.ptd, 
        purchasePrice: newProduct.purchasePrice,
        sellingPrice: newProduct.sellingPrice,
        gst: newProduct.gst
      };
      updatedList = [product, ...products];
      setProducts(updatedList);
    }

    activityLogService.addLog({
      userId: currentUser.id,
      userName: currentUser.fullName,
      action: logAction,
      module: "Product Master",
    });

    localStorage.setItem("pharma_erp_products", JSON.stringify(updatedList));

    setShowNewProductModal(false);
    setEditMode(false);
    setEditingProductId(null);
  };

  const columns: Column<Product>[] = [
    { key: "code", label: "Code", width: "10%" },
    { key: "name", label: "Product Name", width: "25%", render: (row) => (<span className="font-semibold text-slate-900">{row.name}</span>) },
    { key: "category", label: "Category", width: "12%" },
    { key: "manufacturer", label: "Manufacturer", width: "15%" },
    { key: "mrp", label: "MRP", width: "8%", render: (row) => row.mrp ? `₹ ${row.mrp}` : "-" },
    { key: "ptr", label: "PTR", width: "8%", render: (row) => row.ptr ? `₹ ${row.ptr}` : "-" },
    { key: "pts", label: "PTS", width: "8%", render: (row) => row.pts ? `₹ ${row.pts}` : "-" },
    // { key: "ptd", label: "PTD", width: "8%", render: (row) => row.ptd ? `₹ ${row.ptd}` : "-" },
    { key: "gst", label: "GST %", width: "8%", render: (row) => row.gst ? `${row.gst}%` : "-" },
    { key: "scheme", label: "Scheme", width: "10%", render: (row) => row.scheme || "-" },
    { key: "status", label: "Status", width: "10%", render: (row) => { const variant = row.status === "Active" ? "success" : row.status === "Inactive" ? "warning" : "danger"; return <Badge variant={variant}>{row.status}</Badge>; } },
    { key: "actions", label: "Actions", width: "120px", render: (row) => (
        <div className="flex gap-3">
          <button onClick={(e) => { e.stopPropagation(); setSelectedProduct(row); }} className="text-violet-600 font-medium hover:text-violet-800">View</button>
          {canDelete && (<button onClick={(e) => { e.stopPropagation(); setProductToDelete(row); }} className="text-rose-600 font-medium hover:text-rose-800"><Trash2 className="w-4 h-4" /></button>)}
        </div>
      )
    },
  ];

  const filteredData = products.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.code.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter ? item.category === categoryFilter : true;
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader title="Product Master Management" subtitle="Manage primary product catalog and essential details." actions={<>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExport}>Export</ActionButton>
            {canCreate && (<ActionButton icon={<Plus className="w-4 h-4" />} onClick={() => { setEditMode(false); setEditingProductId(null); setNewProduct({ code: autoGenerateProductCode(), name: "", genericName: "", brandName: "", category: "", type: "", manufacturer: "", composition: "", scheme: "", packingType: "", unitsPerPack: "", packsInBox: "", totalUnits: "", hsnCode: "", minimumStock: "", reorderLevel: "", batchTracking: true, expiryTracking: true, status: "Active", mrp: "", ptr: "", pts: "", ptd: "", purchasePrice: "", sellingPrice: "", gst: "" }); setHsnSearch(""); setPackingTypeSearch(""); setCompositionSearch(""); setSchemeSearch(""); setShowNewProductModal(true); }}>New Product</ActionButton>)}
          </>} />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or code..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-slate-400" /><span className="text-sm font-medium text-slate-600">Filters:</span></div>
        <SelectFilter value={categoryFilter} onChange={setCategoryFilter} options={categories.map((c) => ({ label: c, value: c }))} placeholder="All Categories" />
        <SelectFilter value={statusFilter} onChange={setStatusFilter} options={[{ label: "Active", value: "Active" }, { label: "Inactive", value: "Inactive" }, { label: "Discontinued", value: "Discontinued" }]} placeholder="All Status" />
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} onRowClick={(row) => setSelectedProduct(row)} emptyMessage="No products found matching your criteria." />
      </TableCard>

      <Drawer open={!!selectedProduct} onClose={() => setSelectedProduct(null)} title="Product Details">
        {selectedProduct && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Basic Information</h3>
              <DrawerField label="Product Code" value={selectedProduct.code} />
              <DrawerField label="Product Name" value={selectedProduct.name} />
              <DrawerField label="Brand Name" value={selectedProduct.brandName || "N/A"} />
              <DrawerField label="Category" value={selectedProduct.category} />
              <DrawerField label="Product Type" value={selectedProduct.type} />
              <DrawerField label="Composition" value={selectedProduct.composition || "N/A"} />
              <DrawerField label="Scheme" value={selectedProduct.scheme || "N/A"} />
              <DrawerField label="Manufacturer" value={selectedProduct.manufacturer} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Packaging Details</h3>
              <DrawerField label="Packing Type" value={selectedProduct.packingType} />
              <DrawerField label="Packs In Box" value={selectedProduct.packsInBox || "N/A"} />
              <DrawerField label="Units Per Pack" value={selectedProduct.unitsPerPack} />
              <DrawerField label="Total Units" value={selectedProduct.totalUnits || "N/A"} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Pricing & Tax</h3>
              <DrawerField label="MRP" value={selectedProduct.mrp ? `₹ ${selectedProduct.mrp}` : "N/A"} />
              <DrawerField label="PTR" value={selectedProduct.ptr ? `₹ ${selectedProduct.ptr}` : "N/A"} />
              <DrawerField label="PTS" value={selectedProduct.pts ? `₹ ${selectedProduct.pts}` : "N/A"} />
              <DrawerField label="Purchase Price" value={selectedProduct.purchasePrice ? `₹ ${selectedProduct.purchasePrice}` : "N/A"} />
              <DrawerField label="Selling Price" value={selectedProduct.sellingPrice ? `₹ ${selectedProduct.sellingPrice}` : "N/A"} />
              <DrawerField label="HSN Code" value={selectedProduct.hsnCode} />
              <DrawerField label="GST" value={selectedProduct.gst ? `${selectedProduct.gst}%` : "N/A"} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Inventory Controls</h3>
              <DrawerField label="Minimum Stock" value={selectedProduct.minimumStock || "N/A"} />
              <DrawerField label="Reorder Level" value={selectedProduct.reorderLevel || "N/A"} />
              <DrawerField label="Batch Tracking" value={selectedProduct.batchTracking ? "Yes" : "No"} />
              <DrawerField label="Expiry Tracking" value={selectedProduct.expiryTracking ? "Yes" : "No"} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Additional Information</h3>
              <DrawerField label="Status" value={selectedProduct.status} />
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
              {canEdit && (<ActionButton className="min-w-[140px]" onClick={() => { setNewProduct({ code: selectedProduct.code, name: selectedProduct.name, genericName: selectedProduct.genericName, brandName: selectedProduct.brandName, category: selectedProduct.category, type: selectedProduct.type, manufacturer: selectedProduct.manufacturer, composition: selectedProduct.composition || "", scheme: selectedProduct.scheme || "", packingType: selectedProduct.packingType, unitsPerPack: selectedProduct.unitsPerPack, packsInBox: selectedProduct.packsInBox || "", totalUnits: selectedProduct.totalUnits || "", hsnCode: selectedProduct.hsnCode, minimumStock: selectedProduct.minimumStock || "", reorderLevel: selectedProduct.reorderLevel || "", batchTracking: selectedProduct.batchTracking ?? true, expiryTracking: selectedProduct.expiryTracking ?? true, status: selectedProduct.status, mrp: selectedProduct.mrp || "", ptr: selectedProduct.ptr || "", pts: selectedProduct.pts || "", ptd: selectedProduct.ptd || "", purchasePrice: selectedProduct.purchasePrice || "", sellingPrice: selectedProduct.sellingPrice || "", gst: selectedProduct.gst || "" }); setHsnSearch(selectedProduct.hsnCode); setPackingTypeSearch(selectedProduct.packingType); setCompositionSearch(selectedProduct.composition || ""); setSchemeSearch(selectedProduct.scheme || ""); setEditMode(true); setShowNewProductModal(true); setEditingProductId(selectedProduct.id); setSelectedProduct(null); }}>Edit Product</ActionButton>)}
              <ActionButton variant="secondary" onClick={() => setSelectedProduct(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {productToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setProductToDelete(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Delete Product</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">Are you sure you want to delete this product?<br />This action cannot be undone.</p>
            <div className="flex justify-end gap-3 mt-4">
              <ActionButton variant="secondary" onClick={() => setProductToDelete(null)}>Cancel</ActionButton>
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-200" onClick={() => { if (!canDelete) return; if (checkProductInUse(productToDelete.id)) { alert("Error: Cannot delete this product."); setProductToDelete(null); return; } const updated = products.filter((p) => p.id !== productToDelete.id); setProducts(updated); localStorage.setItem("pharma_erp_products", JSON.stringify(updated)); setProductToDelete(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showNewProductModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowNewProductModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-900">{editMode ? "Edit Product" : "Create New Product"}</h2>
              <button onClick={() => setShowNewProductModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors outline-none"><Trash2 className="w-5 h-5 hidden" />✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              
              {/* BASIC INFORMATION */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Product Code *</label>
                    <input value={newProduct.code} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Product Name *</label>
                    <input value={newProduct.name} onChange={(e) => handleAlphanumericChange("name", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Brand Name</label>
                    <input value={newProduct.brandName} onChange={(e) => handleAlphanumericChange("brandName", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400" />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-slate-700">Category *</label>
                    <div className="relative">
                      <input type="text" value={newProduct.category} onChange={(e) => { handleAlphanumericChange("category", e.target.value); setShowCategoryDropdown(true); }} onFocus={() => setShowCategoryDropdown(true)} placeholder="Search Category..." className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 bg-white text-slate-900 focus:outline-none focus:border-violet-400" />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer" onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} />
                    </div>
                    {showCategoryDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowCategoryDropdown(false)} />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                          {categories.filter((c) => c.toLowerCase().includes((newProduct.category || "").toLowerCase())).map((cat) => (
                            <div key={cat} className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700" onClick={() => { setNewProduct({ ...newProduct, category: cat }); setShowCategoryDropdown(false); }}>{cat}</div>
                          ))}
                          {(newProduct.category || "").trim() !== "" && !categories.some((c) => c.trim().toLowerCase() === (newProduct.category || "").trim().toLowerCase()) && (
                            <div className="px-3 py-2 text-sm text-violet-600 font-medium hover:bg-violet-50 cursor-pointer rounded flex items-center gap-2" onClick={() => { const newCat = (newProduct.category || "").trim(); const updatedCategories = [...categories, newCat]; setCategories(updatedCategories); localStorage.setItem("product_categories", JSON.stringify(updatedCategories)); setNewProduct({ ...newProduct, category: newCat }); setShowCategoryDropdown(false); }}>
                              <Plus className="w-4 h-4" /> Add "{newProduct.category.trim()}"
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-slate-700">Product Type *</label>
                    <div className="relative">
                      <input type="text" value={newProduct.type} onChange={(e) => { handleAlphanumericChange("type", e.target.value); setShowTypeDropdown(true); }} onFocus={() => setShowTypeDropdown(true)} placeholder="Search or create Product Type..." className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 bg-white text-slate-900 focus:outline-none focus:border-violet-400" />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer" onClick={() => setShowTypeDropdown(!showTypeDropdown)} />
                    </div>
                    {showTypeDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowTypeDropdown(false)} />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                          {productTypes.filter((c) => c.toLowerCase().includes((newProduct.type || "").toLowerCase())).map((cat) => (
                            <div key={cat} className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700" onClick={() => { setNewProduct({ ...newProduct, type: cat }); setShowTypeDropdown(false); }}>{cat}</div>
                          ))}
                          {(newProduct.type || "").trim() !== "" && !productTypes.some((c) => c.trim().toLowerCase() === (newProduct.type || "").trim().toLowerCase()) && (
                            <div className="px-3 py-2 text-sm text-violet-600 font-medium hover:bg-violet-50 cursor-pointer rounded flex items-center gap-2" onClick={() => { const newType = (newProduct.type || "").trim(); const updatedTypes = [...productTypes, newType]; setProductTypes(updatedTypes); localStorage.setItem("product_types", JSON.stringify(updatedTypes)); setNewProduct({ ...newProduct, type: newType }); setShowTypeDropdown(false); }}>
                              <Plus className="w-4 h-4" /> Add "{newProduct.type.trim()}"
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-slate-700">Composition</label>
                    <div className="relative">
                      <input type="text" value={compositionSearch} onChange={(e) => { setCompositionSearch(e.target.value); setShowCompositionDropdown(true); }} onFocus={() => setShowCompositionDropdown(true)} placeholder="Search Composition..." className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 bg-white text-slate-900 focus:outline-none focus:border-violet-400" />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer" onClick={() => setShowCompositionDropdown(!showCompositionDropdown)} />
                    </div>
                    {showCompositionDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => {
                          setShowCompositionDropdown(false);
                          if (compositionSearch.trim() === "") {
                            setNewProduct({ ...newProduct, composition: "" });
                            setCompositionSearch("");
                          } else if (newProduct.composition !== compositionSearch) {
                            setCompositionSearch(newProduct.composition || "");
                          }
                        }} />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                          {compositions.filter((c: any) => c.genericName.toLowerCase().includes(compositionSearch.toLowerCase())).map((comp: any) => (
                            <div key={comp.id} className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700" onClick={() => { setNewProduct({ ...newProduct, composition: comp.genericName }); setCompositionSearch(comp.genericName); setShowCompositionDropdown(false); }}>{comp.genericName}</div>
                          ))}
                          {compositions.filter((c: any) => c.genericName.toLowerCase().includes(compositionSearch.toLowerCase())).length === 0 && (
                            <div className="px-3 py-2 text-sm text-slate-500 italic">No matching composition found</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-slate-700">Scheme</label>
                    <div className="relative">
                      <input type="text" value={schemeSearch} onChange={(e) => { 
                        setSchemeSearch(e.target.value); 
                        const allSchemes = schemeService.getAll();
                        console.log("[DEBUG] (onChange) Total schemes received from localstorage:", allSchemes.length);
                        console.log("[DEBUG] (onChange) Raw scheme objects:", allSchemes);
                        const activeSchemes = allSchemes.filter((s:any) => s.status === "Active");
                        console.log("[DEBUG] (onChange) Schemes remaining after status='Active' filter:", activeSchemes.length);
                        console.log("[DEBUG] (onChange) Dropped schemes:", allSchemes.filter((s:any) => s.status !== "Active"));
                        setSchemes(activeSchemes);
                        setShowSchemeDropdown(true); 
                      }} onFocus={() => {
                        const allSchemes = schemeService.getAll();
                        console.log("[DEBUG] (onFocus) Total schemes received from localstorage:", allSchemes.length);
                        console.log("[DEBUG] (onFocus) Raw scheme objects:", allSchemes);
                        const activeSchemes = allSchemes.filter((s:any) => s.status === "Active");
                        console.log("[DEBUG] (onFocus) Schemes remaining after status='Active' filter:", activeSchemes.length);
                        console.log("[DEBUG] (onFocus) Dropped schemes:", allSchemes.filter((s:any) => s.status !== "Active"));
                        setSchemes(activeSchemes);
                        setShowSchemeDropdown(true);
                      }} placeholder="Search Scheme..." className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 bg-white text-slate-900 focus:outline-none focus:border-violet-400" />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer" onClick={() => {
                        if (!showSchemeDropdown) {
                          const allSchemes = schemeService.getAll();
                          console.log("[DEBUG] (onClick) Total schemes received from localstorage:", allSchemes.length);
                          console.log("[DEBUG] (onClick) Raw scheme objects:", allSchemes);
                          const activeSchemes = allSchemes.filter((s:any) => s.status === "Active");
                          console.log("[DEBUG] (onClick) Schemes remaining after status='Active' filter:", activeSchemes.length);
                          console.log("[DEBUG] (onClick) Dropped schemes:", allSchemes.filter((s:any) => s.status !== "Active"));
                          setSchemes(activeSchemes);
                        }
                        setShowSchemeDropdown(!showSchemeDropdown);
                      }} />
                    </div>
                    {showSchemeDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => {
                          setShowSchemeDropdown(false);
                          if (schemeSearch.trim() === "") {
                            setNewProduct({ ...newProduct, scheme: "" });
                            setSchemeSearch("");
                          } else if (newProduct.scheme !== schemeSearch) {
                            setSchemeSearch(newProduct.scheme || "");
                          }
                        }} />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                          {schemes.filter((c: any) => (c.name || c.schemeName || "").toLowerCase().includes(schemeSearch.toLowerCase())).map((sch: any) => (
                            <div key={sch.id} className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700" onClick={() => { setNewProduct({ ...newProduct, scheme: sch.name || sch.schemeName }); setSchemeSearch(sch.name || sch.schemeName); setShowSchemeDropdown(false); }}>{sch.name || sch.schemeName}</div>
                          ))}
                          {schemes.filter((c: any) => (c.name || c.schemeName || "").toLowerCase().includes(schemeSearch.toLowerCase())).length === 0 && (
                            <div className="px-3 py-2 text-sm text-slate-500 italic">No matching scheme found</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-slate-700">Manufacturer *</label>
                    <div className="relative">
                      <input type="text" value={newProduct.manufacturer} onChange={(e) => { handleAlphanumericChange("manufacturer", e.target.value); setShowManufacturerDropdown(true); }} onFocus={() => setShowManufacturerDropdown(true)} placeholder="Search or create Manufacturer..." className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 bg-white text-slate-900 focus:outline-none focus:border-violet-400" />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer" onClick={() => setShowManufacturerDropdown(!showManufacturerDropdown)} />
                    </div>
                    {showManufacturerDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowManufacturerDropdown(false)} />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                          {manufacturers.filter((c) => c.toLowerCase().includes((newProduct.manufacturer || "").toLowerCase())).map((cat) => (
                            <div key={cat} className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700" onClick={() => { setNewProduct({ ...newProduct, manufacturer: cat }); setShowManufacturerDropdown(false); }}>{cat}</div>
                          ))}
                          {(newProduct.manufacturer || "").trim() !== "" && !manufacturers.some((c) => c.trim().toLowerCase() === (newProduct.manufacturer || "").trim().toLowerCase()) && (
                            <div className="px-3 py-2 text-sm text-violet-600 font-medium hover:bg-violet-50 cursor-pointer rounded flex items-center gap-2" onClick={() => { const newManuf = (newProduct.manufacturer || "").trim(); const updatedManufs = [...manufacturers, newManuf]; setManufacturers(updatedManufs); localStorage.setItem("product_manufacturers", JSON.stringify(updatedManufs)); setNewProduct({ ...newProduct, manufacturer: newManuf }); setShowManufacturerDropdown(false); }}>
                              <Plus className="w-4 h-4" /> Add "{newProduct.manufacturer.trim()}"
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* PACKAGING INFORMATION */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Packaging Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-slate-700">Packing Type *</label>
                    <div className="relative">
                      <input type="text" value={packingTypeSearch} onChange={(e) => { setPackingTypeSearch(e.target.value); setShowPackingTypeDropdown(true); }} onFocus={() => setShowPackingTypeDropdown(true)} placeholder="Search Packing Type..." className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 bg-white text-slate-900 focus:outline-none focus:border-violet-400" />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer" onClick={() => setShowPackingTypeDropdown(!showPackingTypeDropdown)} />
                    </div>
                    {showPackingTypeDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => {
                          setShowPackingTypeDropdown(false);
                          if (newProduct.packingType !== packingTypeSearch) {
                            setPackingTypeSearch(newProduct.packingType);
                          }
                        }} />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                          {packingTypes.filter((c: any) => c.name.toLowerCase().includes(packingTypeSearch.toLowerCase())).map((pt: any) => (
                            <div key={pt.id} className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700" onClick={() => { setNewProduct({ ...newProduct, packingType: pt.name }); setPackingTypeSearch(pt.name); setShowPackingTypeDropdown(false); }}>{pt.name}</div>
                          ))}
                          {packingTypes.filter((c: any) => c.name.toLowerCase().includes(packingTypeSearch.toLowerCase())).length === 0 && (
                            <div className="px-3 py-2 text-sm text-slate-500 italic">No matching packing type found</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Packs In Box</label>
                    <input type="text" value={newProduct.packsInBox} onChange={(e) => handleNumericChange("packsInBox", e.target.value, 6)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Units Per Pack</label>
                    <input type="text" value={newProduct.unitsPerPack} onChange={(e) => handleNumericChange("unitsPerPack", e.target.value, 6)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Total Units</label>
                    <input type="text" value={newProduct.totalUnits} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" />
                  </div>
                </div>
              </div>

              {/* PRICING & TAX */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Pricing & Tax</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {/* Row 1 */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">MRP *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                      <input type="text" value={newProduct.mrp} onChange={(e) => handlePriceChange("mrp", e.target.value)} className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">PTR *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                      <input type="text" value={newProduct.ptr} onChange={(e) => handlePriceChange("ptr", e.target.value)} className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400" />
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">PTS *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                      <input type="text" value={newProduct.pts} onChange={(e) => handlePriceChange("pts", e.target.value)} className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400" />
                    </div>
                  </div>
                  <div>
                    {/* Empty column */}
                  </div>

                  {/* Row 3 */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Purchase Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                      <input type="text" value={newProduct.purchasePrice} onChange={(e) => handlePriceChange("purchasePrice", e.target.value)} className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Selling Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                      <input type="text" value={newProduct.sellingPrice} onChange={(e) => handlePriceChange("sellingPrice", e.target.value)} className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400" />
                    </div>
                  </div>

                  {/* Row 4 */}
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-slate-700">HSN Code </label>
                    <div className="relative">
                      <input type="text" value={hsnSearch} onChange={(e) => { setHsnSearch(e.target.value); setShowHsnDropdown(true); }} onFocus={() => setShowHsnDropdown(true)} placeholder="Search HSN Code..." className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 bg-white text-slate-900 focus:outline-none focus:border-violet-400" />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer" onClick={() => setShowHsnDropdown(!showHsnDropdown)} />
                    </div>
                    {showHsnDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => {
                          setShowHsnDropdown(false);
                          if (newProduct.hsnCode !== hsnSearch) {
                             setHsnSearch(newProduct.hsnCode);
                          }
                        }} />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                          {activeHSNs.filter((h) => h.code.includes(hsnSearch) || h.description.toLowerCase().includes(hsnSearch.toLowerCase())).map((hsn) => (
                            <div key={hsn.id} className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700" onClick={() => { handleHsnSelection(hsn.code); setShowHsnDropdown(false); }}>{hsn.code} - {hsn.description}</div>
                          ))}
                          {activeHSNs.filter((h) => h.code.includes(hsnSearch) || h.description.toLowerCase().includes(hsnSearch.toLowerCase())).length === 0 && (
                            <div className="px-3 py-2 text-sm text-slate-500 italic">No active HSN codes found</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">GST %</label>
                    <div className="relative">
                      <input type="text" value={newProduct.gst} onChange={(e) => handleNumericChange("gst", e.target.value, 2)} className="w-full border border-slate-200 rounded-lg pr-8 pl-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* INVENTORY CONTROLS */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Inventory Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Minimum Stock</label>
                    <input type="text" value={newProduct.minimumStock} onChange={(e) => handleNumericChange("minimumStock", e.target.value, 6)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Reorder Level</label>
                    <input type="text" value={newProduct.reorderLevel} onChange={(e) => handleNumericChange("reorderLevel", e.target.value, 6)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-400" />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" id="batchTracking" checked={newProduct.batchTracking} onChange={(e) => setNewProduct({ ...newProduct, batchTracking: e.target.checked })} className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500" />
                    <label htmlFor="batchTracking" className="text-sm text-slate-700">Enable Batch Tracking</label>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" id="expiryTracking" checked={newProduct.expiryTracking} onChange={(e) => setNewProduct({ ...newProduct, expiryTracking: e.target.checked })} className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500" />
                    <label htmlFor="expiryTracking" className="text-sm text-slate-700">Enable Expiry Tracking</label>
                  </div>
                </div>
              </div>

              {/* ADDITIONAL INFORMATION */}
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Status</label>
                    <select value={newProduct.status} onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value as any })} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:border-violet-400">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Discontinued">Discontinued</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>
            
            {/* FOOTER ACTIONS */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
              <ActionButton variant="secondary" onClick={() => setShowNewProductModal(false)}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveProduct}>{editMode ? "Save Changes" : "Create Product"}</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}