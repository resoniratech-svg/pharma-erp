import { useState, useRef, useEffect, useMemo } from 'react';
import { Download, Filter, ShoppingCart, Eye, ChevronDown, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import { type Column, type BadgeVariant } from './components/shared';

// Import services to fetch live entries from local storage / service pipelines
import { productService } from "../../services/productService";
import { schemeService } from "../../services/schemeService";
import { inventoryService } from "../../services/inventoryService";
import { retailerMasterService } from "../../services/retailerMasterService";
import authService from "../../services/authService";

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  packSize: string;
  baseUnit: string;
  unitsPerPack: string;
  mrp: string;
  ptr: string;
  scheme: string | null;
  stock: string;
  status: 'Available' | 'Low Stock' | 'Out Of Stock';
  schemeType?: string;
  schemeValidFrom?: string;
  schemeValidTo?: string;
  schemeDescription?: string;
  distributorCode?: string;
  distributorName?: string;
  inventoryRecordId?: string;
  productId?: string;
  batchNumber?: string;
  warehouseCode?: string;
}

export default function ProductCatalog() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [distributorFilter, setDistributorFilter] = useState('');
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartProduct, setCartProduct] = useState<Product | null>(null);
  const [orderQty, setOrderQty] = useState('');
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assignedDistributors, setAssignedDistributors] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync real Distributor Inventory (Current Stock) rows with Catalog View
  useEffect(() => {
    const fetchCatalogData = async () => {
      try {
        setIsLoading(true);

        // 1. Resolve assigned distributors for this retailer from backend
        const user = authService.getCurrentUser();
        let resolvedDistributors: { code: string; name: string }[] = [];
        
        if (user) {
          const retailerMasterList = await retailerMasterService.fetchFromApi();
          const retailerRecord = retailerMasterList.find(r => 
            r.id === user.id || 
            r.code === user.id ||
            r.code === user.employeeCode ||
            r.emailAddress === user.email ||
            r.name.toLowerCase() === user.fullName.toLowerCase() ||
            (user as any).username === r.code
          );
          
          if (retailerRecord) {
            resolvedDistributors = retailerRecord.assignedDistributors || [];
          } else {
            // Fallback if user has direct distributor link
            const distCode = user.linkedDistributorCode || (user as any).distributorCode;
            if (distCode) {
              resolvedDistributors = [{ code: distCode, name: 'Assigned Distributor' }];
            } else {
              const roleIdUpper = String(user.roleId || '').toUpperCase();
              // Fallback for Admin, Super Admin, Distributor, MR roles to avoid blank screens
              if (roleIdUpper === 'SUPER_ADMIN' || roleIdUpper === 'ADMIN' || roleIdUpper === 'DISTRIBUTOR' || roleIdUpper === 'MR' || roleIdUpper === 'RETAILER') {
                const allInv = await inventoryService.loadInventory();
                const uniqueDistCodes = Array.from(new Set(allInv.map(inv => inv.warehouseCode || inv.warehouseId)));
                resolvedDistributors = uniqueDistCodes.map(code => ({ code, name: `Distributor ${code}` }));
              }
            }
          }
        }
        
        setAssignedDistributors(resolvedDistributors);
        const assignedCodes = resolvedDistributors.map(d => d.code);

        // 2. Fetch products and active inventory records from backend DB
        const rawProducts = await productService.loadProducts();
        const allInventory = await inventoryService.loadInventory();
        
        let schemes: any[] = [];
        try {
          schemes = await schemeService.getAll();
        } catch (schemeErr) {
          console.warn("Scheme engine lookup bypassed:", schemeErr);
        }

        const mappedProducts: Product[] = [];

        allInventory.forEach((inv) => {
          const recordDistCode = inv.warehouseCode || inv.warehouseId;
          const isAssigned = assignedCodes.includes(recordDistCode);
          if (!isAssigned) return;

          // Retail Availability check
          const isRetailAvailable = (inv as any).isAvailableForOrdering !== false && (inv as any).visibleToRetailers !== false;
          if (!isRetailAvailable) return;

          // Available Qty check
          if (inv.availableQty <= 0) return;

          // Product Master lookup and status check
          const product = rawProducts.find(p => p.code === inv.productCode);
          if (!product || product.status !== 'Active') return;

          // Verify if blocked / quarantined / damaged
          const statusLower = (inv as any).status ? String((inv as any).status).toLowerCase() : '';
          if (statusLower === 'blocked' || statusLower === 'quarantine' || statusLower === 'damaged') return;
          if (inv.blockedQty > 0 || inv.damagedQty > 0) return;

          // Find active scheme applicable to product and distributor
          const linkedScheme = schemes?.find((s: any) => {
            const isLinked = s.id === product.scheme || s.name === product.scheme || s.schemeCode === product.scheme || s.applicableSelection === product.code;
            if (!isLinked) return false;

            if (s.status !== 'Active') return false;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (s.validFrom) {
              const fromDate = new Date(s.validFrom);
              fromDate.setHours(0, 0, 0, 0);
              if (today < fromDate) return false;
            }
            if (s.validTo) {
              const toDate = new Date(s.validTo);
              toDate.setHours(23, 59, 59, 999);
              if (today > toDate) return false;
            }

            const schemeDist = s.distributorCode || s.distributor || s.warehouseId || s.warehouseCode;
            if (schemeDist && String(schemeDist) !== String(recordDistCode)) return false;

            return true;
          });
          
          // Use dynamic PTR from inventory / fallback
          const distributorSellingPrice = Number((inv as any).distributorSellingPrice || inv.ptr || product.ptr || 0);
          
          // Stock warnings
          const lowLimit = product.reorderLevel ? parseInt(product.reorderLevel, 10) : 20;
          let computedStatus: Product['status'] = 'Available';
          if (inv.availableQty <= 0) {
            computedStatus = 'Out Of Stock';
          } else if (inv.availableQty <= lowLimit) {
            computedStatus = 'Low Stock';
          }

          const distInfo = resolvedDistributors.find((d: any) => d.code === recordDistCode);
          const distributorName = distInfo ? distInfo.name : inv.warehouseName || 'Unknown Distributor';

          mappedProducts.push({
            id: inv.id,
            code: product.code || inv.productCode || 'N/A',
            name: product.name || inv.productName || 'Unnamed Product',
            category: product.category || 'General',
            brand: product.brandName || product.manufacturer || 'N/A',
            packSize: product.packingType ? `${product.packingType} (${product.unitsPerPack || 10}s)` : `${product.unitsPerPack || 10} Units`,
            baseUnit: product.packingType || 'Pack',
            unitsPerPack: String(product.unitsPerPack || '10'),
            mrp: String(product.mrp).startsWith('₹') ? product.mrp : `₹ ${parseFloat(product.mrp || '0').toFixed(2)}`,
            ptr: `₹ ${distributorSellingPrice.toFixed(2)}`,
            scheme: linkedScheme ? linkedScheme.name : null,
            stock: `${inv.availableQty.toLocaleString()} Units`,
            status: computedStatus,
            schemeType: linkedScheme?.type || 'N/A',
            schemeValidFrom: linkedScheme?.validFrom || 'N/A',
            schemeValidTo: linkedScheme?.validTo || 'N/A',
            schemeDescription: linkedScheme?.remarks || linkedScheme?.description || 'No promotional conditions found.',
            distributorCode: recordDistCode,
            distributorName: distributorName,
            inventoryRecordId: inv.id,
            productId: product.id,
            batchNumber: inv.batchNo,
            warehouseCode: inv.warehouseCode || inv.warehouseId
          });
        });

        // Sort products by Distributor, Category, Product Name
        mappedProducts.sort((a, b) => {
          const distA = a.distributorName || '';
          const distB = b.distributorName || '';
          const distCompare = distA.localeCompare(distB);
          if (distCompare !== 0) return distCompare;

          const catA = a.category || '';
          const catB = b.category || '';
          const catCompare = catA.localeCompare(catB);
          if (catCompare !== 0) return catCompare;

          const nameA = a.name || '';
          const nameB = b.name || '';
          return nameA.localeCompare(nameB);
        });

        setProducts(mappedProducts);
      } catch (error) {
        console.error("Error aligning Catalog component indexes with Product Master:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalogData();
  }, []);

  const dynamicCategories = useMemo(() => {
    const unique = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(unique).map(cat => ({ label: cat, value: cat }));
  }, [products]);

  const filteredData = useMemo(() => {
    return products.filter((item) => {
      const searchStr = search.toLowerCase();
      const matchSearch = item.name.toLowerCase().includes(searchStr) || item.code.toLowerCase().includes(searchStr);
      const matchCategory = categoryFilter ? item.category === categoryFilter : true;
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      const matchDistributor = distributorFilter ? item.distributorCode === distributorFilter : true;
      return matchSearch && matchCategory && matchStatus && matchDistributor;
    });
  }, [search, categoryFilter, statusFilter, distributorFilter, products]);

  const getStatusVariant = (status: string): BadgeVariant => {
    if (status === 'Available') return 'success';
    if (status === 'Low Stock') return 'warning';
    return 'danger';
  };

  const columns = useMemo<Column<Product>[]>(() => {
    return [
      { key: 'code', label: 'code', render: (row) => <span className="font-semibold text-slate-700">{row.code}</span> },
      { 
        key: 'name', 
        label: 'name', 
        render: (row) => (
          <div>
            <span className="font-semibold text-slate-900 block">{row.name}</span>
            {assignedDistributors.length > 1 && row.distributorName && (
              <span className="text-[10px] text-violet-700 font-bold bg-violet-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                Distributor: {row.distributorName}
              </span>
            )}
          </div>
        )
      },
      { key: 'category', label: 'category', render: (row) => <span className="text-slate-600">{row.category}</span> },
      { key: 'packSize', label: 'packSize', render: (row) => <span className="text-slate-600">{row.packSize}</span> },
      { key: 'ptr', label: 'ptr', render: (row) => <span className="font-bold text-violet-700">{row.ptr}</span> },
      { key: 'scheme', label: 'scheme', render: (row) => row.scheme ? <span className="text-emerald-600 font-medium">{row.scheme}</span> : <Badge variant="neutral">No Active Scheme</Badge> },
      { key: 'stock', label: 'stock', render: (row) => <span className="font-medium text-slate-800">{row.stock}</span> },
      { key: 'status', label: 'status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
      {
        key: 'actions',
        label: 'id',
        render: (row) => (
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedProduct(row)} className="text-slate-400 hover:text-[#163c78] transition-colors p-1" title="View Details">
              <Eye className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { setCartProduct(row); setOrderQty('1'); }} 
              disabled={row.status === 'Out Of Stock'}
              className="text-slate-400 hover:text-emerald-600 transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed" 
              title="Add To Cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        )
      }
    ];
  }, [assignedDistributors]);

  const getExportData = () => {
    return filteredData.map(item => ({
      'Product Code': item.code,
      'Product Name': item.name,
      'Category': item.category,
      'Pack Size': item.packSize,
      'PTR': item.ptr,
      'Active Scheme': item.scheme || 'No Active Scheme',
      
      'Available Stock': item.stock,
      'Status': item.status,
      ...(assignedDistributors.length > 1 ? {
        'Distributor Code': item.distributorCode || '',
        'Distributor Name': item.distributorName || ''
      } : {})
    }));
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Product_Catalog");
    XLSX.writeFile(wb, "Product_Catalog.xlsx");
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Product_Catalog.csv";
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const data = getExportData();
    if (data.length === 0) return;
    const doc = new jsPDF('landscape');
    const headers = Object.keys(data[0] || {});
    const body = data.map(obj => headers.map(header => (obj as any)[header]));
    
    doc.text("Product Catalog", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237] },
      styles: { fontSize: 8 }
    });
    doc.save("Product_Catalog.pdf");
    setShowExportMenu(false);
  };

  const handleAddToCart = () => {
    if (!orderQty || isNaN(Number(orderQty)) || Number(orderQty) <= 0 || !cartProduct) {
      alert("Please enter a valid order quantity.");
      return;
    }
    
    const qty = parseInt(orderQty, 10);
    const numericPtr = parseFloat(cartProduct.ptr.replace(/[^0-9.]/g, '')) || 0;
    
    const cartKey = 'pharma_erp_retailer_cart';
    const existingCartRaw = localStorage.getItem(cartKey);
    let currentItems = existingCartRaw ? JSON.parse(existingCartRaw) : [];

    const duplicateIndex = currentItems.findIndex((i: any) => 
      i.productCode === cartProduct.code && 
      i.distributorCode === cartProduct.distributorCode
    );

    const cartPayload = {
      productCode: cartProduct.code,
      productName: cartProduct.name,
      packType: cartProduct.packSize,
      ptr: numericPtr,
      scheme: cartProduct.scheme || 'No Scheme',
      quantity: qty,
      lineTotal: numericPtr * qty,
      distributorCode: cartProduct.distributorCode || '',
      distributorName: cartProduct.distributorName || '',
      inventoryId: cartProduct.inventoryRecordId || '',
      sellingPrice: numericPtr,
      schemeApplied: cartProduct.scheme || 'No Scheme',
      productId: cartProduct.productId || '',
      batchNumber: cartProduct.batchNumber || '',
      warehouseCode: cartProduct.warehouseCode || ''
    };

    if (duplicateIndex > -1) {
      currentItems[duplicateIndex].quantity += qty;
      currentItems[duplicateIndex].lineTotal = currentItems[duplicateIndex].quantity * currentItems[duplicateIndex].ptr;
    } else {
      currentItems.push(cartPayload);
    }

    localStorage.setItem(cartKey, JSON.stringify(currentItems));
    window.dispatchEvent(new Event('cartUpdated'));

    alert(`Successfully added ${qty} of ${cartProduct.name} to cart.`);
    setCartProduct(null);
    setOrderQty('');
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Product Browsing"
        subtitle="Browse available products, view active schemes, check stock availability, and add items to your cart."
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Download Price List <ChevronDown className="w-3 h-3 ml-1" />
            </ActionButton>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export Excel (.xlsx)</button>
                  <button onClick={handleExportCSV} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export CSV (.csv)</button>
                  <button onClick={handleExportPDF} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export PDF (.pdf)</button>
                </div>
              </div>
            )}
          </div>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search product name or code..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        {assignedDistributors.length > 1 && (
          <SelectFilter
            value={distributorFilter}
            onChange={setDistributorFilter}
            options={assignedDistributors.map(d => ({ label: d.name, value: d.code }))}
            placeholder="All Assigned Distributors"
          />
        )}
        <SelectFilter
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={dynamicCategories}
          placeholder="All Categories"
        />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Available', value: 'Available' },
            { label: 'Low Stock', value: 'Low Stock' },
            { label: 'Out Of Stock', value: 'Out Of Stock' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 font-medium animate-pulse">
            Synchronizing live catalog indexes...
          </div>
        ) : (
          <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
            <DataTable
              columns={columns}
              data={filteredData}
              emptyMessage="No products found matching your search or filters."
            />
          </div>
        )}
      </TableCard>

      <Drawer
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Product Details"
      >
        {selectedProduct && (
          <div className="space-y-6 pb-20">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Product Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Product Code" value={<span className="font-semibold text-slate-900">{selectedProduct.code}</span>} />
                <DrawerField label="Product Name" value={selectedProduct.name} />
                <DrawerField label="Category" value={selectedProduct.category} />
                <DrawerField label="Brand" value={selectedProduct.brand} />
              </div>
            </div>

            {assignedDistributors.length > 1 && selectedProduct.distributorCode && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 font-semibold">Distributor Details</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <DrawerField label="Distributor Code" value={selectedProduct.distributorCode} />
                  <DrawerField label="Distributor Name" value={selectedProduct.distributorName || 'N/A'} />
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Pricing</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="MRP" value={selectedProduct.mrp} />
                <DrawerField label="PTR" value={<span className="font-bold text-violet-700">{selectedProduct.ptr}</span>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Packaging</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Base Unit" value={selectedProduct.baseUnit} />
                <DrawerField label="Pack Size" value={selectedProduct.packSize} />
                <DrawerField label="Units Per Pack" value={selectedProduct.unitsPerPack} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Stock Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Available Stock" value={<span className="font-medium text-slate-800">{selectedProduct.stock}</span>} />
                <DrawerField label="Stock Status" value={<Badge variant={getStatusVariant(selectedProduct.status)}>{selectedProduct.status}</Badge>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Active Schemes</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Scheme Name" value={selectedProduct.scheme ? <span className="font-medium text-emerald-600">{selectedProduct.scheme}</span> : <span className="text-slate-500 font-medium">No Active Scheme</span>} />
                {selectedProduct.scheme && (
                  <>
                    <DrawerField label="Scheme Type" value={selectedProduct.schemeType} />
                    <DrawerField label="Valid From" value={selectedProduct.schemeValidFrom} />
                    <DrawerField label="Valid To" value={selectedProduct.schemeValidTo} />
                    <DrawerField label="Conditions" value={<span className="text-xs text-slate-600 block mt-1">{selectedProduct.schemeDescription}</span>} />
                  </>
                )}
              </div>
            </div>
            
            {selectedProduct.status !== 'Out Of Stock' && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <ActionButton 
                  onClick={() => {
                    setCartProduct(selectedProduct);
                    setOrderQty('1');
                    setSelectedProduct(null);
                  }} 
                  icon={<ShoppingCart className="w-4 h-4" />}
                >
                  Add To Cart
                </ActionButton>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Add To Cart Modal */}
      {cartProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setCartProduct(null)}></div>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 relative z-10 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-semibold text-slate-900">Add To Cart</h3>
              <button onClick={() => setCartProduct(null)} className="text-slate-400 hover:text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Product</label>
                <div className="font-semibold text-slate-900 text-sm">{cartProduct.name}</div>
                <div className="text-xs text-slate-500">{cartProduct.code} • {cartProduct.packSize}</div>
              </div>
              {assignedDistributors.length > 1 && cartProduct.distributorName && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Distributor</label>
                  <div className="font-semibold text-slate-700 text-xs">{cartProduct.distributorName} ({cartProduct.distributorCode})</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">PTR</label>
                  <div className="font-bold text-violet-700 text-sm">{cartProduct.ptr}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Available</label>
                  <div className="font-medium text-slate-900 text-sm">{cartProduct.stock}</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Order Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  value={orderQty}
                  onChange={(e) => setOrderQty(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm" 
                  placeholder="Enter quantity"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setCartProduct(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
              <button onClick={handleAddToCart} className="px-4 py-2 text-sm font-medium bg-[#163c78] text-white rounded-lg hover:bg-[#112d59] shadow-sm transition-all active:scale-[0.98] flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" /> Add To Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}