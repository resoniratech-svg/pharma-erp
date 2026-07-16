import { useState, useRef, useEffect, useMemo } from 'react';
import { Download, Filter, Eye, ChevronDown, Plus, Edit, Trash2 } from 'lucide-react';
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
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { schemeService } from "../../services/schemeService";
import { productService } from "../../services/productService";
import { inventoryService } from "../../services/inventoryService";
import { retailerMasterService } from "../../services/retailerMasterService";
import authService from "../../services/authService";

interface Scheme {
  id: string;
  schemeCode: string;
  schemeName: string;
  schemeType: string;
  applicableTo: string;
  validFrom: string;
  validTo: string;
  status: 'Draft' | 'Active' | 'Upcoming' | 'Expired' | 'Inactive' | 'Cancelled';
  benefit: string;
  product?: string;
  category?: string;
  brand?: string;
  remarks?: string;
}

interface Offer {
  id: string;
  offerCode: string;
  offerName: string;
  offerType: 'Cash Discount' | 'Percentage Discount' | 'Flat Discount' | 'Free Product' | 'Gift' | 'Festival Offer' | 'Target Offer' | 'Loyalty Offer' | 'Volume Offer';
  applicableLevel: 'All Assigned Retailers' | 'Selected Retailers' | 'Retailer Group';
  applicableSelection: string;
  selectedRetailers?: string[];
  applicableProductType: 'Single Product' | 'Multiple Products' | 'Entire Category' | 'Entire Brand' | 'All Visible Products';
  selectedProduct?: string;
  selectedProducts?: string[];
  selectedCategory?: string;
  selectedBrand?: string;
  minOrderValue: number;
  maxBenefit: number;
  offerValue: number;
  priority: 'Low' | 'Medium' | 'High';
  validFrom: string;
  validTo: string;
  status: 'Draft' | 'Scheduled' | 'Active' | 'Expired' | 'Cancelled' | 'Inactive';
  remarks: string;
  distributorCode: string;
  distributorName: string;
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
}

const getDDMMYYYY = (dateStr: string) => {
  if (!dateStr || dateStr === '-') return '-';
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[2].length === 4) return dateStr;
      if (parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
      }
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

const calculateSchemeStatus = (validFrom: string, validTo: string): 'Active' | 'Upcoming' | 'Expired' => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const parseDate = (dStr: string) => {
    if (!dStr) return new Date(NaN);
    if (dStr.includes('-')) {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        } else if (parts[0].length === 4) {
          return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        }
      }
    }
    return new Date(dStr);
  };

  const from = parseDate(validFrom);
  const to = parseDate(validTo);

  if (!isNaN(to.getTime()) && now > to) return 'Expired';
  if (!isNaN(from.getTime()) && now < from) return 'Upcoming';
  return 'Active';
};

const calculateOfferStatus = (validFrom: string, validTo: string, currentStatus: string): Offer['status'] => {
  if (currentStatus === 'Cancelled' || currentStatus === 'Draft' || currentStatus === 'Inactive') {
    return currentStatus as any;
  }
  const today = new Date().toISOString().split('T')[0];
  if (today < validFrom) {
    return 'Scheduled';
  } else if (today > validTo) {
    return 'Expired';
  } else {
    return 'Active';
  }
};

const generateOfferCode = (offers: Offer[]) => {
  if (offers.length === 0) return 'OFF001';
  const numbers = offers.map(o => {
    const num = parseInt(o.offerCode.replace('OFF', ''), 10);
    return isNaN(num) ? 0 : num;
  });
  const maxNum = Math.max(...numbers);
  return `OFF${String(maxNum + 1).padStart(3, '0')}`;
};

