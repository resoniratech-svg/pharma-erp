import { useState, useRef, useEffect } from 'react';
import { Plus, Download, Filter, Eye, ChevronDown } from 'lucide-react';
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
import { type Column } from './components/shared';
import { ROLE_SUPER_ADMIN } from '../../constants/roles';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Import the shared schemeService just like in SchemeManagement
import { schemeService } from "../../services/schemeService";

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
}

const fallbackMockData: Scheme[] = [
  { 
    id: '1', 
    schemeCode: 'SCH-OCT-10', 
    schemeName: 'Buy 10 Get 1 Free (Amoxicillin)', 
    schemeType: 'Quantity Scheme',
    applicableTo: 'All Distributors',
    validFrom: '2026-10-01',
    validTo: '2026-10-31', 
    status: 'Active',
    benefit: 'Buy 10 Get 1 Free',
    product: 'Amoxicillin 250mg',
    category: 'Antibiotics',
    brand: 'Amoxil'
  },
  { 
    id: '2', 
    schemeCode: 'SCH-FEST-5', 
    schemeName: 'Diwali 5% Additional CD', 
    schemeType: 'Cash Discount (CD)',
    applicableTo: 'Gold Tier',
    validFrom: '2026-10-15',
    validTo: '2026-11-05', 
    status: 'Upcoming',
    benefit: 'Additional 5% CD',
    category: 'All Products'
  },
  { 
    id: '3', 
    schemeCode: 'SCH-SEP-2', 
    schemeName: 'Quarter End Q2 Target Bonus', 
    schemeType: 'Target Scheme',
    applicableTo: 'All Distributors',
    validFrom: '2026-09-15',
    validTo: '2026-09-30', 
    status: 'Expired',
    benefit: 'Quarter Target Bonus',
    category: 'All Products'
  },
];

