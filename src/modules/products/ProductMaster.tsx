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
import { productService } from "../../services/productService";
import { packingTypeService } from "../../services/packingTypeService";
import { compositionService } from "../../services/compositionService";
import { gstService } from "../../services/gstService";
import activityLogService from "../../services/activityLogService";
import { hasModulePermission } from '../../utils/permissionUtils';
import { schemeService } from "../../services/schemeService";
import {
  PRODUCT_TYPES,
  MANUFACTURERS,
} from "./productMasters";

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
  barcode?: string;
  packingType: string;
  unitsPerPack: string;
  packsInBox?: string;
  totalUnits?: string;
  mrp: string;
  ptr: string;
  pts: string;
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
    barcode: "890100000001",
    packingType: "Blister Pack",
    unitsPerPack: "10",
    packsInBox: "20",
    totalUnits: "200",
    mrp: "120",
    ptr: "105",
    pts: "95",
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
    barcode: "890100000002",
    packingType: "Strip",
    unitsPerPack: "15",
    packsInBox: "10",
    totalUnits: "150",
    mrp: "45",
    ptr: "38",
    pts: "35",
    purchasePrice: "30",
    sellingPrice: "45",
    gst: "12",
    hsnCode: "30049011",
    minimumStock: "200",
    reorderLevel: "75",
    batchTracking: true,
    expiryTracking: true,
    status: "Active",
  },
  {
    id: "3",
    code: "PRD-000003",
    name: "Cough Syrup 100ml",
    genericName: "Dextromethorphan",
    brandName: "CoughEase",
    category: "Respiratory",
    type: "Syrup",
    manufacturer: "MediCare",
    composition: "Dextromethorphan Hydrobromide",
    barcode: "890100000003",
    packingType: "Bottle",
    unitsPerPack: "1",
    packsInBox: "24",
    totalUnits: "24",
    mrp: "95",
    ptr: "80",
    pts: "75",
    purchasePrice: "70",
    sellingPrice: "95",
    gst: "12",
    hsnCode: "30049099",
    minimumStock: "50",
    reorderLevel: "20",
    batchTracking: true,
    expiryTracking: true,
    status: "Inactive",
  },
  {
    id: "4",
    code: "PRD-000004",
    name: "Vitamin C 1000mg",
    genericName: "Ascorbic Acid",
    brandName: "VitaBoost",
    category: "Vitamins",
    type: "Tablet",
    manufacturer: "VitaLife",
    composition: "Vitamin C 1000mg",
    barcode: "890100000004",
    packingType: "Bottle",
    unitsPerPack: "30",
    packsInBox: "12",
    totalUnits: "360",
    mrp: "250",
    ptr: "220",
    pts: "200",
    purchasePrice: "180",
    sellingPrice: "250",
    gst: "12",
    hsnCode: "21069099",
    minimumStock: "80",
    reorderLevel: "30",
    batchTracking: true,
    expiryTracking: true,
    status: "Active",
  },
  {
    id: "5",
    code: "PRD-000005",
    name: "Ibuprofen 400mg",
    genericName: "Ibuprofen",
    brandName: "PainAway",
    category: "NSAIDs",
    type: "Tablet",
    manufacturer: "PainRelief Inc.",
    composition: "Ibuprofen 400mg",
    barcode: "890100000005",
    packingType: "Strip",
    unitsPerPack: "10",
    packsInBox: "15",
    totalUnits: "150",
    mrp: "70",
    ptr: "60",
    pts: "55",
    purchasePrice: "45",
    sellingPrice: "70",
    gst: "12",
    hsnCode: "30049069",
    minimumStock: "100",
    reorderLevel: "40",
    batchTracking: true,
    expiryTracking: true,
    status: "Discontinued",
  },
];

