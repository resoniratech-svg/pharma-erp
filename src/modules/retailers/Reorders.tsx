import { useState, useRef, useEffect, useMemo } from 'react';
import { Download, Filter, RefreshCcw, Eye, ChevronDown, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
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

import authService from '../../services/authService';
import { retailerMasterService } from '../../services/retailerMasterService';
import { productService } from '../../services/productService';
import { inventoryService } from '../../services/inventoryService';
import { schemeService } from '../../services/schemeService';

// Inline Modal component
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-50" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed inset-0 m-auto z-50 w-full max-w-lg max-h-[85vh] bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <h2 className="text-base font-bold text-slate-800">{title}</h2>
              <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

type ReorderStatus = 'Recommended' | 'Already Reordered' | 'Ignored';

interface Reorder {
  id: string;
  retailer: string;
  productName: string;
  productCode: string;
  lastOrderDate: string;
  lastOrderedQty: string;
  suggestedQty: string;
  availability: string;
  availableStock: string;
  purchaseFreq: string;
  reason: string;
  status: ReorderStatus;
  unitPrice: number;
}

export default function Reorders() {
  const [data, setData] = useState<Reorder[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [viewDetails, setViewDetails] = useState<Reorder | null>(null);
  const [reorderItem, setReorderItem] = useState<Reorder | null>(null);
  const [reorderQty, setReorderQty] = useState('');
  const [remarks, setRemarks] = useState('');
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [userRetailerContext, setUserRetailerContext] = useState<any>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Context Initialization
  useEffect(() => {
    try {
      const user = authService.getCurrentUser();
      if (!user) return;
      const retailers = retailerMasterService.getAll ? retailerMasterService.getAll() : [];
      const userId = String(user.id || '').trim().toLowerCase();
      const userCode = String(user.employeeCode || '').trim().toLowerCase();
      const userEmail = String(user.email || '').trim().toLowerCase();
      const username = String((user as any).username || '').trim().toLowerCase();
      const userName = String(user.fullName || (user as any).name || '').trim().toLowerCase();

      let matchedRetailer = null;
      matchedRetailer = retailers.find((r: any) => String(r.id || '').trim().toLowerCase() === userId);
      if (!matchedRetailer && userCode) matchedRetailer = retailers.find((r: any) => String(r.code || '').trim().toLowerCase() === userCode);
      if (!matchedRetailer && userEmail) matchedRetailer = retailers.find((r: any) => String(r.emailAddress || r.email || '').trim().toLowerCase() === userEmail);
      if (!matchedRetailer && username) matchedRetailer = retailers.find((r: any) => String(r.username || '').trim().toLowerCase() === username);
      if (!matchedRetailer && userName) matchedRetailer = retailers.find((r: any) => String(r.name || r.retailerName || '').trim().toLowerCase() === userName);

      setUserRetailerContext(matchedRetailer || { id: user.id, code: user.employeeCode, name: user.fullName });
    } catch (e) {
      console.error("Context error:", e);
    }
  }, []);

  // Load and calculate recommendations based on Distributor Inventory
  useEffect(() => {
    if (!userRetailerContext) return;

    try {
      const inventory = inventoryService.getAll ? inventoryService.getAll() : [];
      const products = (productService as any).getProducts ? (productService as any).getProducts() : [];
      const schemes = schemeService.getAll ? schemeService.getAll() : [];
      
      const ordersStr = localStorage.getItem('pharma_erp_retailer_orders');
      const allOrders = ordersStr ? JSON.parse(ordersStr) : [];
      
      const cartStr = localStorage.getItem('pharma_erp_retailer_cart');
      const cartItems = cartStr ? JSON.parse(cartStr) : [];

      const tradeOffersStr = localStorage.getItem('pharma_erp_trade_offers');
      const tradeOffers = tradeOffersStr ? JSON.parse(tradeOffersStr) : [];

      const ignoredStr = localStorage.getItem('pharma_erp_ignored_reorders');
      const ignoredItems: string[] = ignoredStr ? JSON.parse(ignoredStr) : [];

      const retailerId = String(userRetailerContext.id || '').toLowerCase();
      const retailerCode = String(userRetailerContext.code || '').toLowerCase();
      
      const myOrders = allOrders.filter((o: any) => 
        String(o.retailerId).toLowerCase() === retailerId || String(o.retailerCode).toLowerCase() === retailerCode
      );

      // Dist Assignment Check
      let assignedDistCode = '';
      if (userRetailerContext.assignedDistributors && userRetailerContext.assignedDistributors.length > 0) {
        const dist = userRetailerContext.assignedDistributors[0];
        assignedDistCode = typeof dist === 'string' ? dist : (dist.code || dist.id);
      } else if (userRetailerContext.assignedDistributor) {
        assignedDistCode = userRetailerContext.assignedDistributor;
      }
      assignedDistCode = assignedDistCode.toLowerCase();

      // Filter Inventory for Assigned Distributor and valid states
      const distInventory = inventory.filter((inv: any) => {
        const invDistCode = String(inv.distributorCode || inv.warehouseCode || inv.distributorId || '').toLowerCase();
        if (assignedDistCode && invDistCode && invDistCode !== assignedDistCode) return false;
        
        if (inv.visibleToRetailers === false) return false;
        if (inv.status && inv.status !== 'Active') return false;
        if (inv.isBlocked || inv.isQuarantined || inv.isDamaged || inv.isExpired) return false;
        if (Number(inv.blockedQty || 0) > 0 || Number(inv.damagedQty || 0) > 0 || Number(inv.quarantinedQty || 0) > 0 || Number(inv.expiredQty || 0) > 0) {
            // Strictly ignoring based on requirements
            return false;
        }

        const opening = Number(inv.openingStock || 0);
        const purchase = Number(inv.purchaseQty || 0);
        const transferIn = Number(inv.transferInQty || 0);
        let available = Number(inv.availableQty || 0);
        
        if (!available && (opening || purchase)) {
           const reserved = Number(inv.reservedQty || 0);
           const dispatched = Number(inv.dispatchedQty || 0);
           available = (opening + purchase + transferIn) - (reserved + dispatched);
        }
        
        if (available <= 0) return false;
        
        return true;
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeSchemes = schemes.filter((s: any) => {
        if (s.status !== 'Active') return false;
        if (s.validFrom && new Date(s.validFrom) > today) return false;
        if (s.validTo) {
          const toD = new Date(s.validTo);
          toD.setHours(23, 59, 59, 999);
          if (today > toD) return false;
        }
        return true;
      });

      const activeTradeOffers = tradeOffers.filter((o: any) => {
        if (o.status !== 'Active') return false;
        if (o.distributorCode && String(o.distributorCode).toLowerCase() !== assignedDistCode) return false;
        if (o.validTo) {
          const toD = new Date(o.validTo);
          toD.setHours(23, 59, 59, 999);
          if (today > toD) return false;
        }
        return true;
      });

      // Product Purchase History Map
      const purchaseHistory = new Map<string, { totalQty: number, count: number, lastDate: Date, lastQty: number, pendingQty: number }>();
      
      myOrders.forEach((o: any) => {
        const orderDate = new Date(o.date);
        const isPending = o.status === 'Pending' || o.status === 'Processing';
        if (o.items && Array.isArray(o.items)) {
          o.items.forEach((i: any) => {
            const current = purchaseHistory.get(i.productCode) || { totalQty: 0, count: 0, lastDate: new Date(0), lastQty: 0, pendingQty: 0 };
            current.totalQty += Number(i.quantity) || 0;
            current.count += 1;
            if (isPending) current.pendingQty += Number(i.quantity) || 0;
            if (orderDate > current.lastDate) {
              current.lastDate = orderDate;
              current.lastQty = Number(i.quantity) || 0;
            }
            purchaseHistory.set(i.productCode, current);
          });
        }
      });

      const recommendations: Reorder[] = [];

      // Process uniquely by product code to avoid duplicate entries for multiple batches in inventory
      const processedProductCodes = new Set<string>();

      distInventory.forEach((inv: any) => {
        const pCode = inv.productCode;
        if (processedProductCodes.has(pCode)) return;
        
        const p = products.find((prod: any) => prod.code === pCode);
        if (!p || p.status !== 'Active' || (p as any).saleable === false || (p as any).blocked === true) return;

        processedProductCodes.add(pCode);

        // Aggregate total available inventory for this product from the distributor
        let totalAvailableStock = 0;
        distInventory.filter((i: any) => i.productCode === pCode).forEach((i: any) => {
            let available = Number(i.availableQty || 0);
            if (!available && (Number(i.openingStock || 0) || Number(i.purchaseQty || 0))) {
                available = (Number(i.openingStock || 0) + Number(i.purchaseQty || 0) + Number(i.transferInQty || 0)) - 
                            (Number(i.reservedQty || 0) + Number(i.dispatchedQty || 0));
            }
            totalAvailableStock += Math.max(0, available);
        });

        if (totalAvailableStock <= 0) return;

        const hist = purchaseHistory.get(pCode);
        
        let hasActiveScheme = false;
        activeSchemes.forEach((s: any) => {
          if (s.applicableTo === 'All Products') hasActiveScheme = true;
          if (s.applicableTo === 'Product' && s.applicableSelection === pCode) hasActiveScheme = true;
          if (s.applicableTo === 'Category' && p.category === s.applicableSelection) hasActiveScheme = true;
          if (s.applicableTo === 'Brand' && (p.brandName || (p as any).brand) === s.applicableSelection) hasActiveScheme = true;
        });

        let hasActiveTradeOffer = false;
        activeTradeOffers.forEach((o: any) => {
          if (o.products && Array.isArray(o.products)) {
             if (o.products.some((op: any) => op.productCode === pCode || op.code === pCode)) hasActiveTradeOffer = true;
          }
        });

        let shouldRecommend = false;
        let reason = '';
        let freq = 'Infrequent';
        const reorderLevel = Number((p as any).reorderLevel || 0);
        const safetyStock = Number((p as any).safetyStock || 0);

        if (hist) {
           const daysSinceLast = Math.floor((today.getTime() - hist.lastDate.getTime()) / (1000 * 3600 * 24));
           if (hist.count > 3) freq = 'Frequently Ordered';
           else if (hist.count > 1) freq = 'Regular';
           
           if (daysSinceLast > 14 && hist.count > 1) {
             shouldRecommend = true;
             reason = 'Reorder Due Based on History';
           } else if (freq === 'Frequently Ordered' && daysSinceLast > 7) {
             shouldRecommend = true;
             reason = 'Fast Moving Product';
           } else if (reorderLevel > 0 && hist.lastQty <= reorderLevel) {
             shouldRecommend = true;
             reason = 'Stock Below Reorder Level';
           }
        } else if (safetyStock > 0 || reorderLevel > 0) {
            // New logic based on safety rules even if no direct history
            shouldRecommend = true;
            reason = 'Safety Stock Replenishment';
        }

        if (hasActiveTradeOffer) {
          shouldRecommend = true;
          reason = 'Special Distributor Trade Offer Active';
        } else if (hasActiveScheme) {
          shouldRecommend = true;
          reason = 'Special Scheme Discount Active';
        }

        if (shouldRecommend) {
          let status: ReorderStatus = 'Recommended';
          
          const inCart = cartItems.find((ci: any) => ci.productCode === pCode);
          const hasPendingOrder = hist && hist.pendingQty > 0;
          
          if (inCart || hasPendingOrder) {
            status = 'Already Reordered';
          } else if (ignoredItems.includes(pCode)) {
            status = 'Ignored';
          }

          let suggestedQtyVal = hist ? hist.lastQty : (reorderLevel > 0 ? reorderLevel : 10);
          if (suggestedQtyVal <= 0) suggestedQtyVal = 10;
          if (suggestedQtyVal > totalAvailableStock) suggestedQtyVal = totalAvailableStock;

          // Pricing logic: use distributor inventory selling price, fallback to PTR or MRP
          const unitP = parseFloat(inv.sellingPrice || inv.distributorPrice || p.ptr || p.mrp || '0');

          recommendations.push({
            id: pCode,
            retailer: userRetailerContext.name,
            productName: p.name,
            productCode: pCode,
            lastOrderDate: hist && hist.lastDate.getTime() > 0 ? hist.lastDate.toLocaleDateString('en-GB') : 'Never',
            lastOrderedQty: hist && hist.lastQty > 0 ? `${hist.lastQty} Units` : '0 Units',
            suggestedQty: `${suggestedQtyVal} Units`,
            availability: 'In Stock', // Verified > 0 above
            availableStock: `${totalAvailableStock} Units`,
            purchaseFreq: freq,
            reason: reason,
            status: status,
            unitPrice: unitP
          });
        }
      });

      // Sort: Recommended first, then Already Reordered, then Ignored
      recommendations.sort((a, b) => {
        if (a.status === 'Recommended' && b.status !== 'Recommended') return -1;
        if (b.status === 'Recommended' && a.status !== 'Recommended') return 1;
        if (a.status === 'Already Reordered' && b.status === 'Ignored') return -1;
        if (a.status === 'Ignored' && b.status === 'Already Reordered') return 1;
        return 0;
      });

      setData(recommendations);
    } catch (e) {
      console.error("Failed to build recommendations", e);
    }
  }, [userRetailerContext]);

  useEffect(() => {
    if (reorderItem) {
      setReorderQty(reorderItem.suggestedQty.split(' ')[0]);
      setRemarks('');
    }
  }, [reorderItem]);

  const filteredData = data.filter((item) => {
    const searchStr = search.toLowerCase();
    const matchSearch = item.productName.toLowerCase().includes(searchStr) || item.productCode.toLowerCase().includes(searchStr);
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const getStatusVariant = (status: ReorderStatus): BadgeVariant => {
    if (status === 'Already Reordered') return 'success';
    if (status === 'Recommended') return 'info';
    if (status === 'Ignored') return 'neutral';
    return 'neutral';
  };

  const handleAddToCart = () => {
    if (!reorderQty || isNaN(Number(reorderQty)) || Number(reorderQty) <= 0) {
      alert("Please enter a valid quantity greater than zero.");
      return;
    }
    
    if (reorderItem) {
      const parsedQty = Number(reorderQty);
      const availableStockStr = reorderItem.availableStock.split(' ')[0];
      const availableStock = Number(availableStockStr);

      if (parsedQty > availableStock) {
        alert(`Cannot add more than available stock (${availableStock} Units).`);
        return;
      }

      try {
        const cartStr = localStorage.getItem('pharma_erp_retailer_cart');
        const currentCart = cartStr ? JSON.parse(cartStr) : [];
        
        const existingItem = currentCart.find((ci: any) => ci.productCode === reorderItem.productCode);
        if (existingItem) {
          existingItem.quantity += parsedQty;
          existingItem.lineTotal = existingItem.quantity * existingItem.unitPrice;
        } else {
          currentCart.push({
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
            productName: reorderItem.productName,
            productCode: reorderItem.productCode,
            quantity: parsedQty,
            unitPrice: reorderItem.unitPrice,
            lineTotal: parsedQty * reorderItem.unitPrice,
            scheme: 'Calculated at checkout'
          });
        }
        localStorage.setItem('pharma_erp_retailer_cart', JSON.stringify(currentCart));

        const updatedData = data.map(d => 
          d.id === reorderItem.id ? { ...d, status: 'Already Reordered' as ReorderStatus } : d
        );
        setData(updatedData);
        setReorderItem(null);
        alert(`Successfully added ${reorderQty} units of ${reorderItem.productName} to Cart.`);
      } catch (e) {
        console.error("Cart error", e);
        alert("Failed to add to cart.");
      }
    }
  };

  const handleIgnore = (row: Reorder) => {
    try {
      const ignoredStr = localStorage.getItem('pharma_erp_ignored_reorders');
      const ignoredItems: string[] = ignoredStr ? JSON.parse(ignoredStr) : [];
      if (!ignoredItems.includes(row.productCode)) {
         ignoredItems.push(row.productCode);
         localStorage.setItem('pharma_erp_ignored_reorders', JSON.stringify(ignoredItems));
      }
      const updatedData = data.map(d => 
        d.id === row.id ? { ...d, status: 'Ignored' as ReorderStatus } : d
      );
      setData(updatedData);
    } catch (e) {
      console.error(e);
    }
  };

  const columns: Column<Reorder>[] = [
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-violet-700">{row.productName}</span> },
    { key: 'productCode', label: 'Product Code', render: (row) => <span className="text-slate-600">{row.productCode}</span> },
    { key: 'lastOrderDate', label: 'Last Order Date', render: (row) => <span className="text-slate-600">{row.lastOrderDate}</span> },
    { key: 'lastOrderedQty', label: 'Last Ordered Qty', render: (row) => <span className="text-slate-600">{row.lastOrderedQty}</span> },
    { key: 'suggestedQty', label: 'Suggested Qty', render: (row) => <span className="font-medium text-slate-800">{row.suggestedQty}</span> },
    { key: 'availability', label: 'Availability', render: (row) => <span className={`font-medium ${row.availability === 'In Stock' ? 'text-emerald-600' : 'text-amber-600'}`}>{row.availability}</span> },
    { key: 'status', label: 'Reorder Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {(row.status === 'Recommended' || row.status === 'Ignored') && (
            <ActionButton variant="ghost" className="text-[#163c78] text-xs px-2 py-1" onClick={() => setReorderItem(row)}>
              <RefreshCcw className="w-3 h-3 mr-1" /> Reorder
            </ActionButton>
          )}
          {row.status === 'Recommended' && (
            <ActionButton variant="ghost" className="text-slate-400 hover:text-red-500 text-xs px-2 py-1" onClick={() => handleIgnore(row)}>
              <X className="w-3 h-3 mr-1" /> Ignore
            </ActionButton>
          )}
          {row.status === 'Already Reordered' && (
            <ActionButton variant="ghost" className="text-slate-500 text-xs px-2 py-1" onClick={() => setViewDetails(row)}>
              <Eye className="w-3 h-3 mr-1" /> View History
            </ActionButton>
          )}
        </div>
      )
    }
  ];

  // Exports
  const getExportData = () => {
    return filteredData.map(item => ({
      'Product Name': item.productName,
      'Product Code': item.productCode,
      'Last Order Date': item.lastOrderDate,
      'Last Ordered Qty': item.lastOrderedQty,
      'Suggested Qty': item.suggestedQty,
      'Availability': item.availability,
      'Reorder Status': item.status
    }));
  };

  const handleExportExcel = () => {
    const dataToExport = getExportData();
    if (dataToExport.length === 0) {
      setShowExportMenu(false);
      return;
    }
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reorder_Recommendations");
    XLSX.writeFile(wb, "Reorder_Recommendations.xlsx");
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const dataToExport = getExportData();
    if (dataToExport.length === 0) {
      setShowExportMenu(false);
      return;
    }
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Reorder_Recommendations.csv";
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const dataToExport = getExportData();
    if (dataToExport.length === 0) {
      setShowExportMenu(false);
      return;
    }
    const doc = new jsPDF('landscape');
    const headers = Object.keys(dataToExport[0] || {});
    const body = dataToExport.map(obj => headers.map(header => (obj as any)[header]));
    
    doc.text("Reorder Recommendations", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237] },
      styles: { fontSize: 9 }
    });
    doc.save("Reorder_Recommendations.pdf");
    setShowExportMenu(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Reorder Functionality"
        subtitle="View intelligent reorder recommendations based on your purchase history and quickly add products to your cart."
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export <ChevronDown className="w-3 h-3 ml-1" />
            </ActionButton>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button onClick={handleExportCSV} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export CSV</button>
                  <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export Excel</button>
                  <button onClick={handleExportPDF} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export PDF</button>
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
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'All', value: '' },
            { label: 'Recommended', value: 'Recommended' },
            { label: 'Already Reordered', value: 'Already Reordered' },
            { label: 'Ignored', value: 'Ignored' },
          ]}
          placeholder="Status"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No reorder recommendations found."
          />
        </div>
      </TableCard>

      {/* View Details Drawer */}
      <Drawer
        open={!!viewDetails}
        onClose={() => setViewDetails(null)}
        title="Recommendation Details"
      >
        {viewDetails && (
          <div className="space-y-6 pb-20">
            {/* Section 1: Recommendation Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Recommendation Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <DrawerField label="Product Name" value={<span className="font-semibold text-violet-700">{viewDetails.productName}</span>} />
                </div>
                <DrawerField label="Product Code" value={viewDetails.productCode} />
                <DrawerField label="Status" value={<Badge variant={getStatusVariant(viewDetails.status)}>{viewDetails.status}</Badge>} />
                <DrawerField label="Last Order Date" value={viewDetails.lastOrderDate} />
                <DrawerField label="Last Ordered Quantity" value={viewDetails.lastOrderedQty} />
                <div className="col-span-full">
                  <DrawerField label="Suggested Quantity" value={<span className="font-bold text-slate-900">{viewDetails.suggestedQty}</span>} />
                </div>
              </div>
            </div>

            {/* Section 2: Availability Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Availability Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <DrawerField label="Available Stock" value={<span className={`font-medium ${viewDetails.availability === 'In Stock' ? 'text-emerald-600' : 'text-amber-600'}`}>{viewDetails.availableStock}</span>} />
                <DrawerField label="Last Purchase Frequency" value={viewDetails.purchaseFreq} />
              </div>
            </div>

            {/* Section 3: Recommendation Summary */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Recommendation Summary</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Reason for Recommendation" value={<span className="italic text-slate-700">{viewDetails.reason}</span>} />
              </div>
            </div>

          </div>
        )}
      </Drawer>

      {/* Reorder Modal (Retailer Only) */}
      <Modal
        open={!!reorderItem}
        onClose={() => setReorderItem(null)}
        title="Reorder Product"
      >
        {reorderItem && (
          <div className="space-y-6">
            {/* Product Info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Product</p>
                <p className="text-sm font-bold text-slate-900">{reorderItem.productName} <span className="font-normal text-slate-500">({reorderItem.productCode})</span></p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Last Ordered</p>
                <p className="text-sm font-medium text-slate-800">{reorderItem.lastOrderedQty}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Suggested</p>
                <p className="text-sm font-medium text-slate-800">{reorderItem.suggestedQty}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Availability</p>
                <p className={`text-sm font-medium ${reorderItem.availability === 'In Stock' ? 'text-emerald-600' : 'text-amber-600'}`}>{reorderItem.availability}</p>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reorder Quantity <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="1"
                    value={reorderQty} 
                    onChange={(e) => setReorderQty(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    placeholder="Enter quantity"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Units</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Remarks (Optional)</label>
                <textarea 
                  value={remarks} 
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  placeholder="Any specific instructions"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <ActionButton variant="secondary" onClick={() => setReorderItem(null)}>
                Cancel
              </ActionButton>
              <ActionButton onClick={handleAddToCart}>
                Add To Cart
              </ActionButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}