export default function Schemes() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;

  const [schemesList, setSchemesList] = useState<Scheme[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewScheme, setViewScheme] = useState<Scheme | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Create Scheme Modal State (Admin Only)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newScheme, setNewScheme] = useState({
    schemeCode: 'SCH-AUTO-GEN',
    schemeName: '',
    schemeType: 'Quantity Scheme',
    applicableTo: 'All Distributors',
    validFrom: '',
    validTo: '',
    productCategory: '',
    product: '',
    brand: '',
    buyQuantity: '',
    freeQuantity: '',
    discountPercentage: '',
    bonusProduct: '',
    bonusQuantity: '',
    targetValue: '',
    bonusAmount: '',
    remarks: ''
  });

  // Load dynamically from schemeService on mount
  useEffect(() => {
    const savedData = schemeService.getAll();
    if (savedData && savedData.length > 0) {
      // Map properties to adapt differences between fields (name vs schemeName, etc.)
      const normalizedData = savedData.map((item: any) => ({
        id: item.id || Date.now().toString(),
        schemeCode: item.schemeCode || '',
        schemeName: item.name || item.schemeName || '',
        schemeType: item.type || item.schemeType || 'Quantity Scheme',
        applicableTo: item.applicableTo || 'All Distributors',
        validFrom: item.validFrom || '',
        validTo: item.validTo || '',
        status: item.status || 'Active',
        benefit: item.benefit || `${item.benefitType || ''} ${item.benefitValue || ''}`.trim() || `Buy ${item.minQuantity || 10} Get ${item.freeQuantity || 1} Free`,
        product: item.applicableSelection || item.product || '',
        category: item.category || '',
        brand: item.brand || ''
      }));
      setSchemesList(normalizedData);
    } else {
      setSchemesList(fallbackMockData);
      schemeService.saveAll(fallbackMockData);
    }
  }, [showCreateModal]); // Refresh state when modal closes/submits

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle publishing a new scheme from this module directly into the service
  const handlePublishScheme = () => {
    if (!newScheme.schemeName || !newScheme.validFrom || !newScheme.validTo) {
      alert("Please fill out the mandatory fields.");
      return;
    }

    let dynamicBenefit = 'Promotional Offer';
    if (newScheme.schemeType === 'Quantity Scheme') {
      dynamicBenefit = `Buy ${newScheme.buyQuantity || 10} Get ${newScheme.freeQuantity || 1} Free`;
    } else if (newScheme.schemeType === 'Cash Discount Scheme') {
      dynamicBenefit = `Additional ${newScheme.discountPercentage || 0}% CD`;
    } else if (newScheme.schemeType === 'Bonus Scheme') {
      dynamicBenefit = `${newScheme.bonusQuantity || 1}x ${newScheme.bonusProduct || 'Bonus'}`;
    } else if (newScheme.schemeType === 'Target Scheme') {
      dynamicBenefit = `Target Bonus Setup`;
    }

    const createdRecord: any = {
      id: Date.now().toString(),
      schemeCode: `SCH-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newScheme.schemeName,
      type: newScheme.schemeType,
      applicableTo: newScheme.applicableTo,
      applicableSelection: newScheme.product || newScheme.brand || newScheme.productCategory || 'All Products',
      benefitType: newScheme.schemeType,
      benefitValue: newScheme.discountPercentage || newScheme.freeQuantity || 'Configured',
      minQuantity: newScheme.buyQuantity || '',
      freeQuantity: newScheme.freeQuantity || '',
      validFrom: newScheme.validFrom,
      validTo: newScheme.validTo,
      remarks: newScheme.remarks,
      status: 'Active'
    };

    const currentSaved = schemeService.getAll();
    const updatedCollection = [createdRecord, ...currentSaved];
    schemeService.saveAll(updatedCollection);
    
    setShowCreateModal(false);
  };

  const filteredData = schemesList.filter((item) => {
    const searchLower = search.toLowerCase();
    const matchSearch = item.schemeCode.toLowerCase().includes(searchLower) || item.schemeName.toLowerCase().includes(searchLower);
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Upcoming': return 'info';
      case 'Draft': return 'secondary';
      case 'Expired': return 'warning';
      case 'Inactive': 
      case 'Cancelled': return 'danger';
      default: return 'neutral';
    }
  };

  // ----- EXPORT LOGIC -----
  const getExportData = () => {
    if (activeRole === ROLE_SUPER_ADMIN) {
      return filteredData.map(item => ({
        'Scheme Code': item.schemeCode,
        'Scheme Name': item.schemeName,
        'Scheme Type': item.schemeType,
        'Applicable To': item.applicableTo,
        'Valid From': item.validFrom,
        'Valid To': item.validTo,
        'Status': item.status
      }));
    } else {
      return filteredData.map(item => ({
        'Scheme Code': item.schemeCode,
        'Scheme Name': item.schemeName,
        'Benefit': item.benefit,
        'Validity': `${item.validFrom} - ${item.validTo}`,
        'Status': item.status
      }));
    }
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schemes");
    XLSX.writeFile(wb, "Schemes_Export.xlsx");
    setShowExportDropdown(false);
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Schemes_Export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportDropdown(false);
  };

  const handleExportPDF = () => {
    const data = getExportData();
    const doc = new jsPDF();
    const headers = Object.keys(data[0] || {});
    const body = data.map(obj => headers.map(header => (obj as any)[header]));
    
    doc.text("Scheme Visibility Export", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237] },
      styles: { fontSize: 8 }
    });
    doc.save("Schemes_Export.pdf");
    setShowExportDropdown(false);
  };

  // ----- COLUMNS -----
  const adminColumns: Column<Scheme>[] = [
    { key: 'schemeCode', label: 'Scheme Code', render: (row) => <span className="font-semibold text-violet-700">{row.schemeCode}</span> },
    { key: 'schemeName', label: 'Scheme Name', render: (row) => <span className="font-medium text-slate-800">{row.schemeName}</span> },
    { key: 'schemeType', label: 'Scheme Type', render: (row) => <span className="text-slate-600">{row.schemeType}</span> },
    { key: 'applicableTo', label: 'Applicable To', render: (row) => <span className="text-slate-600">{row.applicableTo}</span> },
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
          <button onClick={() => setViewScheme(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const distributorColumns: Column<Scheme>[] = [
    { key: 'schemeCode', label: 'Scheme Code', render: (row) => <span className="font-semibold text-violet-700">{row.schemeCode}</span> },
    { key: 'schemeName', label: 'Scheme Name', render: (row) => <span className="font-medium text-slate-800">{row.schemeName}</span> },
    { key: 'benefit', label: 'Benefit', render: (row) => <span className="text-slate-700 font-medium">{row.benefit}</span> },
    { key: 'validFrom', label: 'Validity', render: (row) => <span className="text-slate-600">{row.validFrom} &rarr; {row.validTo}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge variant={getStatusVariant(row.status) as any}>{row.status}</Badge>,
    }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Scheme Visibility"
        subtitle={activeRole === ROLE_SUPER_ADMIN ? "Manage trade offers, cash discounts (CD), and bonus schemes globally." : "View active and upcoming schemes applicable to your account."}
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
                    <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 rounded transition-colors">
                      Export as Excel (.xlsx)
                    </button>
                    <button onClick={handleExportCSV} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 rounded transition-colors">
                      Export as CSV (.csv)
                    </button>
                    <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 rounded transition-colors">
                      Export as PDF (.pdf)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {activeRole === ROLE_SUPER_ADMIN && (
              <ActionButton icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
                Create Scheme
              </ActionButton>
            )}
          </div>
        }
      />

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
          options={activeRole === ROLE_SUPER_ADMIN ? [
            { label: 'Draft', value: 'Draft' },
            { label: 'Active', value: 'Active' },
            { label: 'Upcoming', value: 'Upcoming' },
            { label: 'Expired', value: 'Expired' },
            { label: 'Inactive', value: 'Inactive' },
          ] : [
            { label: 'Active', value: 'Active' },
            { label: 'Upcoming', value: 'Upcoming' },
            { label: 'Expired', value: 'Expired' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          {activeRole === ROLE_SUPER_ADMIN ? (
            <DataTable
              columns={adminColumns}
              data={filteredData}
              onRowClick={setViewScheme}
              emptyMessage="No schemes found."
            />
          ) : (
            <DataTable
              columns={distributorColumns}
              data={filteredData}
              onRowClick={setViewScheme}
              emptyMessage="No schemes found."
            />
          )}
        </div>
      </TableCard>

      {/* Admin Create Scheme Modal */}
      {showCreateModal && activeRole === ROLE_SUPER_ADMIN && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Create Scheme
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">A. Scheme Information</h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Scheme Code (Auto Generated)</label>
                <input disabled value={newScheme.schemeCode} className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-slate-500" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Scheme Name</label>
                <input value={newScheme.schemeName} onChange={e => setNewScheme({...newScheme, schemeName: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="e.g. Diwali Bonus 10%" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Scheme Type</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white" value={newScheme.schemeType} onChange={e => setNewScheme({...newScheme, schemeType: e.target.value})}>
                  <option value="Quantity Scheme">Quantity Scheme</option>
                  <option value="Cash Discount Scheme">Cash Discount Scheme</option>
                  <option value="Bonus Scheme">Bonus Scheme</option>
                  <option value="Target Scheme">Target Scheme</option>
                </select>
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">B. Product Applicability</h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Product Category</label>
                <input value={newScheme.productCategory} onChange={e => setNewScheme({...newScheme, productCategory: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="e.g. Antibiotics" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Brand</label>
                <input value={newScheme.brand} onChange={e => setNewScheme({...newScheme, brand: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="e.g. Amoxil" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Product (Optional)</label>
                <input value={newScheme.product} onChange={e => setNewScheme({...newScheme, product: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="Select specific product..." />
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">C. Benefit Configuration</h3>
              </div>

              {newScheme.schemeType === 'Quantity Scheme' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Buy Quantity</label>
                    <input type="number" value={newScheme.buyQuantity} onChange={e => setNewScheme({...newScheme, buyQuantity: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Free Quantity</label>
                    <input type="number" value={newScheme.freeQuantity} onChange={e => setNewScheme({...newScheme, freeQuantity: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                  </div>
                </>
              )}

              {newScheme.schemeType === 'Cash Discount Scheme' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Discount Percentage (%)</label>
                  <input type="number" value={newScheme.discountPercentage} onChange={e => setNewScheme({...newScheme, discountPercentage: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                </div>
              )}

              {newScheme.schemeType === 'Bonus Scheme' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bonus Product</label>
                    <input value={newScheme.bonusProduct} onChange={e => setNewScheme({...newScheme, bonusProduct: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bonus Quantity</label>
                    <input type="number" value={newScheme.bonusQuantity} onChange={e => setNewScheme({...newScheme, bonusQuantity: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                  </div>
                </>
              )}

              {newScheme.schemeType === 'Target Scheme' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Target Value</label>
                    <input type="number" value={newScheme.targetValue} onChange={e => setNewScheme({...newScheme, targetValue: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bonus Amount</label>
                    <input type="number" value={newScheme.bonusAmount} onChange={e => setNewScheme({...newScheme, bonusAmount: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                  </div>
                </>
              )}

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">D. Eligibility</h3>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Applicable To</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white" value={newScheme.applicableTo} onChange={e => setNewScheme({...newScheme, applicableTo: e.target.value})}>
                  <option value="All Distributors">All Distributors</option>
                  <option value="Gold Tier">Gold Tier</option>
                  <option value="Silver Tier">Silver Tier</option>
                  <option value="Specific Distributor">Specific Distributor</option>
                </select>
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">E. Validity</h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Valid From</label>
                <input type="date" value={newScheme.validFrom} onChange={e => setNewScheme({...newScheme, validFrom: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Valid To</label>
                <input type="date" value={newScheme.validTo} onChange={e => setNewScheme({...newScheme, validTo: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">F. Remarks</h3>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Internal Notes</label>
                <input value={newScheme.remarks} onChange={e => setNewScheme({...newScheme, remarks: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>

            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <ActionButton variant="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </ActionButton>
              <ActionButton variant="secondary" onClick={() => setShowCreateModal(false)}>
                Save Draft
              </ActionButton>
              <ActionButton onClick={handlePublishScheme}>
                Publish Scheme
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* View Drawer */}
      <Drawer
        open={viewScheme !== null}
        onClose={() => setViewScheme(null)}
        title="Scheme Details"
      >
        {viewScheme && (
          <div className="space-y-6 pb-20">
            {activeRole === ROLE_SUPER_ADMIN ? (
              <>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Scheme Information</h3>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <DrawerField label="Scheme Code" value={<span className="font-semibold">{viewScheme.schemeCode}</span>} />
                    <DrawerField label="Scheme Name" value={viewScheme.schemeName} />
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
                  <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                    <DrawerField label="Benefit Configuration" value={<span className="text-violet-800 font-semibold">{viewScheme.benefit}</span>} />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Validity & Status</h3>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <DrawerField label="Valid From" value={viewScheme.validFrom} />
                    <DrawerField label="Valid To" value={viewScheme.validTo} />
                    <DrawerField label="Current Status" value={<Badge variant={getStatusVariant(viewScheme.status) as any}>{viewScheme.status}</Badge>} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Scheme Information</h3>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <DrawerField label="Scheme Name" value={<span className="font-semibold text-slate-900">{viewScheme.schemeName}</span>} />
                    <DrawerField label="Scheme Code" value={viewScheme.schemeCode} />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Benefit Details</h3>
                  <div className="bg-violet-50 rounded-xl p-4 border border-violet-100 text-center py-6">
                    <div className="text-sm text-violet-600 font-medium mb-1">Your Benefit</div>
                    <div className="text-xl text-violet-900 font-bold">{viewScheme.benefit}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Applicable Products</h3>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <DrawerField label="Product" value={viewScheme.product || 'All Applicable'} />
                    <DrawerField label="Category" value={viewScheme.category || '-'} />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Validity & Status</h3>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <DrawerField label="Valid From" value={viewScheme.validFrom} />
                    <DrawerField label="Valid To" value={viewScheme.validTo} />
                    <DrawerField label="Status" value={<Badge variant={getStatusVariant(viewScheme.status) as any}>{viewScheme.status}</Badge>} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}