export default function ProductMaster() {
  const currentUser = JSON.parse(
    localStorage.getItem("authUser") || "{}"
  );

  const activeRole = localStorage.getItem('activeRole') || '';

  const canView = hasModulePermission(activeRole, "Products & Master", "View");
  const canCreate = hasModulePermission(activeRole, "Products & Master", "Create");
  const canEdit = hasModulePermission(activeRole, "Products & Master", "Edit");
  const canDelete = hasModulePermission(activeRole, "Products & Master", "Delete");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Persistent Custom Categories Load
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCompositionDropdown, setShowCompositionDropdown] = useState(false);
  const [showSchemeDropdown, setShowSchemeDropdown] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [packingTypes, setPackingTypes] = useState<any[]>([]);
  const [compositions, setCompositions] = useState<any[]>([]);
  const [gstRecords, setGstRecords] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);

  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [newProduct, setNewProduct] = useState({
    code: "",
    name: "",
    genericName: "",
    brandName: "",
    composition: "",
    scheme: "",
    barcode: "",
    category: "",
    type: "",
    manufacturer: "",
    packingType: "",
    unitsPerPack: "",
    packsInBox: "",
    totalUnits: "",
    mrp: "",
    ptr: "",
    pts: "",
    purchasePrice: "",
    sellingPrice: "",
    gst: "",
    hsnCode: "",
    minimumStock: "",
    reorderLevel: "",
    batchTracking: false,
    expiryTracking: false,
    status: "Active" as Product["status"],
  });

  // Reusable helper to clean input to Alphanumeric and hard-limit to 20 characters
  const handleAlphanumericChange = (fieldName: string, rawValue: string) => {
    const sanitizedValue = rawValue.replace(/[^a-zA-Z0-9 ]/g, "");
    const cappedValue = sanitizedValue.slice(0, 20);
    
    setNewProduct((prev) => ({
      ...prev,
      [fieldName]: cappedValue,
    }));
  };

  // Reusable helper to restrict manual barcode entries to digits only
  const handleNumericOnlyChange = (fieldName: string, rawValue: string) => {
    const cleanNumeric = rawValue.replace(/\D/g, "").slice(0, 13);
    setNewProduct((prev) => ({
      ...prev,
      [fieldName]: cleanNumeric,
    }));
  };

  // Calculate total units dynamically when inputs change
  useEffect(() => {
    if (newProduct.unitsPerPack && newProduct.packsInBox) {
      const calcTotal = (Number(newProduct.unitsPerPack) * Number(newProduct.packsInBox)).toString();
      if (newProduct.totalUnits !== calcTotal) {
        setNewProduct(prev => ({ ...prev, totalUnits: calcTotal }));
      }
    }
  }, [newProduct.unitsPerPack, newProduct.packsInBox]);

  // Initial Lookups load
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

    // Categories persistence loading
    const defaultCategories = [
      "Antibiotics", "Analgesics", "Antipyretics", "Anti-inflammatory", 
      "Antifungals", "Antivirals", "Cardiac", "Diabetic", 
      "Respiratory", "Gastroenterology", "Neurology", "Dermatology", 
      "Orthopedics", "Pediatrics", "Vitamins & Supplements", 
      "Medical Devices", "Surgical Items"
    ];
    const savedCategories = JSON.parse(localStorage.getItem("product_categories") || "null");
    setCategories(savedCategories || defaultCategories);

    const savedPackingTypes = packingTypeService.getAll();
    setPackingTypes(
      savedPackingTypes.filter((item: any) => item.status === "Active"),
    );

    const savedCompositions = compositionService.getAll();
    setCompositions(
      savedCompositions.filter((item: any) => item.status === "Active"),
    );

    const savedSchemes = schemeService.getAll();
    if (savedSchemes.length > 0) {
      setSchemes(savedSchemes);
    }
  }, []);

  // Save changes to service layers and core local storage state key automatically
  useEffect(() => {
    if (products.length > 0) {
      productService.saveProducts(products);
      localStorage.setItem("pharma_erp_products", JSON.stringify(products));
    }
  }, [products]);

  useEffect(() => {
    const gstData = gstService.getAll();
    setGstRecords(gstData);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showNewProductModal) {
        setShowNewProductModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showNewProductModal]);

const parseEffectiveDate = (dateStr: string) => {
  if (!dateStr) return new Date(0);
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date(0) : date;
};

