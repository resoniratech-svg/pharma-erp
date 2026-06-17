import { useState, useRef, useEffect } from 'react';
import { Download, Filter, Eye, ChevronDown } from 'lucide-react';
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
import { ROLE_SUPER_ADMIN, ROLE_RETAILER } from '../../constants/roles';

interface Offer {
  id: string;
  offerCode: string;
  offerName: string;
  type: string;
  applicableTo: 'Product' | 'Brand' | 'Category' | 'All Products';
  productName?: string;
  category?: string;
  brand?: string;
  validFrom: string;
  validTill: string;
  status: 'Active' | 'Upcoming' | 'Expired';
  description: string;
  promotionDetails: string;
  terms: string;
}

const mockData: Offer[] = [
  { 
    id: '1', offerCode: 'OFF-WINTER', offerName: 'Winter Stock Up', type: 'Seasonal Offer', 
    applicableTo: 'Category', category: 'Respiratory', 
    validFrom: '01 Nov 2026', validTill: '31 Jan 2027', status: 'Upcoming',
    description: 'Special winter stock up promotion for all respiratory products.',
    promotionDetails: 'Buy 50 boxes of any respiratory product, get 5 boxes free.',
    terms: 'Applicable only for single invoice purchases. Cannot be combined with other offers.'
  },
  { 
    id: '2', offerCode: 'OFF-LAUNCH', offerName: 'New Launch Promo', type: 'Launch Offer', 
    applicableTo: 'Product', productName: 'Amoxicillin 500mg', 
    validFrom: '15 Sep 2026', validTill: '15 Oct 2026', status: 'Expired',
    description: 'Introductory offer for the new Amoxicillin 500mg packaging.',
    promotionDetails: 'Flat 10% extra scheme on all orders.',
    terms: 'Valid only for the first 100 orders.'
  },
  { 
    id: '3', offerCode: 'OFF-FESTIVAL', offerName: 'Diwali Dhamaka', type: 'Festival Offer', 
    applicableTo: 'All Products', 
    validFrom: '10 Oct 2026', validTill: '05 Nov 2026', status: 'Active',
    description: 'Diwali special volume-based offer across the entire catalog.',
    promotionDetails: 'Order value above ₹50,000 gets an assured silver coin.',
    terms: 'Gift distribution post-scheme completion. Returns will be deducted from calculation.'
  },
  { 
    id: '4', offerCode: 'OFF-BONUS', offerName: 'Quarter End Bonus', type: 'Product Bonus', 
    applicableTo: 'Brand', brand: 'Cipla', 
    validFrom: '01 Oct 2026', validTill: '31 Dec 2026', status: 'Active',
    description: 'End of quarter volume bonus for Cipla products.',
    promotionDetails: 'Buy 100 strips, get 15 strips free.',
    terms: 'Scheme applied automatically at cart checkout.'
  },
];

