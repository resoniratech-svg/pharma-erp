import { useState, useRef, useEffect, useMemo } from 'react';
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

import { retailerMasterService } from "../../services/retailerMasterService";
import authService from "../../services/authService";

export default function Offers() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  const [viewOffer, setViewOffer] = useState<any | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [allOffers, setAllOffers] = useState<any[]>([]);

  useEffect(() => {
    const data = localStorage.getItem('pharma_erp_trade_offers');
    if (data) {
      try {
        setAllOffers(JSON.parse(data));
      } catch (e) {
        setAllOffers([]);
      }
    } else {
      const defaultOffers = [
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
          distributorCode: 'DIST-001',
          distributorName: 'Metro Pharma Distributors',
          createdBy: 'System',
          createdDate: new Date().toISOString()
        },
        {
          id: 'o_2',
          offerCode: 'OFF003',
          offerName: 'Special Pharmacist Discount',
          offerType: 'Discount Offer',
          applicableLevel: 'All Assigned Retailers',
          applicableSelection: 'All Visible Products',
          applicableProductType: 'All Visible Products',
          minOrderValue: 5000,
          maxBenefit: 1000,
          offerValue: 5,
          priority: 'Medium',
          validFrom: '2026-07-01',
          validTo: '2026-07-31',
          status: 'Active',
          remarks: 'Applicable on orders above 5k.',
          distributorCode: 'DIST-001',
          distributorName: 'Metro Pharma Distributors',
          createdBy: 'System',
          createdDate: new Date().toISOString()
        }
      ];
      setAllOffers(defaultOffers);
      localStorage.setItem('pharma_erp_trade_offers', JSON.stringify(defaultOffers));
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const user = authService.getCurrentUser();

  const userRetailerContext = useMemo(() => {
    if (!user) return null;
    const retailerMasterList = retailerMasterService.getAll();
    
    return retailerMasterList.find(r => {
      const uId = String(user.id || '').trim().toLowerCase();
      const uEmpCode = String(user.employeeCode || '').trim().toLowerCase();
      const uUsername = String((user as any).username || '').trim().toLowerCase();
      const uEmail = String(user.email || '').trim().toLowerCase();
      const uName = String(user.fullName || '').trim().toLowerCase();

      const rId = String(r.id || '').trim().toLowerCase();
      const rCode = String(r.code || '').trim().toLowerCase();
      const rEmail = String(r.emailAddress || '').trim().toLowerCase();
      const rName = String(r.name || '').trim().toLowerCase();

      if (rId && uId && rId === uId) return true;
      if (rCode && (rCode === uId || rCode === uEmpCode || rCode === uUsername)) return true;
      if (rEmail && uEmail && rEmail === uEmail) return true;
      if (rName && uName && rName === uName) return true;
      return false;
    });
  }, [user]);

  const assignedDistributors = useMemo(() => {
    if (!user) return [];

    if (userRetailerContext && userRetailerContext.assignedDistributors && userRetailerContext.assignedDistributors.length > 0) {
      return userRetailerContext.assignedDistributors;
    }

    const distCode = user.linkedDistributorCode || (user as any).distributorCode;
    if (distCode) {
      return [{ code: distCode, name: 'Assigned Distributor' }];
    }

    const roleIdUpper = String(user.roleId || '').toUpperCase();
    if (roleIdUpper === 'RETAILER') {
      return [{ code: 'DIST-001', name: 'Metro Pharma Distributors' }];
    }

    if (user.roleId === 'Super Admin' || user.roleId === 'Admin' || user.roleId === 'Distributor' || user.roleId === 'MR') {
      const uniqueDistCodes = Array.from(new Set(allOffers.map((o: any) => o.distributorCode).filter(Boolean)));
      return uniqueDistCodes.map(code => ({ code, name: `Distributor ${code}` }));
    }

    return [];
  }, [user, userRetailerContext, allOffers]);

  const validDistributorCodes = useMemo(() => {
    return assignedDistributors
      .map((d: any) => {
        if (typeof d === 'string') return d.trim().toLowerCase();
        if (d && d.code) return String(d.code).trim().toLowerCase();
        return null;
      })
      .filter(Boolean);
  }, [assignedDistributors]);

  const parseDate = (dStr: string) => {
    if (!dStr) return new Date(NaN);
    if (dStr.includes('-')) {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        if (parts[2].length === 4) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        if (parts[0].length === 4) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }
    return new Date(dStr);
  };

  const activeOffers = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return allOffers.filter(offer => {
      if (offer.status !== 'Active') return false;
      
      const from = parseDate(offer.validFrom);
      const to = parseDate(offer.validTo);
      if (!isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
      }
      
      if (!isNaN(from.getTime()) && today < from) return false;
      if (!isNaN(to.getTime()) && today > to) return false;

      const oDistCode = String(offer.distributorCode || '').trim().toLowerCase();
      if (validDistributorCodes.length === 0 || !validDistributorCodes.includes(oDistCode)) {
        return false;
      }

      if (offer.applicableLevel === 'Selected Retailers') {
        const sel = (offer.selectedRetailers || []).map((s: string) => String(s).trim().toLowerCase());
        const rCode = String(userRetailerContext?.code || '').trim().toLowerCase();
        const rName = String(userRetailerContext?.name || '').trim().toLowerCase();
        const uId = String(user?.id || '').trim().toLowerCase();
        
        const isSelected = (rCode && sel.includes(rCode)) || 
                           (rName && sel.includes(rName)) || 
                           (uId && sel.includes(uId));
                           
        if (!isSelected) {
          return false;
        }
      } else if (offer.applicableLevel === 'Retailer Group') {
        const ctx = userRetailerContext as any;
        const retailerCat = String(ctx?.category || ctx?.retailerCategory || ctx?.group || '').trim().toLowerCase();
        const targetGroup = String(offer.applicableSelection || '').trim().toLowerCase();
        if (targetGroup && retailerCat !== targetGroup) return false;
      }

      return true;
    });
  }, [allOffers, validDistributorCodes, userRetailerContext, user]);

  const filteredData = activeOffers.filter((item) => {
    const searchStr = search.toLowerCase();
    const matchSearch = (item.offerCode || '').toLowerCase().includes(searchStr) || (item.offerName || '').toLowerCase().includes(searchStr);
    const matchType = typeFilter ? item.offerType === typeFilter : true;
    return matchSearch && matchType;
  });

  const getStatusVariant = (status: string): BadgeVariant => {
    if (status === 'Active') return 'success';
    if (status === 'Upcoming') return 'info';
    return 'neutral';
  };

  const getDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };

  const columns: Column<any>[] = [
    { key: 'offerCode', label: 'Offer Code', render: (row) => <span className="font-semibold text-violet-700">{row.offerCode}</span> },
    { key: 'offerName', label: 'Offer Name', render: (row) => <span className="font-semibold text-slate-900">{row.offerName}</span> },
    { key: 'offerType', label: 'Offer Type', render: (row) => <span className="text-slate-600">{row.offerType}</span> },
    { key: 'validTo', label: 'Valid Till', render: (row) => <span className="text-slate-600">{getDDMMYYYY(row.validTo)}</span> },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewOffer(row)} className="text-slate-400 hover:text-[#163c78] transition-colors p-1" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const getExportData = () => {
    return filteredData.map(item => ({
      'Distributor Name': item.distributorName || '-',
      'Distributor Code': item.distributorCode || '-',
      'Offer Code': item.offerCode || '-',
      'Offer Name': item.offerName || '-',
      'Offer Type': item.offerType || '-',
      'Valid From': getDDMMYYYY(item.validFrom),
      'Valid Till': getDDMMYYYY(item.validTo),
      'Status': item.status || '-'
    }));
  };

  const handleExportExcel = () => {
    const data = getExportData();
    if(data.length === 0) {
      setShowExportMenu(false);
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Offers");
    XLSX.writeFile(wb, "Offer_Visibility.xlsx");
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const data = getExportData();
    if(data.length === 0) {
      setShowExportMenu(false);
      return;
    }
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
    if(data.length === 0) {
      setShowExportMenu(false);
      return;
    }
    const doc = new jsPDF('p', 'mm', 'a4');
    const headers = Object.keys(data[0] || {});
    const body = data.map(obj => headers.map(header => (obj as any)[header]));
    
    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 60, 120);
    doc.text('MJ HEALTHCARE ERP', 14, 18);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text('Trade Offer & Scheme Visibility Report', 14, 25);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, 14, 31);

    autoTable(doc, {
      startY: 36,
      head: [headers],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [22, 60, 120], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      margin: { left: 14, right: 14 }
    });
    doc.save("Offer_Visibility.pdf");
    setShowExportMenu(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Offer Visibility"
        subtitle="View active trade offers, promotional schemes, and bonus deals currently available for your purchases."
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
                <DrawerField label="Distributor Name" value={viewOffer.distributorName || '-'} />
                <DrawerField label="Distributor Code" value={viewOffer.distributorCode || '-'} />
                <DrawerField label="Offer Code" value={<span className="font-semibold text-violet-700">{viewOffer.offerCode}</span>} />
                <DrawerField label="Offer Name" value={<span className="font-semibold text-slate-900">{viewOffer.offerName}</span>} />
                <DrawerField label="Offer Type" value={viewOffer.offerType} />
                <DrawerField label="Status" value={<Badge variant={getStatusVariant(viewOffer.status)}>{viewOffer.status}</Badge>} />
              </div>
            </div>

            {/* Section 2: Applicability */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Applicability</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Applicable Level" value={<span className="font-medium text-slate-800">{viewOffer.applicableProductType}</span>} />
                
                {viewOffer.applicableProductType === 'Single Product' && <DrawerField label="Applicable Products" value={viewOffer.selectedProduct} />}
                {viewOffer.applicableProductType === 'Multiple Products' && <DrawerField label="Applicable Products" value={viewOffer.selectedProducts?.join(', ')} />}
                {viewOffer.applicableProductType === 'Entire Category' && <DrawerField label="Applicable Categories" value={viewOffer.selectedCategory} />}
                {viewOffer.applicableProductType === 'Entire Brand' && <DrawerField label="Applicable Brands" value={viewOffer.selectedBrand} />}
                
                <DrawerField label="Applicable Retailers" value={viewOffer.applicableLevel === 'All Assigned Retailers' ? 'All Assigned Retailers' : viewOffer.applicableSelection} />
              </div>
            </div>

            {/* Section 3: Benefit Details */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Benefit Details</h3>
              <div className="bg-[#163c78]/10 rounded-xl p-4 border border-violet-100 text-center py-6">
                <div className="text-sm text-[#163c78] font-medium mb-1">Offer Value / Benefit</div>
                <div className="text-xl text-[#081529] font-bold">{viewOffer.offerValue || '-'}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mt-4">
                <DrawerField label="Minimum Order Value" value={`₹ ${(viewOffer.minOrderValue || 0).toLocaleString()}`} />
                <DrawerField label="Maximum Benefit" value={`₹ ${(viewOffer.maxBenefit || 0).toLocaleString()}`} />
                <DrawerField label="Priority" value={viewOffer.priority || '-'} />
              </div>
            </div>

            {/* Section 4: Validity */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Validity</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Valid From" value={getDDMMYYYY(viewOffer.validFrom)} />
                <DrawerField label="Valid To" value={<span className="font-medium text-slate-800">{getDDMMYYYY(viewOffer.validTo)}</span>} />
              </div>
            </div>

            {/* Section 5: Offer Description / Remarks */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Offer Description</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
                <div className="pt-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Remarks</label>
                  <p className="text-sm text-slate-900 leading-relaxed">{viewOffer.remarks || '-'}</p>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Terms & Conditions</label>
                  <p className="text-sm text-slate-600 leading-relaxed italic">{viewOffer.terms || 'Applicable as per standard distributor terms.'}</p>
                </div>
              </div>
            </div>
            
          </div>
        )}
      </Drawer>
    </div>
  );
}