const checkProductInUse = (id: string) => {
  const invoices = JSON.parse(localStorage.getItem("billing_gst_invoices") || "[]");
  const isUsedInInvoices = invoices.some((inv: any) =>
    inv.items.some((item: any) => item.productId === id)
  );

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

// if (!canView) {
//   return (
//     <div className="p-10 text-center">
//       <h2 className="text-xl font-semibold">Access Denied</h2>
//       <p className="text-slate-500 mt-2">
//         You do not have permission to view Product Management.
//       </p>
//     </div>
//   );
// }

  const handleExport = () => {
    const headers = [
      "Code",
      "Product Name",
      "Generic Name",
      "Brand Name",
      "Category",
      "Type",
      "Manufacturer",
      "Composition",
      "Scheme",
      "Barcode",
      "Packing Type",
      "Units Per Pack",
      "Packs In Box",
      "Total Units",
      "MRP",
      "PTR",
      "PTS",
      "Purchase Price",
      "Selling Price",
      "GST %",
      "HSN Code",
      "Minimum Stock",
      "Reorder Level",
      "Status",
    ];

    const rows = filteredData.map((item) => [
      item.code,
      item.name,
      item.genericName || "",
      item.brandName || "",
      item.category,
      item.type,
      item.manufacturer,
      item.composition || "",
      item.scheme || "No Scheme",
      item.barcode || "",
      item.packingType,
      item.unitsPerPack,
      item.packsInBox || "",
      item.totalUnits || "",
      item.mrp,
      item.ptr,
      item.pts,
      item.purchasePrice || "",
      item.sellingPrice || "",
      item.gst,
      item.hsnCode,
      item.minimumStock || "",
      item.reorderLevel || "",
      item.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "products_master_export.csv";
    link.click();
  };

  const handleSaveProduct = () => {
    if (!newProduct.code || !newProduct.name || !newProduct.type || !newProduct.manufacturer || !newProduct.hsnCode || !newProduct.packingType || !newProduct.mrp) {
      alert("Please fill all mandatory fields (*). Product Code, Name, Type, Manufacturer, Packing Type, MRP and HSN are required.");
      return;
    }

    // 1. Prevent Duplicate Product Codes
    const isCodeDuplicate = products.some(
      (p) => p.code.trim().toLowerCase() === newProduct.code.trim().toLowerCase() && p.id !== editingProductId
    );
    if (isCodeDuplicate) {
      alert(`Error: Product Code "${newProduct.code}" is already assigned to another product.`);
      return;
    }

    // 2. Prevent Duplicate Product Names
    const isNameDuplicate = products.some(
      (p) => p.name.trim().toLowerCase() === newProduct.name.trim().toLowerCase() && p.id !== editingProductId
    );
    if (isNameDuplicate) {
      alert(`Error: Product Name "${newProduct.name}" already exists.`);
      return;
    }

    // 3. Pricing Rule Validations
    const mrpVal = parseFloat(newProduct.mrp) || 0;
    const ptrVal = parseFloat(newProduct.ptr) || 0;
    const ptsVal = parseFloat(newProduct.pts) || 0;
    const purchaseVal = parseFloat(newProduct.purchasePrice) || 0;
    const sellingVal = parseFloat(newProduct.sellingPrice) || 0;

    if (mrpVal < 0 || ptrVal < 0 || ptsVal < 0 || purchaseVal < 0 || sellingVal < 0) {
      alert("Error: Prices and rates cannot be negative.");
      return;
    }
    if (mrpVal > 999999 || ptrVal > 999999 || ptsVal > 999999 || purchaseVal > 999999 || sellingVal > 999999) {
      alert("Error: Prices and rates exceed maximum sensible ERP limit (₹9,99,999).");
      return;
    }
    if (mrpVal < ptrVal) {
      alert("Error: MRP must be greater than or equal to PTR.");
      return;
    }
    if (ptrVal < ptsVal) {
      alert("Error: PTR must be greater than or equal to PTS.");
      return;
    }
    if (purchaseVal > sellingVal) {
      alert("Error: Purchase Price cannot exceed Selling Price.");
      return;
    }

    // 4. Safety Stock Validation
    const minStockVal = parseFloat(newProduct.minimumStock) || 0;
    const reorderVal = parseFloat(newProduct.reorderLevel) || 0;
    if (minStockVal < 0 || reorderVal < 0) {
      alert("Error: Stock levels cannot be negative.");
      return;
    }
    if (reorderVal > minStockVal) {
      alert("Error: Reorder Level must be less than or equal to Minimum Stock Level.");
      return;
    }

    // 5. HSN Master existence & format checks
    if (!/^\d{4,8}$/.test(newProduct.hsnCode)) {
      alert("Error: HSN Code must be numeric and between 4 to 8 digits long.");
      return;
    }
    const hsnExists = gstRecords.some((g) => g.hsnCode === newProduct.hsnCode);
    if (!hsnExists) {
      alert(`Error: HSN Code "${newProduct.hsnCode}" does not exist in the HSN Master.`);
      return;
    }

    // 6. Barcode uniqueness and fallback auto-generation check
    let barcodeToSave = newProduct.barcode;
    let isBarcodeAutoGenerated = false;

    if (!barcodeToSave) {
      let uniqueGenerated = false;
      let attempts = 0;
      while (!uniqueGenerated && attempts < 10) {
        const potential = `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        if (!products.some(p => p.barcode === potential)) {
          barcodeToSave = potential;
          uniqueGenerated = true;
          isBarcodeAutoGenerated = true;
        }
        attempts++;
      }
      if (!barcodeToSave) {
        alert("Error: Unable to auto-generate a unique EAN-13 barcode. Please try again.");
        return;
      }
    } else {
      // Validate uniqueness if entered manually
      const isBarcodeDuplicate = products.some(p => p.barcode === barcodeToSave && p.id !== editingProductId);
      if (isBarcodeDuplicate) {
        alert(`Error: Barcode "${barcodeToSave}" is already assigned to another product.`);
        return;
      }
      if (barcodeToSave.length !== 13) {
        if (!window.confirm(`Warning: Barcode "${barcodeToSave}" is not 13 digits (EAN-13 standard). Proceed?`)) {
          return;
        }
      }
    }

    // 7. Audit Log Generation (Edit Audit Trail & Generation Type Logging)
    let logAction = "";

    if (editMode && editingProductId) {
      const originalProduct = products.find(p => p.id === editingProductId);
      if (originalProduct) {
        const changes: string[] = [];
        if (originalProduct.name !== newProduct.name) changes.push(`Name: "${originalProduct.name}" → "${newProduct.name}"`);
        if (originalProduct.mrp !== newProduct.mrp) changes.push(`MRP: ₹${originalProduct.mrp} → ₹${newProduct.mrp}`);
        if (originalProduct.gst !== newProduct.gst) changes.push(`GST: ${originalProduct.gst}% → ${newProduct.gst}%`);
        if (originalProduct.ptr !== newProduct.ptr) changes.push(`PTR: ₹${originalProduct.ptr} → ₹${newProduct.ptr}`);
        if (originalProduct.pts !== newProduct.pts) changes.push(`PTS: ₹${originalProduct.pts} → ₹${newProduct.pts}`);
        if (originalProduct.manufacturer !== newProduct.manufacturer) changes.push(`Manufacturer: "${originalProduct.manufacturer}" → "${newProduct.manufacturer}"`);
        if (originalProduct.hsnCode !== newProduct.hsnCode) changes.push(`HSN: "${originalProduct.hsnCode}" → "${newProduct.hsnCode}"`);
        
        if (changes.length > 0) {
          logAction = `Product Updated (${newProduct.code}) - ${changes.join(", ")}`;
        } else {
          logAction = `Product Updated (${newProduct.code}) - No critical fields changed`;
        }
      } else {
        logAction = `Product Updated (${newProduct.code})`;
      }
    } else {
      // Creation Audit Log
      const defaultGSTObj = gstRecords
        .filter((g) => g.hsnCode === newProduct.hsnCode)
        .sort((a, b) => parseEffectiveDate(b.effectiveDate).getTime() - parseEffectiveDate(a.effectiveDate).getTime())[0];
      const defaultGST = defaultGSTObj?.totalGst?.replace("%", "") || "";
      const isGSTOverridden = defaultGST !== "" && newProduct.gst !== defaultGST;
      
      const barcodeLogged = isBarcodeAutoGenerated ? " [Barcode Auto-Generated]" : "";
      
      if (isGSTOverridden) {
        logAction = `Product Created (${newProduct.code}) - "${newProduct.name}" - GST Overridden from ${defaultGST}% to ${newProduct.gst}%${barcodeLogged}`;
      } else {
        logAction = `Product Created (${newProduct.code}) - "${newProduct.name}"${barcodeLogged}`;
      }
    }

    // Explicitly derive total units for safe data persistence
    const calculatedTotalUnits = newProduct.unitsPerPack && newProduct.packsInBox
      ? (Number(newProduct.unitsPerPack) * Number(newProduct.packsInBox)).toString()
      : (newProduct.totalUnits || "0");

    let updatedList: Product[] = [];

    if (editMode && editingProductId) {
      updatedList = products.map((product) =>
        product.id === editingProductId
          ? {
              ...product,
              ...newProduct,
              barcode: barcodeToSave,
              totalUnits: calculatedTotalUnits
            }
          : product
      );
      
      setProducts(updatedList);
      activityLogService.addLog({
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: logAction,
        module: "Product Master",
      });
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
        scheme: newProduct.scheme || "No Scheme",
        barcode: barcodeToSave,
        packingType: newProduct.packingType,
        unitsPerPack: newProduct.unitsPerPack,
        packsInBox: newProduct.packsInBox,
        totalUnits: calculatedTotalUnits,
        mrp: newProduct.mrp,
        ptr: newProduct.ptr,
        pts: newProduct.pts,
        purchasePrice: newProduct.purchasePrice,
        sellingPrice: newProduct.sellingPrice,
        gst: newProduct.gst,
        hsnCode: newProduct.hsnCode,
        minimumStock: newProduct.minimumStock,
        reorderLevel: newProduct.reorderLevel,
        batchTracking: newProduct.batchTracking,
        expiryTracking: newProduct.expiryTracking,
        status: newProduct.status,
      };

      updatedList = [product, ...products];
      setProducts(updatedList);

      activityLogService.addLog({
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: logAction,
        module: "Product Master",
      });
    }

    localStorage.setItem("pharma_erp_products", JSON.stringify(updatedList));

    setShowNewProductModal(false);
    setEditMode(false);
    setEditingProductId(null);
    setNewProduct({
      code: "",
      name: "",
      genericName: "",
      brandName: "",
      composition: "",
      scheme: "",
      barcode: "",
      category: "",
      type: "",
      manufacturer: "",
      packingType: "",
      unitsPerPack: "",
      packsInBox: "",
      totalUnits: "",
      mrp: "",
      ptr: "",
      pts: "",
      purchasePrice: "",
      sellingPrice: "",
      gst: "",
      hsnCode: "",
      minimumStock: "",
      reorderLevel: "",
      batchTracking: false,
      expiryTracking: false,
      status: "Active",
    });
  };

  const columns: Column<Product>[] = [
    { key: "code", label: "Code", width: "10%" },
    {
      key: "name",
      label: "Product Name",
      width: "25%",
      render: (row) => (
        <span className="font-semibold text-slate-900">{row.name}</span>
      ),
    },
    { key: "category", label: "Category", width: "12%" },
    { key: "type", label: "Product Type", width: "10%" },
    { key: "manufacturer", label: "Manufacturer", width: "15%" },
    {
      key: "mrp",
      label: "MRP",
      width: "8%",
      render: (row) => `₹ ${row.mrp}`,
    },
    {
      key: "gst",
      label: "GST %",
      width: "8%",
      render: (row) => `${row.gst}%`,
    },
    {
      key: "status",
      label: "Status",
      width: "10%",
      render: (row) => {
        const variant =
          row.status === "Active"
            ? "success"
            : row.status === "Inactive"
              ? "warning"
              : "danger";
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: "actions",
      label: "Actions",
      width: "120px",
      render: (row) => (
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProduct(row);
            }}
            className="text-violet-600 font-medium hover:text-violet-800"
          >
            View
          </button>
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setProductToDelete(row);
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

  const filteredData = products.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter ? item.category === categoryFilter : true;
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Product Master Management"
        subtitle="Manage primary product catalog and essential details."
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
                onClick={() => {
                  setEditMode(false);
                  setEditingProductId(null);
                  const generatedCode = autoGenerateProductCode();
                  setNewProduct({
                    code: generatedCode,
                    name: "",
                    genericName: "",
                    brandName: "",
                    composition: "",
                    scheme: "",
                    barcode: "",
                    category: "",
                    type: "",
                    manufacturer: "",
                    packingType: "",
                    unitsPerPack: "",
                    packsInBox: "",
                    totalUnits: "",
                    mrp: "",
                    ptr: "",
                    pts: "",
                    purchasePrice: "",
                    sellingPrice: "",
                    gst: "",
                    hsnCode: "",
                    minimumStock: "",
                    reorderLevel: "",
                    batchTracking: false,
                    expiryTracking: false,
                    status: "Active",
                  });
                  setShowNewProductModal(true);
                }}
              >
                New Product
              </ActionButton>
            )}
          </>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or code..."
        />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categories.map((c) => ({ label: c, value: c }))}
          placeholder="All Categories"
        />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "Active", value: "Active" },
            { label: "Inactive", value: "Inactive" },
            { label: "Discontinued", value: "Discontinued" },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedProduct(row)}
          emptyMessage="No products found matching your criteria."
        />
      </TableCard>

      <Drawer
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Product Details"
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                Basic Information
              </h3>
              <DrawerField label="Product Code" value={selectedProduct.code || "N/A"} />
              <DrawerField label="Product Name" value={selectedProduct.name || "N/A"} />
              <DrawerField label="Brand Name" value={selectedProduct.brandName || "N/A"} />
              <DrawerField label="Category" value={selectedProduct.category || "N/A"} />
              <DrawerField label="Product Type" value={selectedProduct.type || "N/A"} />
              <DrawerField label="Composition" value={selectedProduct.composition || "N/A"} />
              <DrawerField label="Manufacturer" value={selectedProduct.manufacturer || "N/A"} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                Packaging Details
              </h3>
              <DrawerField label="Packing Type" value={selectedProduct.packingType || "N/A"} />
              <DrawerField label="Units Per Pack" value={selectedProduct.unitsPerPack || "N/A"} />
              <DrawerField label="Packs In Box" value={selectedProduct.packsInBox || "N/A"} />
              <DrawerField
                label="Total Units"
                value={
                  selectedProduct.unitsPerPack && selectedProduct.packsInBox
                    ? (Number(selectedProduct.unitsPerPack) * Number(selectedProduct.packsInBox)).toString()
                    : (selectedProduct.totalUnits || "N/A")
                }
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                Pricing Details
              </h3>
              <DrawerField label="MRP" value={selectedProduct.mrp ? `₹ ${selectedProduct.mrp}` : "N/A"} />
              <DrawerField label="PTR" value={selectedProduct.ptr ? `₹ ${selectedProduct.ptr}` : "N/A"} />
              <DrawerField label="PTS" value={selectedProduct.pts ? `₹ ${selectedProduct.pts}` : "N/A"} />
              <DrawerField label="Purchase Price" value={selectedProduct.purchasePrice ? `₹ ${selectedProduct.purchasePrice}` : "N/A"} />
              <DrawerField label="Selling Price" value={selectedProduct.sellingPrice ? `₹ ${selectedProduct.sellingPrice}` : "N/A"} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                Tax Details
              </h3>
              <DrawerField label="GST %" value={selectedProduct.gst ? `${selectedProduct.gst}%` : "N/A"} />
              <DrawerField label="HSN Code" value={selectedProduct.hsnCode || "N/A"} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                Inventory Controls
              </h3>
              <DrawerField label="Minimum Stock" value={selectedProduct.minimumStock || "N/A"} />
              <DrawerField label="Reorder Level" value={selectedProduct.reorderLevel || "N/A"} />
              <DrawerField label="Batch Tracking" value={selectedProduct.batchTracking ? "Enabled" : "Disabled"} />
              <DrawerField label="Expiry Tracking" value={selectedProduct.expiryTracking ? "Enabled" : "Disabled"} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                Additional Information
              </h3>
              <DrawerField label="Barcode" value={selectedProduct.barcode || "N/A"} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                Product Status
              </h3>
              <DrawerField
                label="Status"
                value={
                  <Badge
                    variant={
                      selectedProduct.status === "Active"
                        ? "success"
                        : selectedProduct.status === "Inactive"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {selectedProduct.status}
                  </Badge>
                }
              />
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
              {canEdit && (
                <ActionButton
                  className="min-w-[140px]"
                  onClick={() => {
                    if (!selectedProduct) return;

                    setNewProduct({
                      code: selectedProduct.code,
                      name: selectedProduct.name,
                      genericName: selectedProduct.genericName,
                      brandName: selectedProduct.brandName,
                      composition: selectedProduct.composition || "",
                      scheme: selectedProduct.scheme || "",
                      barcode: selectedProduct.barcode || "",
                      category: selectedProduct.category,
                      type: selectedProduct.type,
                      manufacturer: selectedProduct.manufacturer,
                      packingType: selectedProduct.packingType,
                      unitsPerPack: selectedProduct.unitsPerPack,
                      packsInBox: selectedProduct.packsInBox || "",
                      totalUnits: selectedProduct.totalUnits || "",
                      mrp: selectedProduct.mrp,
                      ptr: selectedProduct.ptr,
                      pts: selectedProduct.pts,
                      purchasePrice: selectedProduct.purchasePrice || "",
                      sellingPrice: selectedProduct.sellingPrice || "",
                      gst: selectedProduct.gst,
                      hsnCode: selectedProduct.hsnCode,
                      minimumStock: selectedProduct.minimumStock || "",
                      reorderLevel: selectedProduct.reorderLevel || "",
                      batchTracking: selectedProduct.batchTracking || false,
                      expiryTracking: selectedProduct.expiryTracking || false,
                      status: selectedProduct.status,
                    });

                    setEditMode(true);
                    setShowNewProductModal(true);
                    setEditingProductId(selectedProduct.id);
                    setSelectedProduct(null);
                  }}
                >
                  Edit Product
                </ActionButton>
              )}

              <ActionButton variant="secondary" onClick={() => setSelectedProduct(null)}>
                Close
              </ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Delete Product</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to delete this product?<br />This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <ActionButton variant="secondary" onClick={() => setProductToDelete(null)}>
                Cancel
              </ActionButton>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-200"
                onClick={() => {
                  if (!canDelete) return;
                  
                  // Delete safety check validation
                  if (checkProductInUse(productToDelete.id)) {
                    alert("Error: Cannot delete this product. It is already used in transactions (Invoices or existing Inventory Stock). Consider changing its status to Inactive or Discontinued instead.");
                    setProductToDelete(null);
                    return;
                  }

                  const updated = products.filter((p) => p.id !== productToDelete.id);
                  setProducts(updated);
                  localStorage.setItem("pharma_erp_products", JSON.stringify(updated));
                  
                  activityLogService.addLog({
                    userId: currentUser.id,
                    userName: currentUser.fullName,
                    action: `Product Deleted - Code: ${productToDelete.code}, Name: ${productToDelete.name}`,
                    module: "Product Master",
                  });

                  setProductToDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewProductModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowNewProductModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-900">
                {editMode ? "Edit Product" : "Create New Product"}
              </h2>
              <button onClick={() => setShowNewProductModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors outline-none">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  Basic Information
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Product Code *</label>
                <input
                  value={newProduct.code}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 mt-1">Product Code is system-generated and cannot be edited.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input
                  value={newProduct.name}
                  onChange={(e) => handleAlphanumericChange("name", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Brand Name</label>
                <input
                  value={newProduct.brandName}
                  onChange={(e) => handleAlphanumericChange("brandName", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium mb-1">Category</label>
                <div className="relative">
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => {
                      handleAlphanumericChange("category", e.target.value);
                      setShowCategoryDropdown(true);
                    }}
                    onFocus={() => setShowCategoryDropdown(true)}
                    placeholder="Select or type Category"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 bg-white text-slate-900 focus:outline-none focus:border-violet-400"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs cursor-pointer"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  >
                    ▼
                  </span>
                </div>

                {showCategoryDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowCategoryDropdown(false)} />
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                      {categories
                        .filter((c) => c.toLowerCase().includes((newProduct.category || "").toLowerCase()))
                        .map((cat) => (
                          <div
                            key={cat}
                            className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded"
                            onClick={() => {
                                setNewProduct({ ...newProduct, category: cat });
                                setShowCategoryDropdown(false);
                            }}
                          >
                            {cat}
                          </div>
                        ))}

                      {(newProduct.category || "").trim() !== "" &&
                        !categories.some((c) => c.trim().toLowerCase() === (newProduct.category || "").trim().toLowerCase()) && (
                          <div
                            className="px-3 py-2 text-sm text-violet-600 font-medium hover:bg-violet-50 cursor-pointer rounded flex items-center gap-2"
                            onClick={() => {
                              const newCat = (newProduct.category || "").trim();
                              const updatedCategories = [...categories, newCat];
                              setCategories(updatedCategories);
                              localStorage.setItem("product_categories", JSON.stringify(updatedCategories));
                              setNewProduct({ ...newProduct, category: newCat });
                              setShowCategoryDropdown(false);
                            }}
                          >
                            Create "{newProduct.category.trim()}"
                          </div>
                        )}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Product Type *</label>
                <select
                  value={newProduct.type}
                  onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="">Select Type</option>
                  {PRODUCT_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium mb-1">Composition</label>
                <div className="relative">
                  <input
                    type="text"
                    value={newProduct.composition}
                    onChange={(e) => {
                      handleAlphanumericChange("composition", e.target.value);
                      setShowCompositionDropdown(true);
                    }}
                    onFocus={() => setShowCompositionDropdown(true)}
                    placeholder="Select or type Composition"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 bg-white text-slate-900 focus:outline-none focus:border-violet-400"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs cursor-pointer"
                    onClick={() => setShowCompositionDropdown(!showCompositionDropdown)}
                  >
                    ▼
                  </span>
                </div>

                {showCompositionDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowCompositionDropdown(false)} />
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                      {compositions
                        .filter((c) => c.genericName.toLowerCase().includes((newProduct.composition || "").toLowerCase()))
                        .map((cat) => (
                          <div
                            key={cat.id}
                            className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded"
                            onClick={() => {
                              setNewProduct({ ...newProduct, composition: cat.genericName });
                              setShowCompositionDropdown(false);
                            }}
                          >
                            {cat.genericName}
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium mb-1">Scheme</label>
                <div className="relative">
                  <input
                    type="text"
                    value={newProduct.scheme}
                    onChange={(e) => {
                      handleAlphanumericChange("scheme", e.target.value);
                      setShowSchemeDropdown(true);
                    }}
                    onFocus={() => setShowSchemeDropdown(true)}
                    placeholder="Select or type Scheme"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 bg-white text-slate-900 focus:outline-none focus:border-violet-400"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs cursor-pointer"
                    onClick={() => setShowSchemeDropdown(!showSchemeDropdown)}
                  >
                    ▼
                  </span>
                </div>

                {showSchemeDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSchemeDropdown(false)} />
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                      {schemes
                        .filter((s) => s.status === "Active" && s.name.toLowerCase().includes((newProduct.scheme || "").toLowerCase()))
                        .map((sch) => (
                          <div
                            key={sch.id}
                            className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded"
                            onClick={() => {
                              setNewProduct({ ...newProduct, scheme: sch.name });
                              setShowSchemeDropdown(false);
                            }}
                          >
                            {sch.name}
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Manufacturer *</label>
                <select
                  value={newProduct.manufacturer}
                  onChange={(e) => setNewProduct({ ...newProduct, manufacturer: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                >
                  <option value="">Select Manufacturer</option>
                  {MANUFACTURERS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  Packaging Information
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Packing Type *</label>
                <select
                  value={newProduct.packingType}
                  onChange={(e) => setNewProduct({ ...newProduct, packingType: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="">Select Packing Type</option>
                  {packingTypes.map((type) => (
                    <option key={type.id} value={type.name}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Packs In Box</label>
                <input
                  type="number"
                  value={newProduct.packsInBox}
                  onChange={(e) => setNewProduct({ ...newProduct, packsInBox: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Units Per Pack</label>
                <input
                  type="number"
                  value={newProduct.unitsPerPack}
                  onChange={(e) => setNewProduct({ ...newProduct, unitsPerPack: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Total Units</label>
                <input
                  type="text"
                  readOnly
                  value={
                    newProduct.unitsPerPack && newProduct.packsInBox
                      ? (Number(newProduct.unitsPerPack) * Number(newProduct.packsInBox)).toString()
                      : ""
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  Pricing & Tax
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">MRP *</label>
                <input
                  type="number"
                  value={newProduct.mrp}
                  onChange={(e) => setNewProduct({ ...newProduct, mrp: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">PTR</label>
                <input
                  type="number"
                  value={newProduct.ptr}
                  onChange={(e) => setNewProduct({ ...newProduct, ptr: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Purchase Price</label>
                <input
                  type="number"
                  value={newProduct.purchasePrice}
                  onChange={(e) => setNewProduct({ ...newProduct, purchasePrice: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Selling Price</label>
                <input
                  type="number"
                  value={newProduct.sellingPrice}
                  onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">PTS</label>
                <input
                  type="number"
                  value={newProduct.pts}
                  onChange={(e) => setNewProduct({ ...newProduct, pts: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">GST %</label>
                <input
                  type="number"
                  value={newProduct.gst}
                  readOnly={!(activeRole === 'Super Admin' || activeRole === 'Admin')}
                  onChange={(e) => setNewProduct({ ...newProduct, gst: e.target.value })}
                  className={`w-full border border-slate-200 rounded-lg px-3 py-2 ${!(activeRole === 'Super Admin' || activeRole === 'Admin') ? "bg-slate-50 cursor-not-allowed" : ""}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">HSN Code *</label>
                <input
                  list="hsn-codes"
                  value={newProduct.hsnCode}
                  placeholder="Search or Select HSN Code"
                  onChange={(e) => {
                    const cleanHsn = e.target.value.replace(/\D/g, "").slice(0, 8); // HSN Numeric limits filter
                    const matches = gstRecords.filter((gst) => gst.hsnCode === cleanHsn);
                    if (matches.length > 0) {
                      matches.sort((a, b) => parseEffectiveDate(b.effectiveDate).getTime() - parseEffectiveDate(a.effectiveDate).getTime());
                      const latestGst = matches[0];
                      setNewProduct({
                        ...newProduct,
                        hsnCode: cleanHsn,
                        gst: latestGst?.totalGst?.replace("%", "") || "",
                      });
                    } else {
                      setNewProduct({
                        ...newProduct,
                        hsnCode: cleanHsn,
                      });
                    }
                  }}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
                <datalist id="hsn-codes">
                  {gstRecords.map((gst) => (
                    <option key={gst.id} value={gst.hsnCode}>{gst.hsnCode} - {gst.totalGst}</option>
                  ))}
                </datalist>
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  Inventory Controls
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Minimum Stock</label>
                <input
                  type="number"
                  value={newProduct.minimumStock}
                  onChange={(e) => setNewProduct({ ...newProduct, minimumStock: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reorder Level</label>
                <input
                  type="number"
                  value={newProduct.reorderLevel}
                  onChange={(e) => setNewProduct({ ...newProduct, reorderLevel: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex items-center gap-2 mt-7">
                <input
                  type="checkbox"
                  checked={newProduct.batchTracking}
                  onChange={(e) => setNewProduct({ ...newProduct, batchTracking: e.target.checked })}
                />
                <label className="text-sm font-medium">Batch Tracking</label>
              </div>

              <div className="flex items-center gap-2 mt-7">
                <input
                  type="checkbox"
                  checked={newProduct.expiryTracking}
                  onChange={(e) => setNewProduct({ ...newProduct, expiryTracking: e.target.checked })}
                />
                <label className="text-sm font-medium">Expiry Tracking</label>
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  Additional Information
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Barcode</label>
                <input
                  value={newProduct.barcode}
                  placeholder="Digits only (EAN-13)"
                  onChange={(e) => handleNumericOnlyChange("barcode", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={newProduct.status}
                  onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value as Product["status"] })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Discontinued">Discontinued</option>
                </select>
              </div>
            </div>

            </div>
            
            <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0 z-10 flex justify-end gap-3 rounded-b-2xl">
              <ActionButton variant="secondary" onClick={() => setShowNewProductModal(false)}>
                Cancel
              </ActionButton>
              <ActionButton
                onClick={() => {
                  if ((editMode && !canEdit) || (!editMode && !canCreate)) return;
                  handleSaveProduct();
                }}
              >
                {editMode ? "Update Product" : "Save Product"}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}