export default function Offers() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_RETAILER;
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  const [viewOffer, setViewOffer] = useState<Offer | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Retailers can only view Active offers. Admins can view all.
  const roleFilteredData = activeRole === ROLE_RETAILER 
    ? mockData.filter(item => item.status === 'Active')
    : mockData;

  const filteredData = roleFilteredData.filter((item) => {
    const searchStr = search.toLowerCase();
    const matchSearch = item.offerCode.toLowerCase().includes(searchStr) || item.offerName.toLowerCase().includes(searchStr);
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    const matchType = typeFilter ? item.type === typeFilter : true;
    return matchSearch && matchStatus && matchType;
  });

  const getStatusVariant = (status: string): BadgeVariant => {
    if (status === 'Active') return 'success';
    if (status === 'Upcoming') return 'info';
    return 'neutral';
  };

  const columns: Column<Offer>[] = [
    { key: 'offerCode', label: 'Offer Code', render: (row) => <span className="font-semibold text-violet-700">{row.offerCode}</span> },
    { key: 'offerName', label: 'Offer Name', render: (row) => <span className="font-semibold text-slate-900">{row.offerName}</span> },
    { key: 'applicableTo', label: 'Applicable To', render: (row) => <span className="text-slate-600">{row.applicableTo}</span> },
    { key: 'validTill', label: 'Valid Till', render: (row) => <span className="text-slate-600">{row.validTill}</span> },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewOffer(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const getExportData = () => {
    return filteredData.map(item => ({
      'Offer Code': item.offerCode,
      'Offer Name': item.offerName,
      'Applicable To': item.applicableTo,
      'Valid Till': item.validTill,
      'Status': item.status
    }));
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Offers");
    XLSX.writeFile(wb, "Offer_Visibility.xlsx");
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Offer_Visibility.csv";
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const data = getExportData();
    const doc = new jsPDF();
    const headers = Object.keys(data[0] || {});
    const body = data.map(obj => headers.map(header => (obj as any)[header]));
    
    doc.text("Offer Visibility", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237] },
      styles: { fontSize: 9 }
    });
    doc.save("Offer_Visibility.pdf");
    setShowExportMenu(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Offer Visibility"
        subtitle={activeRole === ROLE_SUPER_ADMIN ? "View all trade offers, cash discounts, and bonus deals." : "View active trade offers, cash discounts, and bonus deals for retailers."}
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export Offers <ChevronDown className="w-3 h-3 ml-1" />
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
        <SearchInput value={search} onChange={setSearch} placeholder="Search offer code or name..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { label: 'Seasonal Offer', value: 'Seasonal Offer' },
            { label: 'Launch Offer', value: 'Launch Offer' },
            { label: 'Festival Offer', value: 'Festival Offer' },
            { label: 'Product Bonus', value: 'Product Bonus' },
          ]}
          placeholder="All Types"
        />
        {activeRole === ROLE_SUPER_ADMIN && (
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: 'Active', value: 'Active' },
              { label: 'Upcoming', value: 'Upcoming' },
              { label: 'Expired', value: 'Expired' },
            ]}
            placeholder="All Status"
          />
        )}
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No offers found matching your search or filters."
          />
        </div>
      </TableCard>

      <Drawer
        open={!!viewOffer}
        onClose={() => setViewOffer(null)}
        title="Offer Details"
      >
        {viewOffer && (
          <div className="space-y-6 pb-20">
            {/* Section 1: Offer Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Offer Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Offer Code" value={<span className="font-semibold text-violet-700">{viewOffer.offerCode}</span>} />
                <DrawerField label="Offer Name" value={<span className="font-semibold text-slate-900">{viewOffer.offerName}</span>} />
                <DrawerField label="Offer Type" value={viewOffer.type} />
                <DrawerField label="Status" value={<Badge variant={getStatusVariant(viewOffer.status)}>{viewOffer.status}</Badge>} />
              </div>
            </div>

            {/* Section 2: Applicability */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Applicability</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Applicable To" value={<span className="font-medium text-slate-800">{viewOffer.applicableTo}</span>} />
                {viewOffer.applicableTo === 'Product' && <DrawerField label="Product Name" value={viewOffer.productName} />}
                {viewOffer.applicableTo === 'Category' && <DrawerField label="Category" value={viewOffer.category} />}
                {viewOffer.applicableTo === 'Brand' && <DrawerField label="Brand" value={viewOffer.brand} />}
              </div>
            </div>

            {/* Section 3: Validity */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Validity</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Valid From" value={viewOffer.validFrom} />
                <DrawerField label="Valid Till" value={<span className="font-medium text-slate-800">{viewOffer.validTill}</span>} />
              </div>
            </div>

            {/* Section 4: Offer Description */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Offer Description</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                  <p className="text-sm text-slate-900 leading-relaxed">{viewOffer.description}</p>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Promotion Details</label>
                  <p className="text-sm text-emerald-700 font-medium leading-relaxed">{viewOffer.promotionDetails}</p>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Terms & Conditions</label>
                  <p className="text-sm text-slate-600 leading-relaxed italic">{viewOffer.terms}</p>
                </div>
              </div>
            </div>
            
          </div>
        )}
      </Drawer>
    </div>
  );
}