export default function Schemes() {
  const [activeTab, setActiveTab] = useState<'schemes' | 'offers'>('schemes');
  const [schemesList, setSchemesList] = useState<Scheme[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [schemeTypeFilter, setSchemeTypeFilter] = useState('');
  const [viewScheme, setViewScheme] = useState<Scheme | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Resolved logged-in distributor context
  const distributorContext = useMemo(() => {
    const user = authService.getCurrentUser();
    const raw = localStorage.getItem('pharma_erp_distributors');
    let fromStorage: any = null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.length > 0) {
          fromStorage = parsed[0];
        }
      } catch (e) {}
    }
    const code = (user as any)?.distributorCode || (user as any)?.employeeCode || fromStorage?.code || fromStorage?.distributorCode || 'DIST-001';
    const name = fromStorage?.name || fromStorage?.distributorName || 'Metro Pharma Distributors';
    const username = user?.fullName || user?.email || 'Distributor Admin';
    const tier = fromStorage?.tier || 'Gold Tier';
    const category = fromStorage?.category || 'Retailer';
    const region = fromStorage?.region || 'West';
    return { code, name, username, tier, category, region };
  }, []);

  const loggedInDistributor = distributorContext;

  // Trade Offers state
  const [offersList, setOffersList] = useState<Offer[]>([]);
  const [offerSearch, setOfferSearch] = useState('');
  const [offerStatusFilter, setOfferStatusFilter] = useState('');
  const [offerTypeFilter, setOfferTypeFilter] = useState('');
  const [offerPriorityFilter, setOfferPriorityFilter] = useState('');
  const [viewOfferDetail, setViewOfferDetail] = useState<Offer | null>(null);
  const [offerFormOpen, setOfferFormOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [deleteConfirmOfferId, setDeleteConfirmOfferId] = useState<string | null>(null);

  // Product Master, Inventory & Retailers lookups
  const [selectableProducts, setSelectableProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // Offer form fields
  const [offerName, setOfferName] = useState('');
  const [offerType, setOfferType] = useState<Offer['offerType']>('Cash Discount');
  const [applicableLevel, setApplicableLevel] = useState<Offer['applicableLevel']>('All Assigned Retailers');
  const [applicableSelection, setApplicableSelection] = useState('');
  const [selectedRetailers, setSelectedRetailers] = useState<string[]>([]);
  const [applicableProductType, setApplicableProductType] = useState<Offer['applicableProductType']>('Single Product');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [maxBenefit, setMaxBenefit] = useState('');
  const [offerValue, setOfferValue] = useState('');
  const [priority, setPriority] = useState<Offer['priority']>('Medium');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [status, setStatus] = useState<Offer['status']>('Draft');
  const [remarks, setRemarks] = useState('');

  // Search filter states for Drawer selections
  const [prodSearchInput, setProdSearchInput] = useState('');
  const [retSearchInput, setRetSearchInput] = useState('');

  const initialOffers: Offer[] = useMemo(() => [
    {
      id: 'o_1',
      offerCode: 'OFF001',
      offerName: 'Monsoon Volume Boost',
      offerType: 'Volume Offer',
      applicableLevel: 'All Assigned Retailers',
      applicableSelection: 'All Visible Products',
      applicableProductType: 'All Visible Products',
      minOrderValue: 25000,
      maxBenefit: 5000,
      offerValue: 10,
      priority: 'High',
      validFrom: '2026-07-01',
      validTo: '2026-07-31',
      status: 'Active',
      remarks: 'Applicable on orders above 25k.',
      distributorCode: distributorContext.code,
      distributorName: distributorContext.name,
      createdBy: 'System',
      createdDate: new Date().toISOString(),
      updatedBy: 'System',
      updatedDate: new Date().toISOString()
    },
    {
      id: 'o_2',
      offerCode: 'OFF002',
      offerName: 'Festival Splendid Discount',
      offerType: 'Festival Offer',
      applicableLevel: 'Selected Retailers',
      applicableSelection: 'Apollo Pharmacy, MedPlus Store',
      selectedRetailers: ['Apollo Pharmacy', 'MedPlus Store'],
      applicableProductType: 'Entire Category',
      selectedCategory: 'General',
      minOrderValue: 10000,
      maxBenefit: 2000,
      offerValue: 500,
      priority: 'Medium',
      validFrom: '2026-08-10',
      validTo: '2026-08-20',
      status: 'Draft',
      remarks: 'Upcoming festival season offer.',
      distributorCode: distributorContext.code,
      distributorName: distributorContext.name,
      createdBy: 'System',
      createdDate: new Date().toISOString(),
      updatedBy: 'System',
      updatedDate: new Date().toISOString()
    }
  ], [distributorContext]);

  // Load visible and active products from inventory & retailer lists
  useEffect(() => {
    const rawProducts = productService.getProducts();
    const allInventory = inventoryService.getAll();
    
    // Filter inventory for logged-in distributor
    const distInv = allInventory.filter(inv => {
      const recordDistCode = inv.warehouseCode || inv.warehouseId;
      if (recordDistCode !== distributorContext.code) return false;
      // Visible To Retailers == true
      const isRetailAvailable = (inv as any).isAvailableForOrdering !== false && (inv as any).visibleToRetailers !== false;
      return isRetailAvailable;
    });

    const activeProdCodes = new Set(distInv.map(inv => inv.productCode));
    const filteredProds = rawProducts.filter(p => p.status === 'Active' && activeProdCodes.has(p.code));

    setSelectableProducts(filteredProds);
    
    const uniqueCats = Array.from(new Set(filteredProds.map(p => p.category).filter(Boolean))) as string[];
    setCategories(uniqueCats);
    
    const uniqueBrands = Array.from(new Set(filteredProds.map(p => p.brandName || p.manufacturer || (p as any).brand).filter(Boolean))) as string[];
    setBrands(uniqueBrands);
  }, [distributorContext]);

  // Resolve retailers assigned to logged-in distributor
  const assignedRetailers = useMemo(() => {
    const allRetailers = retailerMasterService.getAll();
    return allRetailers.filter(r => 
      r.assignedDistributors?.some((d: any) => d.code === distributorContext.code)
    );
  }, [distributorContext]);

  // Sync schemes and offers data
  useEffect(() => {
    const savedData = schemeService.getAll();
    if (savedData && savedData.length > 0) {
      const normalizedData = savedData.map((item: any) => ({
        id: item.id || Date.now().toString(),
        schemeCode: item.schemeCode || '',
        schemeName: item.name || item.schemeName || '',
        schemeType: item.type || item.schemeType || 'Quantity Scheme',
        applicableTo: item.applicableTo || 'All Distributors',
        validFrom: getDDMMYYYY(item.validFrom || ''),
        validTo: getDDMMYYYY(item.validTo || ''),
        status: calculateSchemeStatus(item.validFrom || '', item.validTo || ''),
        benefit: item.benefit || `${item.benefitType || ''} ${item.benefitValue || ''}`.trim() || `Buy ${item.minQuantity || 10} Get ${item.freeQuantity || 1} Free`,
        product: item.applicableSelection || item.product || '',
        category: item.category || '',
        brand: item.brand || '',
        remarks: item.remarks || ''
      }));
      setSchemesList(normalizedData);
    } else {
      setSchemesList([]);
    }

    // Load offers
    const savedOffers = localStorage.getItem('pharma_erp_trade_offers');
    if (savedOffers) {
      setOffersList(JSON.parse(savedOffers));
    } else {
      setOffersList(initialOffers);
      localStorage.setItem('pharma_erp_trade_offers', JSON.stringify(initialOffers));
    }
  }, [initialOffers]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isApplicable = (applicableTo: string) => {
    if (!applicableTo) return true;
    const lower = applicableTo.toLowerCase().trim();
    
    if (['all products', 'product', 'category', 'brand'].includes(lower)) return true;
    
    if (lower === 'all distributors' || lower === 'all') return true;
    if (lower.includes(loggedInDistributor.name.toLowerCase())) return true;
    if (lower.includes(loggedInDistributor.code.toLowerCase())) return true;
    if (lower.includes(loggedInDistributor.tier.toLowerCase())) return true;
    if (lower.includes(loggedInDistributor.category.toLowerCase())) return true;
    if (lower.includes(loggedInDistributor.region.toLowerCase())) return true;
    return false;
  };

  const visibleSchemes = schemesList.filter(item => 
    ['Active', 'Upcoming', 'Expired'].includes(item.status) && isApplicable(item.applicableTo)
  );

  const filteredData = visibleSchemes.filter((item) => {
    const searchLower = search.toLowerCase();
    const matchSearch = item.schemeCode.toLowerCase().includes(searchLower) || item.schemeName.toLowerCase().includes(searchLower);
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    const matchType = schemeTypeFilter ? item.schemeType === schemeTypeFilter : true;
    return matchSearch && matchStatus && matchType;
  });

  // Filter offers list for logged-in distributor with live status calculations
  const visibleOffers = useMemo(() => {
    const list = offersList.filter(o => o.distributorCode === distributorContext.code);
    // Sort by createdDate descending (newest first)
    const sortedList = [...list].sort((a, b) => {
      const timeA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const timeB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return timeB - timeA;
    });
    return sortedList.map(o => ({
      ...o,
      status: calculateOfferStatus(o.validFrom, o.validTo, o.status)
    }));
  }, [offersList, distributorContext]);

  // Apply visual search, status, type, and priority filters
  const filteredOffers = useMemo(() => {
    return visibleOffers.filter((item) => {
      const searchLower = offerSearch.toLowerCase();
      const matchSearch = item.offerCode.toLowerCase().includes(searchLower) || item.offerName.toLowerCase().includes(searchLower);
      const matchStatus = offerStatusFilter ? item.status === offerStatusFilter : true;
      const matchType = offerTypeFilter ? item.offerType === offerTypeFilter : true;
      const matchPriority = offerPriorityFilter ? item.priority === offerPriorityFilter : true;
      return matchSearch && matchStatus && matchType && matchPriority;
    });
  }, [visibleOffers, offerSearch, offerStatusFilter, offerTypeFilter, offerPriorityFilter]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Upcoming':
      case 'Scheduled': return 'info';
      case 'Draft': return 'secondary';
      case 'Expired': return 'warning';
      case 'Inactive': 
      case 'Cancelled': return 'danger';
      default: return 'neutral';
    }
  };

  const getExportData = () => {
    return filteredData.map(item => ({
      'Scheme Code': item.schemeCode,
      'Scheme Name': item.schemeName,
      'Scheme Type': item.schemeType,
      'Applicable Product/Category': item.product || item.category || 'All Products',
      'Benefit': item.benefit,
      'Valid From': item.validFrom,
      'Valid To': item.validTo,
      'Status': item.status
    }));
  };

  const getOfferExportData = () => {
    return filteredOffers.map(o => ({
      'Offer Code': o.offerCode,
      'Offer Name': o.offerName,
      'Offer Type': o.offerType,
      'Applicable To': o.applicableLevel,
      'Offer Value': o.offerValue,
      'Valid From': getDDMMYYYY(o.validFrom),
      'Valid To': getDDMMYYYY(o.validTo),
      'Status': o.status,
      'Priority': o.priority
    }));
  };

  const handleExportExcel = () => {
    if (activeTab === 'schemes') {
      const data = getExportData();
      if (data.length === 0) { setShowExportDropdown(false); return; }
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Schemes");
      XLSX.writeFile(wb, "Schemes_Export.xlsx");
    } else {
      const data = getOfferExportData();
      if (data.length === 0) { setShowExportDropdown(false); return; }
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Trade_Offers");
      XLSX.writeFile(wb, "Trade_Offers_Export.xlsx");
    }
    setShowExportDropdown(false);
  };

  const handleExportCSV = () => {
    const data = activeTab === 'schemes' ? getExportData() : getOfferExportData();
    if (data.length === 0) {
      setShowExportDropdown(false);
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", activeTab === 'schemes' ? "Schemes_Export.csv" : "Trade_Offers_Export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportDropdown(false);
  };

  const handleExportPDF = () => {
    const data = activeTab === 'schemes' ? getExportData() : getOfferExportData();
    if (data.length === 0) {
      setShowExportDropdown(false);
      return;
    }
    const doc = new jsPDF();
    const headers = Object.keys(data[0] || {});
    const body = data.map(obj => headers.map(header => (obj as any)[header]));
    
    doc.text(activeTab === 'schemes' ? "Scheme Visibility Export" : "Trade Offers Export", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237] },
      styles: { fontSize: 8 }
    });
    doc.save(activeTab === 'schemes' ? "Schemes_Export.pdf" : "Trade_Offers_Export.pdf");
    setShowExportDropdown(false);
  };

  const columns: Column<Scheme>[] = [
    { key: 'schemeCode', label: 'Scheme Code', render: (row) => <span className="font-semibold text-violet-750">{row.schemeCode}</span> },
    { key: 'schemeName', label: 'Scheme Name', render: (row) => <span className="font-medium text-slate-800">{row.schemeName}</span> },
    { key: 'schemeType', label: 'Scheme Type', render: (row) => <span className="text-slate-600">{row.schemeType}</span> },
    { key: 'product', label: 'Applicable Product/Category', render: (row) => <span className="text-slate-600">{row.product || row.category || 'All Products'}</span> },
    { key: 'benefit', label: 'Benefit', render: (row) => <span className="text-slate-700 font-medium">{row.benefit}</span> },
    { key: 'validFrom', label: 'Valid From', render: (row) => <span className="text-slate-600">{row.validFrom}</span> },
    { key: 'validTo', label: 'Valid To', render: (row) => <span className="text-slate-600">{row.validTo}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge variant={getStatusVariant(row.status) as any}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewScheme(row)} className="text-slate-400 hover:text-[#163c78] transition-colors p-1" title="View">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // Prevent overlapping Active/Scheduled offers for same products and retailers during overlapping dates
  const checkOverlappingOffers = (
    newOffer: Omit<Offer, 'id' | 'offerCode' | 'status' | 'createdDate' | 'updatedDate'> & { id?: string }
  ) => {
    const activeOffers = offersList.filter(o => 
      o.id !== newOffer.id && 
      (o.status === 'Active' || o.status === 'Scheduled') && 
      o.distributorCode === distributorContext.code
    );

    for (const existing of activeOffers) {
      const datesOverlap = newOffer.validFrom <= existing.validTo && existing.validFrom <= newOffer.validTo;
      if (!datesOverlap) continue;

      let productsOverlap = false;
      if (newOffer.applicableProductType === 'All Visible Products' || existing.applicableProductType === 'All Visible Products') {
        productsOverlap = true;
      } else if (newOffer.applicableProductType === 'Entire Category' && existing.applicableProductType === 'Entire Category') {
        productsOverlap = newOffer.selectedCategory === existing.selectedCategory;
      } else if (newOffer.applicableProductType === 'Entire Brand' && existing.applicableProductType === 'Entire Brand') {
        productsOverlap = newOffer.selectedBrand === existing.selectedBrand;
      } else {
        const getProds = (off: any): string[] => {
          if (off.applicableProductType === 'Single Product') return [off.selectedProduct];
          if (off.applicableProductType === 'Multiple Products') return off.selectedProducts || [];
          if (off.applicableProductType === 'Entire Category') {
            return selectableProducts.filter((p: any) => p.category === off.selectedCategory).map((p: any) => p.code);
          }
          if (off.applicableProductType === 'Entire Brand') {
            return selectableProducts.filter((p: any) => (p.brandName || p.manufacturer || (p as any).brand) === off.selectedBrand).map((p: any) => p.code);
          }
          return [];
        };
        const prodsA = getProds(newOffer);
        const prodsB = getProds(existing);
        productsOverlap = prodsA.some((p: any) => prodsB.includes(p));
      }
      if (!productsOverlap) continue;

      let retailersOverlap = false;
      if (
        newOffer.applicableLevel === 'All Assigned Retailers' || 
        existing.applicableLevel === 'All Assigned Retailers'
      ) {
        retailersOverlap = true;
      } else if (newOffer.applicableLevel === 'Retailer Group' && existing.applicableLevel === 'Retailer Group') {
        retailersOverlap = newOffer.applicableSelection === existing.applicableSelection;
      } else {
        const getRets = (off: any): string[] => {
          if (off.applicableLevel === 'Selected Retailers') return off.selectedRetailers || [];
          return [];
        };
        const retsA = getRets(newOffer);
        const retsB = getRets(existing);
        retailersOverlap = retsA.some((r: any) => retsB.includes(r));
      }

      if (retailersOverlap) {
        return `Overlapping active offer found: "${existing.offerName}" (${existing.offerCode}) targets the same products and retailers during this period.`;
      }
    }
    return null;
  };

  const offerColumns: Column<Offer>[] = [
    { key: 'offerCode', label: 'Offer Code', render: (row) => <span className="font-semibold text-violet-750">{row.offerCode}</span> },
    { key: 'offerName', label: 'Offer Name', render: (row) => <span className="font-medium text-slate-800">{row.offerName}</span> },
    { key: 'offerType', label: 'Offer Type', render: (row) => <span className="text-slate-600">{row.offerType}</span> },
    { key: 'applicableLevel', label: 'Applicable To', render: (row) => <span className="text-slate-600">{row.applicableLevel}</span> },
    { key: 'offerValue', label: 'Offer Value', render: (row) => <span className="font-semibold text-slate-700">{row.offerValue}</span> },
    { key: 'validFrom', label: 'Valid From', render: (row) => <span className="text-slate-600">{getDDMMYYYY(row.validFrom)}</span> },
    { key: 'validTo', label: 'Valid To', render: (row) => <span className="text-slate-600">{getDDMMYYYY(row.validTo)}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge variant={getStatusVariant(row.status) as any}>{row.status}</Badge>,
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => {
        let variant: BadgeVariant = 'neutral';
        if (row.priority === 'High') variant = 'danger';
        else if (row.priority === 'Medium') variant = 'warning';
        else variant = 'success';
        return <Badge variant={variant}>{row.priority}</Badge>;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewOfferDetail(row)} className="text-slate-400 hover:text-[#163c78] transition-colors p-1" title="View Detail">
            <Eye className="w-4 h-4" />
          </button>
          {row.status === 'Active' ? (
            <button onClick={() => handleToggleOfferStatus(row.id, 'Inactive')} className="text-amber-600 hover:text-amber-800 transition-colors text-xs font-semibold px-1" title="Deactivate">
              Deactivate
            </button>
          ) : (
            <button onClick={() => handleToggleOfferStatus(row.id, 'Active')} className="text-emerald-600 hover:text-emerald-800 transition-colors text-xs font-semibold px-1" title="Activate">
              Activate
            </button>
          )}
          <button onClick={() => setDeleteConfirmOfferId(row.id)} className="text-rose-500 hover:text-rose-700 transition-colors p-1" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const handleOpenCreateOffer = () => {
    setEditingOffer(null);
    setOfferName('');
    setOfferType('Cash Discount');
    setApplicableLevel('All Assigned Retailers');
    setApplicableSelection('All');
    setSelectedRetailers([]);
    setApplicableProductType('Single Product');
    setSelectedProduct('');
    setSelectedProducts([]);
    setSelectedCategory('');
    setSelectedBrand('');
    setMinOrderValue('0');
    setMaxBenefit('0');
    setOfferValue('0');
    setPriority('Medium');
    setValidFrom('');
    setValidTo('');
    setStatus('Draft');
    setRemarks('');
    setProdSearchInput('');
    setRetSearchInput('');
    setOfferFormOpen(true);
  };

  const handleOpenEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setOfferName(offer.offerName);
    setOfferType(offer.offerType);
    setApplicableLevel(offer.applicableLevel);
    setApplicableSelection(offer.applicableSelection);
    setSelectedRetailers(offer.selectedRetailers || []);
    setApplicableProductType(offer.applicableProductType);
    setSelectedProduct(offer.selectedProduct || '');
    setSelectedProducts(offer.selectedProducts || []);
    setSelectedCategory(offer.selectedCategory || '');
    setSelectedBrand(offer.selectedBrand || '');
    setMinOrderValue(String(offer.minOrderValue));
    setMaxBenefit(String(offer.maxBenefit));
    setOfferValue(String(offer.offerValue));
    setPriority(offer.priority);
    setValidFrom(offer.validFrom);
    setValidTo(offer.validTo);
    setStatus(offer.status as any);
    setRemarks(offer.remarks);
    setProdSearchInput('');
    setRetSearchInput('');
    setOfferFormOpen(true);
  };

  const handleSaveOffer = (e: React.FormEvent) => {
    e.preventDefault();

    if (!offerName.trim()) {
      alert('Offer Name is required.');
      return;
    }
    if (!offerType) {
      alert('Offer Type is required.');
      return;
    }
    if (!validFrom) {
      alert('Valid From date is required.');
      return;
    }
    if (!validTo) {
      alert('Valid To date is required.');
      return;
    }
    if (validTo <= validFrom) {
      alert('Valid To date must be greater than Valid From date.');
      return;
    }

    const val = Number(offerValue);
    if (isNaN(val) || val < 0) {
      alert('Offer Value cannot be negative.');
      return;
    }

    const minVal = Number(minOrderValue);
    if (isNaN(minVal) || minVal < 0) {
      alert('Min Order Value cannot be negative.');
      return;
    }

    const maxVal = Number(maxBenefit);
    if (isNaN(maxVal) || maxVal < 0) {
      alert('Maximum Benefit cannot be negative.');
      return;
    }

    // Check duplicate active offer with same name
    const computedNewStatus = calculateOfferStatus(validFrom, validTo, status);
    if (computedNewStatus === 'Active' || computedNewStatus === 'Scheduled') {
      const duplicateName = offersList.some(o => 
        o.id !== (editingOffer?.id || '') && 
        o.offerName.toLowerCase().trim() === offerName.toLowerCase().trim() && 
        o.distributorCode === distributorContext.code &&
        (o.status === 'Active' || o.status === 'Scheduled')
      );
      if (duplicateName) {
        alert('An active or scheduled offer with the same name already exists.');
        return;
      }
    }

    // Check overlap validation
    const targetOfferData = {
      id: editingOffer?.id,
      offerName,
      offerType,
      applicableLevel,
      applicableSelection: applicableLevel === 'All Assigned Retailers' ? 'All' : applicableSelection,
      selectedRetailers,
      applicableProductType,
      selectedProduct,
      selectedProducts,
      selectedCategory,
      selectedBrand,
      minOrderValue: minVal,
      maxBenefit: maxVal,
      offerValue: val,
      priority,
      validFrom,
      validTo,
      remarks,
      distributorCode: distributorContext.code,
      distributorName: distributorContext.name,
      createdBy: editingOffer?.createdBy || distributorContext.username,
      createdDate: editingOffer?.createdDate || new Date().toISOString()
    };

    const overlapError = checkOverlappingOffers(targetOfferData as any);
    if (overlapError) {
      alert(overlapError);
      return;
    }

    let updatedList = [...offersList];
    const timestamp = new Date().toISOString();
    
    if (editingOffer) {
      updatedList = updatedList.map(o => {
        if (o.id === editingOffer.id) {
          return {
            ...o,
            offerName,
            offerType,
            applicableLevel,
            applicableSelection: applicableLevel === 'All Assigned Retailers' ? 'All' : applicableSelection,
            selectedRetailers,
            applicableProductType,
            selectedProduct,
            selectedProducts,
            selectedCategory,
            selectedBrand,
            minOrderValue: minVal,
            maxBenefit: maxVal,
            offerValue: val,
            priority,
            validFrom,
            validTo,
            status: computedNewStatus,
            remarks,
            updatedBy: distributorContext.username,
            updatedDate: timestamp
          };
        }
        return o;
      });
    } else {
      const newCode = generateOfferCode(offersList);
      const newOffer: Offer = {
        id: Date.now().toString(),
        offerCode: newCode,
        offerName,
        offerType,
        applicableLevel,
        applicableSelection: applicableLevel === 'All Assigned Retailers' ? 'All' : applicableSelection,
        selectedRetailers,
        applicableProductType,
        selectedProduct,
        selectedProducts,
        selectedCategory,
        selectedBrand,
        minOrderValue: minVal,
        maxBenefit: maxVal,
        offerValue: val,
        priority,
        validFrom,
        validTo,
        status: computedNewStatus,
        remarks,
        distributorCode: distributorContext.code,
        distributorName: distributorContext.name,
        createdBy: distributorContext.username,
        createdDate: timestamp,
        updatedBy: distributorContext.username,
        updatedDate: timestamp
      };
      updatedList.unshift(newOffer);
    }

    setOffersList(updatedList);
    localStorage.setItem('pharma_erp_trade_offers', JSON.stringify(updatedList));
    setOfferFormOpen(false);
  };

  const handleToggleOfferStatus = (id: string, newStatus: 'Active' | 'Inactive') => {
    const updated = offersList.map(o => {
      if (o.id === id) {
        const computedStatus = newStatus === 'Active' ? calculateOfferStatus(o.validFrom, o.validTo, 'Active') : 'Inactive';
        return { 
          ...o, 
          status: computedStatus as any,
          updatedBy: distributorContext.username,
          updatedDate: new Date().toISOString()
        };
      }
      return o;
    });
    setOffersList(updated);
    localStorage.setItem('pharma_erp_trade_offers', JSON.stringify(updated));
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmOfferId) return;
    const updated = offersList.filter(o => o.id !== deleteConfirmOfferId);
    setOffersList(updated);
    localStorage.setItem('pharma_erp_trade_offers', JSON.stringify(updated));
    setDeleteConfirmOfferId(null);
  };

  // Filter lists inside dropdown selectors
  const filteredSearchProducts = useMemo(() => {
    return selectableProducts.filter((p: any) => 
      p.name.toLowerCase().includes(prodSearchInput.toLowerCase()) || 
      p.code.toLowerCase().includes(prodSearchInput.toLowerCase())
    );
  }, [selectableProducts, prodSearchInput]);

  const filteredSearchRetailers = useMemo(() => {
    return assignedRetailers.filter((r: any) => 
      r.name.toLowerCase().includes(retSearchInput.toLowerCase()) || 
      r.code.toLowerCase().includes(retSearchInput.toLowerCase())
    );
  }, [assignedRetailers, retSearchInput]);

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Commercial Management"
        subtitle="Manage product schemes eligibility and trade promotions visibility."
        actions={
          <div className="flex items-center gap-2">
            <div className="relative" ref={dropdownRef}>
              <ActionButton 
                variant="secondary" 
                icon={<Download className="w-4 h-4" />} 
                onClick={() => setShowExportDropdown(!showExportDropdown)}
              >
                Export List <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
              </ActionButton>
              
              {showExportDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-10 animate-in slide-in-from-top-2">
                  <div className="p-1">
                    <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-750 rounded transition-colors">
                      Export as Excel (.xlsx)
                    </button>
                    <button onClick={handleExportCSV} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-750 rounded transition-colors">
                      Export as CSV (.csv)
                    </button>
                    <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 rounded transition-colors">
                      Export as PDF (.pdf)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {activeTab === 'offers' && (
              <ActionButton 
                icon={<Plus className="w-4 h-4" />} 
                onClick={handleOpenCreateOffer}
              >
                Create Offer
              </ActionButton>
            )}
          </div>
        }
      />

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('schemes')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'schemes'
              ? 'border-[#163c78] text-[#163c78]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Product Schemes
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'offers'
              ? 'border-[#163c78] text-[#163c78]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Trade Offers
        </button>
      </div>

      {activeTab === 'schemes' ? (
        <>
          <FilterBar>
            <SearchInput 
              value={search} 
              onChange={setSearch} 
              placeholder="Search scheme or code..." 
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
                { label: 'All Statuses', value: '' },
                { label: 'Draft', value: 'Draft' },
                { label: 'Scheduled', value: 'Scheduled' },
                { label: 'Active', value: 'Active' },
                { label: 'Expired', value: 'Expired' },
                { label: 'Cancelled', value: 'Cancelled' },
                { label: 'Inactive', value: 'Inactive' },
              ]}
              placeholder="All Status"
            />
            <SelectFilter
              value={schemeTypeFilter}
              onChange={setSchemeTypeFilter}
              options={[
                { label: 'All Types', value: '' },
                { label: 'Quantity Scheme', value: 'Quantity Scheme' },
                { label: 'Bonus Scheme', value: 'Bonus Scheme' },
                { label: 'Cash Discount (CD)', value: 'Cash Discount (CD)' },
                { label: 'Target Scheme', value: 'Target Scheme' },
              ]}
              placeholder="All Types"
            />
          </FilterBar>

          <TableCard>
            <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
              <DataTable
                columns={columns}
                data={filteredData}
                onRowClick={setViewScheme}
                emptyMessage="No Active Schemes Available"
              />
            </div>
          </TableCard>
        </>
      ) : (
        <>
          <FilterBar>
            <SearchInput 
              value={offerSearch} 
              onChange={setOfferSearch} 
              placeholder="Search offer name or code..." 
            />
            <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Filters:</span>
            </div>
            <SelectFilter
              value={offerStatusFilter}
              onChange={setOfferStatusFilter}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Draft', value: 'Draft' },
                { label: 'Scheduled', value: 'Scheduled' },
                { label: 'Active', value: 'Active' },
                { label: 'Expired', value: 'Expired' },
                { label: 'Cancelled', value: 'Cancelled' },
              ]}
              placeholder="All Statuses"
            />
            <SelectFilter
              value={offerTypeFilter}
              onChange={setOfferTypeFilter}
              options={[
                { label: 'All Types', value: '' },
                { label: 'Cash Discount', value: 'Cash Discount' },
                { label: 'Percentage Discount', value: 'Percentage Discount' },
                { label: 'Flat Discount', value: 'Flat Discount' },
                { label: 'Free Product', value: 'Free Product' },
                { label: 'Gift', value: 'Gift' },
                { label: 'Festival Offer', value: 'Festival Offer' },
                { label: 'Target Offer', value: 'Target Offer' },
                { label: 'Loyalty Offer', value: 'Loyalty Offer' },
                { label: 'Volume Offer', value: 'Volume Offer' },
              ]}
              placeholder="All Types"
            />
            <SelectFilter
              value={offerPriorityFilter}
              onChange={setOfferPriorityFilter}
              options={[
                { label: 'All Priorities', value: '' },
                { label: 'Low', value: 'Low' },
                { label: 'Medium', value: 'Medium' },
                { label: 'High', value: 'High' },
              ]}
              placeholder="All Priorities"
            />
          </FilterBar>

          <TableCard>
            <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
              <DataTable
                columns={offerColumns}
                data={filteredOffers}
                onRowClick={setViewOfferDetail}
                emptyMessage="No Trade Offers Available"
              />
            </div>
          </TableCard>
        </>
      )}

      {/* Product Scheme detail drawer */}
      <Drawer
        open={viewScheme !== null}
        onClose={() => setViewScheme(null)}
        title="Scheme Details"
      >
        {viewScheme && (
          <div className="space-y-6 pb-20">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Scheme Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Scheme Code" value={<span className="font-semibold">{viewScheme.schemeCode}</span>} />
                <DrawerField label="Scheme Name" value={<span className="font-semibold text-slate-900">{viewScheme.schemeName}</span>} />
                <DrawerField label="Scheme Type" value={viewScheme.schemeType} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Applicability</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Product" value={viewScheme.product || 'All Applicable'} />
                <DrawerField label="Category" value={viewScheme.category || '-'} />
                <DrawerField label="Brand" value={viewScheme.brand || '-'} />
                <DrawerField label="Applicable To" value={<span className="font-medium text-slate-800">{viewScheme.applicableTo}</span>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Benefit Details</h3>
              <div className="bg-[#163c78]/10 rounded-xl p-4 border border-violet-100 text-center py-6">
                <div className="text-sm text-[#163c78] font-medium mb-1">Benefit</div>
                <div className="text-xl text-[#081529] font-bold">{viewScheme.benefit}</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Validity</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Valid From" value={viewScheme.validFrom} />
                <DrawerField label="Valid To" value={viewScheme.validTo} />
                <DrawerField label="Status" value={<Badge variant={getStatusVariant(viewScheme.status) as any}>{viewScheme.status}</Badge>} />
              </div>
            </div>

            {viewScheme.remarks && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Remarks</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-sm text-slate-700">{viewScheme.remarks}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Trade Offer detail drawer */}
      <Drawer
        open={viewOfferDetail !== null}
        onClose={() => setViewOfferDetail(null)}
        title="Offer Details"
      >
        {viewOfferDetail && (
          <div className="space-y-6 pb-20">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Offer Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Offer Code" value={<span className="font-semibold">{viewOfferDetail.offerCode}</span>} />
                <DrawerField label="Offer Name" value={<span className="font-semibold text-slate-900">{viewOfferDetail.offerName}</span>} />
                <DrawerField label="Offer Type" value={viewOfferDetail.offerType} />
                <DrawerField label="Offer Value" value={String(viewOfferDetail.offerValue)} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Applicable Products</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Applicable Level" value={viewOfferDetail.applicableProductType} />
                <DrawerField label="Selection / Details" value={viewOfferDetail.applicableSelection || 'All Visible Products'} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Applicable Retailers</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Retailer Limit" value={viewOfferDetail.applicableLevel} />
                <DrawerField label="Min Order Value" value={`₹ ${viewOfferDetail.minOrderValue.toLocaleString()}`} />
                <DrawerField label="Max Benefit" value={`₹ ${viewOfferDetail.maxBenefit.toLocaleString()}`} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Validity</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Valid From" value={getDDMMYYYY(viewOfferDetail.validFrom)} />
                <DrawerField label="Valid To" value={getDDMMYYYY(viewOfferDetail.validTo)} />
                <DrawerField label="Status" value={<Badge variant={getStatusVariant(viewOfferDetail.status) as any}>{viewOfferDetail.status}</Badge>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Priority</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Priority Level" value={viewOfferDetail.priority} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Audit Details</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Created By" value={viewOfferDetail.createdBy} />
                <DrawerField label="Created Date" value={getDDMMYYYY(viewOfferDetail.createdDate)} />
                <DrawerField label="Updated By" value={viewOfferDetail.updatedBy} />
                <DrawerField label="Updated Date" value={getDDMMYYYY(viewOfferDetail.updatedDate)} />
                <DrawerField label="Distributor Code" value={viewOfferDetail.distributorCode} />
                <DrawerField label="Distributor Name" value={viewOfferDetail.distributorName} />
              </div>
            </div>

            {viewOfferDetail.remarks && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Remarks</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-sm text-slate-700">{viewOfferDetail.remarks}</p>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 mt-4">
              <ActionButton
                onClick={() => {
                  handleOpenEditOffer(viewOfferDetail);
                  setViewOfferDetail(null);
                }}
                icon={<Edit className="w-4 h-4" />}
              >
                Edit Offer
              </ActionButton>
              <ActionButton variant="secondary" onClick={() => setViewOfferDetail(null)}>
                Close
              </ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* Trade Offer Form Modal */}
      {offerFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setOfferFormOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-900">{editingOffer ? "Edit Trade Offer" : "Create New Trade Offer"}</h2>
              <button onClick={() => setOfferFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors outline-none">✕</button>
            </div>
            
            <form onSubmit={handleSaveOffer} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-8">
                {/* SECTION 1: BASIC DETAILS */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Offer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Offer Name *</label>
                      <input 
                        type="text" 
                        required
                        value={offerName} 
                        onChange={e => setOfferName(e.target.value)} 
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-[#163c78] text-sm"
                        placeholder="e.g. Festival Discount 2026"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Offer Type *</label>
                      <select
                        value={offerType}
                        onChange={e => setOfferType(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-[#163c78] text-sm bg-white"
                      >
                        <option value="Cash Discount">Cash Discount</option>
                        <option value="Percentage Discount">Percentage Discount</option>
                        <option value="Flat Discount">Flat Discount</option>
                        <option value="Free Product">Free Product</option>
                        <option value="Gift">Gift</option>
                        <option value="Festival Offer">Festival Offer</option>
                        <option value="Target Offer">Target Offer</option>
                        <option value="Loyalty Offer">Loyalty Offer</option>
                        <option value="Volume Offer">Volume Offer</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: TARGET SELECTION */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Target Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Left Column: Product Targeting */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Applicable Product Target Level *</label>
                        <select
                          value={applicableProductType}
                          onChange={e => {
                            const val = e.target.value as any;
                            setApplicableProductType(val);
                            if (val === 'All Visible Products') {
                              setApplicableSelection('All Visible Products');
                            } else {
                              setApplicableSelection('');
                            }
                          }}
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-[#163c78] text-sm bg-white"
                        >
                          <option value="Single Product">Single Product</option>
                          <option value="Multiple Products">Multiple Products</option>
                          <option value="Entire Category">Entire Category</option>
                          <option value="Entire Brand">Entire Brand</option>
                          <option value="All Visible Products">All Visible Products</option>
                        </select>
                      </div>

                      {applicableProductType === 'Single Product' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Product *</label>
                          <input 
                            type="text" 
                            value={prodSearchInput} 
                            onChange={e => setProdSearchInput(e.target.value)} 
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-[#163c78] text-sm mb-2"
                            placeholder="Search products..."
                          />
                          <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white space-y-1">
                            {filteredSearchProducts.map((p: any) => (
                              <label key={p.code} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded text-sm cursor-pointer">
                                <input 
                                  type="radio" 
                                  name="selectedProduct"
                                  checked={selectedProduct === p.code}
                                  onChange={() => {
                                    setSelectedProduct(p.code);
                                    setApplicableSelection(p.name);
                                  }}
                                  className="text-[#163c78] focus:ring-[#163c78]"
                                />
                                <span>{p.name} ({p.code})</span>
                              </label>
                            ))}
                            {filteredSearchProducts.length === 0 && <div className="text-xs text-slate-500 p-2">No products found</div>}
                          </div>
                        </div>
                      )}

                      {applicableProductType === 'Multiple Products' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Multiple Products *</label>
                          <input 
                            type="text" 
                            value={prodSearchInput} 
                            onChange={e => setProdSearchInput(e.target.value)} 
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-[#163c78] text-sm mb-2"
                            placeholder="Search products..."
                          />
                          <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white space-y-1">
                            {filteredSearchProducts.map((p: any) => (
                              <label key={p.code} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded text-sm cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={selectedProducts.includes(p.code)}
                                  onChange={(e) => {
                                    let updated = [...selectedProducts];
                                    if (e.target.checked) {
                                      updated.push(p.code);
                                    } else {
                                      updated = updated.filter(code => code !== p.code);
                                    }
                                    setSelectedProducts(updated);
                                    setApplicableSelection(updated.join(', '));
                                  }}
                                  className="text-[#163c78] focus:ring-[#163c78] rounded"
                                />
                                <span>{p.name} ({p.code})</span>
                              </label>
                            ))}
                            {filteredSearchProducts.length === 0 && <div className="text-xs text-slate-500 p-2">No products found</div>}
                          </div>
                        </div>
                      )}

                      {applicableProductType === 'Entire Category' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Category *</label>
                          <select
                            value={selectedCategory}
                            onChange={e => {
                              setSelectedCategory(e.target.value);
                              setApplicableSelection(e.target.value);
                            }}
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-[#163c78] text-sm bg-white"
                          >
                            <option value="">-- Choose Category --</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      )}

                      {applicableProductType === 'Entire Brand' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Brand *</label>
                          <select
                            value={selectedBrand}
                            onChange={e => {
                              setSelectedBrand(e.target.value);
                              setApplicableSelection(e.target.value);
                            }}
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-[#163c78] text-sm bg-white"
                          >
                            <option value="">-- Choose Brand --</option>
                            {brands.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Retailer Targeting */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Applicable Retailer Target Level *</label>
                        <select
                          value={applicableLevel}
                          onChange={e => {
                            const val = e.target.value as any;
                            setApplicableLevel(val);
                            if (val === 'All Assigned Retailers') {
                              setApplicableSelection('All Assigned Retailers');
                            } else {
                              setApplicableSelection('');
                            }
                          }}
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-[#163c78] text-sm bg-white"
                        >
                          <option value="All Assigned Retailers">All Assigned Retailers</option>
                          <option value="Selected Retailers">Selected Retailers</option>
                          <option value="Retailer Group">Retailer Group</option>
                        </select>
                      </div>

                      {applicableLevel === 'Selected Retailers' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Retailers *</label>
                          <input 
                            type="text" 
                            value={retSearchInput} 
                            onChange={e => setRetSearchInput(e.target.value)} 
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-[#163c78] text-sm mb-2"
                            placeholder="Search retailers..."
                          />
                          <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white space-y-1">
                            {filteredSearchRetailers.map((r: any) => (
                              <label key={r.code} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded text-sm cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={selectedRetailers.includes(r.code)}
                                  onChange={(e) => {
                                    let updated = [...selectedRetailers];
                                    if (e.target.checked) {
                                      updated.push(r.code);
                                    } else {
                                      updated = updated.filter(code => code !== r.code);
                                    }
                                    setSelectedRetailers(updated);
                                    setApplicableSelection(updated.join(', '));
                                  }}
                                  className="text-[#163c78] focus:ring-[#163c78] rounded"
                                />
                                <span>{r.name} ({r.code})</span>
                              </label>
                            ))}
                            {filteredSearchRetailers.length === 0 && <div className="text-xs text-slate-500 p-2">No assigned retailers found</div>}
                          </div>
                        </div>
                      )}

                      {applicableLevel === 'Retailer Group' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Retailer Group Name *</label>
                          <input 
                            type="text" 
                            value={applicableSelection} 
                            onChange={e => setApplicableSelection(e.target.value)} 
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-[#163c78] text-sm"
                            placeholder="e.g. Chain Pharmacies"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 3: LIMITS & VALIDITY */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Value, Limits & Validity</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Offer Value *</label>
                      <input 
                        type="number" 
                        required
                        value={offerValue} 
                        onChange={e => setOfferValue(e.target.value)} 
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-[#163c78] text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Priority *</label>
                      <select
                        value={priority}
                        onChange={e => setPriority(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-[#163c78] text-sm bg-white"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Min Order Value (₹)</label>
                      <input 
                        type="number" 
                        value={minOrderValue} 
                        onChange={e => setMinOrderValue(e.target.value)} 
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-[#163c78] text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Max Benefit (₹)</label>
                      <input 
                        type="number" 
                        value={maxBenefit} 
                        onChange={e => setMaxBenefit(e.target.value)} 
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-[#163c78] text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Valid From *</label>
                      <input 
                        type="date" 
                        required
                        value={validFrom} 
                        onChange={e => setValidFrom(e.target.value)} 
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-[#163c78] text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Valid To *</label>
                      <input 
                        type="date" 
                        required
                        value={validTo} 
                        onChange={e => setValidTo(e.target.value)} 
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-[#163c78] text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status *</label>
                      <select
                        value={status}
                        onChange={e => setStatus(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-[#163c78] text-sm bg-white"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Remarks</label>
                      <textarea 
                        value={remarks} 
                        onChange={e => setRemarks(e.target.value)} 
                        rows={2}
                        className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-[#163c78] text-sm"
                        placeholder="Enter internal offer remarks"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl shrink-0">
                <button 
                  type="button" 
                  onClick={() => setOfferFormOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-650 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-[#163c78] text-white rounded-lg hover:bg-[#0c1f3d] transition-colors"
                >
                  {editingOffer ? "Save Changes" : "Create Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmOfferId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setDeleteConfirmOfferId(null)}
            ></div>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                  <Trash2 className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Trade Offer?</h3>
                <p className="text-sm text-slate-500">
                  Are you sure you want to delete this Trade Offer? This action cannot be undone and it will be permanently removed from the system.
                </p>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmOfferId(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm shadow-rose-600/20 transition-all active:scale-95"
                >
                  Delete Offer
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
  );
}