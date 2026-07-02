import { useState, useMemo, useRef, useEffect } from 'react';
import { Download, ChevronDown, Printer, FileText, Eye, Plus, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

// --- Types ---
type CommissionStatus = 'Calculated' | 'Approved' | 'Paid';

interface CommissionEntry {
  id: string;
  repCode: string;
  role: string;
  repName: string;
  month: string;
  salesAchieved: number;
  commissionRate: number;
  commissionAmount: number;
  status: CommissionStatus;
  
  // Extended details for View Drawer
  territory: string;
  commissionFormula: string;
  approvedBy?: string;
  approvalDate?: string;
  paymentDate?: string;
  createdBy: string;
  createdDate: string;
  lastUpdated: string;
  remarks?: string;
}

// --- Mock Data ---
const mockData: CommissionEntry[] = [
  {
    id: '1', repCode: 'MR001', role: 'MR', repName: 'Rahul Verma', month: 'Oct 2026', 
    salesAchieved: 845000, commissionRate: 2.5, commissionAmount: 21125, status: 'Calculated',
    territory: 'Mumbai South', commissionFormula: 'Sales Achieved * 2.5%',
    createdBy: 'System', createdDate: '2026-11-01 10:00 AM', lastUpdated: '2026-11-01 10:00 AM'
  },
  {
    id: '2', repCode: 'AM002', role: 'Area Manager', repName: 'Amit Singh', month: 'Sep 2026', 
    salesAchieved: 1200000, commissionRate: 3.0, commissionAmount: 36000, status: 'Paid',
    territory: 'Pune East', commissionFormula: 'Sales Achieved * 3.0%',
    approvedBy: 'Rohan Sharma', approvalDate: '2026-10-05 02:30 PM', paymentDate: '2026-10-07',
    createdBy: 'System', createdDate: '2026-10-01 10:00 AM', lastUpdated: '2026-10-07 11:15 AM'
  },
  {
    id: '3', repCode: 'RM003', role: 'Regional Manager', repName: 'Priya Desai', month: 'Oct 2026', 
    salesAchieved: 1550000, commissionRate: 3.5, commissionAmount: 54250, status: 'Approved',
    territory: 'Gujarat', commissionFormula: 'Sales Achieved * 3.5%',
    createdBy: 'System', createdDate: '2026-11-01 10:00 AM', lastUpdated: '2026-11-02 09:45 AM'
  },
  {
    id: '4', repCode: 'MR004', role: 'MR', repName: 'Sanjay Kumar', month: 'Sep 2026', 
    salesAchieved: 450000, commissionRate: 2.0, commissionAmount: 9000, status: 'Approved',
    territory: 'Navi Mumbai', commissionFormula: 'Sales Achieved * 2.0%',
    approvedBy: 'Rohan Sharma', approvalDate: '2026-10-05 02:40 PM',
    createdBy: 'System', createdDate: '2026-10-01 10:00 AM', lastUpdated: '2026-10-05 02:40 PM'
  },
  {
    id: '5', repCode: 'DST001', role: 'Distributor', repName: 'Apex Distributors', month: 'Aug 2026', 
    salesAchieved: 950000, commissionRate: 2.5, commissionAmount: 23750, status: 'Calculated',
    territory: 'Ahmedabad', commissionFormula: 'Sales Achieved * 2.5%',
    createdBy: 'System', createdDate: '2026-09-01 10:00 AM', lastUpdated: '2026-09-02 11:20 AM'
  }
];

// Reference Data for Dropdowns
const roles = ['MR', 'Distributor', 'Stockist', 'Retailer', 'Sales Executive', 'Area Manager', 'Regional Manager'];

const mockPersonsByRole: Record<string, { code: string, name: string, baseSales: number }[]> = {
  'MR': [
    { code: 'MR001', name: 'Rahul Verma', baseSales: 845000 },
    { code: 'MR004', name: 'Sanjay Kumar', baseSales: 450000 },
    { code: 'MR007', name: 'Vikas Shah', baseSales: 620000 },
  ],
  'Distributor': [
    { code: 'DST001', name: 'Apex Distributors', baseSales: 950000 },
    { code: 'DST002', name: 'Global Pharma Logistics', baseSales: 1500000 },
  ],
  'Stockist': [
    { code: 'STK001', name: 'SuperStockist Inc.', baseSales: 3000000 },
  ],
  'Retailer': [
    { code: 'RET001', name: 'Apollo Pharmacy', baseSales: 120000 },
    { code: 'RET002', name: 'MedPlus Store', baseSales: 85000 },
  ],
  'Sales Executive': [
    { code: 'SE001', name: 'Rajesh Mehta', baseSales: 550000 },
  ],
  'Area Manager': [
    { code: 'AM002', name: 'Amit Singh', baseSales: 1200000 },
  ],
  'Regional Manager': [
    { code: 'RM003', name: 'Priya Desai', baseSales: 1550000 },
  ]
};

const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const yearsList = ['2026', '2025', '2024'];

export default function Commission() {
  const [data, setData] = useState<CommissionEntry[]>(mockData);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // UI State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [selectedRep, setSelectedRep] = useState<CommissionEntry | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [formRole, setFormRole] = useState('');
  const [formPersonCode, setFormPersonCode] = useState('');
  const [formMonth, setFormMonth] = useState('Oct');
  const [formYear, setFormYear] = useState('2026');
  const [formRate, setFormRate] = useState('');
  const [formRemarks, setFormRemarks] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Derived Form Data & Handlers ---
  // When role changes, reset person
  useEffect(() => {
    setFormPersonCode('');
  }, [formRole]);

  const personsOptions = formRole ? (mockPersonsByRole[formRole] || []) : [];
  const selectedPersonObj = personsOptions.find(p => p.code === formPersonCode);

  const formSalesAchieved = selectedPersonObj ? selectedPersonObj.baseSales : 0;
  const parsedRate = parseFloat(formRate) || 0;
  const formCommissionAmount = (formSalesAchieved * parsedRate) / 100;

  const handleSaveCommission = () => {
    if (!formRole || !formPersonCode || !formMonth || !formYear || parsedRate <= 0) {
      alert("Please fill all mandatory fields.");
      return;
    }
    
    const newEntry: CommissionEntry = {
      id: Math.random().toString(),
      repCode: formPersonCode,
      role: formRole,
      repName: selectedPersonObj?.name || 'Unknown',
      month: `${formMonth} ${formYear}`,
      salesAchieved: formSalesAchieved,
      commissionRate: parsedRate,
      commissionAmount: formCommissionAmount,
      status: 'Calculated',
      territory: 'On Record',
      commissionFormula: `Sales Achieved * ${parsedRate}%`,
      createdBy: 'Current User',
      createdDate: new Date().toLocaleString(),
      lastUpdated: new Date().toLocaleString(),
      remarks: formRemarks
    };
    
    setData([newEntry, ...data]);
    setShowCreateModal(false);
    
    // Reset
    setFormRole('');
    setFormPersonCode('');
    setFormMonth('Oct');
    setFormYear('2026');
    setFormRate('');
    setFormRemarks('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const filteredData = useMemo(() => {
    return data.filter(row => {
      if (search) {
        const query = search.toLowerCase();
        if (!row.repName.toLowerCase().includes(query) && 
            !row.repCode.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (roleFilter && row.role !== roleFilter) return false;
      if (monthFilter && row.month !== monthFilter) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      return true;
    });
  }, [data, search, roleFilter, monthFilter, statusFilter]);

  const uniqueMonths = Array.from(new Set(data.map(d => d.month)));
  const uniqueStatuses = Array.from(new Set(data.map(d => d.status)));

  const columns: Column<CommissionEntry>[] = [
    { key: 'repCode', label: 'Rep Code' },
    { key: 'role', label: 'Role' },
    { key: 'repName', label: 'Rep Name', render: (row) => <span className="font-semibold text-slate-900">{row.repName}</span> },
    { key: 'month', label: 'Month' },
    { key: 'salesAchieved', label: 'Sales Achieved', render: (row) => formatCurrency(row.salesAchieved) },
    { key: 'commissionRate', label: 'Commission Rate', render: (row) => `${row.commissionRate.toFixed(1)}%` },
    { key: 'commissionAmount', label: 'Commission Amount', render: (row) => <span className="font-bold text-violet-700">{formatCurrency(row.commissionAmount)}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: BadgeVariant = 'neutral';
        if (row.status === 'Paid') variant = 'success';
        else if (row.status === 'Approved') variant = 'info';
        else if (row.status === 'Calculated') variant = 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <div className="flex justify-end">
          <ActionButton variant="ghost" onClick={() => setSelectedRep(row)} className="text-slate-400 hover:text-violet-600 px-2 py-1 flex items-center gap-1">
            <Eye className="w-4 h-4" /> <span className="text-xs hidden lg:inline">View</span>
          </ActionButton>
        </div>
      )
    }
  ];

  // --- Exports ---
  const handleExportExcel = () => {
    const dataToExport = filteredData.map(row => ({
      'Rep Code': row.repCode,
      'Role': row.role,
      'Rep Name': row.repName,
      'Month': row.month,
      'Sales Achieved': row.salesAchieved,
      'Commission Rate (%)': row.commissionRate,
      'Commission Amount': row.commissionAmount,
      'Status': row.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Commissions');
    XLSX.writeFile(workbook, `Commissions_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportMenu(false);
  };

  const generatePDFDoc = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text(`Commission System Report`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 22);

    const pdfTableData = filteredData.map(row => [
      row.repCode, row.role, row.repName, row.month, formatCurrency(row.salesAchieved), `${row.commissionRate.toFixed(1)}%`, formatCurrency(row.commissionAmount), row.status
    ]);

    (doc as any).autoTable({
      startY: 30,
      head: [['Rep Code', 'Role', 'Rep Name', 'Month', 'Sales Achieved', 'Rate', 'Amount', 'Status']],
      body: pdfTableData,
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237] },
      styles: { fontSize: 10, cellPadding: 5 }
    });
    return doc;
  };

  const handleExportPDF = () => {
    const doc = generatePDFDoc();
    doc.save(`Commissions_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  const handlePrintReport = () => {
    const doc = generatePDFDoc();
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
    setShowExportMenu(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Commission System"
        subtitle="Calculate and manage sales commissions for Medical Representatives and Partners."
        actions={
          <div className="flex items-center gap-3">
            <ActionButton 
              variant="primary" 
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              Create Commission
            </ActionButton>
            
            <div className="relative" ref={exportMenuRef}>
              <ActionButton 
                variant="secondary" 
                icon={<Download className="w-4 h-4" />}
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2"
              >
                Export <ChevronDown className="w-4 h-4" />
              </ActionButton>
              
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                  <button 
                    onClick={handleExportExcel}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Export Excel
                  </button>
                  <button 
                    onClick={handleExportPDF}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> Export PDF
                  </button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button 
                    onClick={handlePrintReport}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" /> Print Report
                  </button>
                </div>
              )}
            </div>
          </div>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by Rep Code or Name..." />
        <SelectFilter
          value={roleFilter}
          onChange={setRoleFilter}
          options={roles.map(r => ({ label: r, value: r }))}
          placeholder="All Roles"
        />
        <SelectFilter
          value={monthFilter}
          onChange={setMonthFilter}
          options={uniqueMonths.map(m => ({ label: m, value: m }))}
          placeholder="All Months"
        />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={uniqueStatuses.map(s => ({ label: s, value: s }))}
          placeholder="All Statuses"
        />
      </FilterBar>

      <TableCard>
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No commission records found."
          />
        </div>
      </TableCard>

      {/* View Drawer */}
      <Drawer
        open={selectedRep !== null}
        onClose={() => setSelectedRep(null)}
        title="Commission Details"
      >
        {selectedRep && (
          <div className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <DrawerField label="Commission ID" value={selectedRep.id} />
                <DrawerField label="Rep Code" value={selectedRep.repCode} />
                <DrawerField label="Role" value={selectedRep.role} />
                <DrawerField label="Rep Name" value={selectedRep.repName} />
                <DrawerField label="Month" value={selectedRep.month.split(' ')[0] || '-'} />
                <DrawerField label="Year" value={selectedRep.month.split(' ')[1] || '-'} />
              </div>
            </div>

            {/* Commission Details */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">Commission Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <DrawerField label="Sales Achieved" value={formatCurrency(selectedRep.salesAchieved)} />
                <DrawerField label="Commission Rate" value={`${selectedRep.commissionRate.toFixed(1)}%`} />
                <DrawerField label="Commission Amount" value={formatCurrency(selectedRep.commissionAmount)} />
              </div>
            </div>

            {/* Status Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">Status Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <DrawerField label="Status" value={selectedRep.status} />
                <DrawerField label="Created Date" value={selectedRep.createdDate} />
                <DrawerField label="Created By" value={selectedRep.createdBy} />
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">Additional Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <DrawerField label="Remarks" value={selectedRep.remarks || 'None'} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <ActionButton variant="secondary" onClick={() => setSelectedRep(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Commission Modal matching Product Management styling */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Create Commission</h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Role *</label>
                    <select 
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                    >
                      <option value="">Select Role</option>
                      {roles.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Person *</label>
                    <select 
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-slate-50 disabled:text-slate-500"
                      value={formPersonCode}
                      onChange={(e) => setFormPersonCode(e.target.value)}
                      disabled={!formRole}
                    >
                      <option value="">Select Person</option>
                      {personsOptions.map(p => (
                        <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Month *</label>
                    <select 
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={formMonth}
                      onChange={(e) => setFormMonth(e.target.value)}
                    >
                      {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Year *</label>
                    <select 
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                    >
                      {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Rep Code</label>
                    <input 
                      type="text" 
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500 outline-none"
                      value={formPersonCode || '-'}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sales Achieved</label>
                    <input 
                      type="text" 
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500 outline-none"
                      value={formPersonCode ? formatCurrency(formSalesAchieved) : '-'}
                      readOnly
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Commission Rate (%) *</label>
                    <input 
                      type="number" 
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={formRate}
                      onChange={(e) => setFormRate(e.target.value)}
                      placeholder="e.g. 2.5"
                      step="0.1"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Commission Amount</label>
                    <input 
                      type="text" 
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-900 font-bold outline-none"
                      value={formCommissionAmount > 0 ? formatCurrency(formCommissionAmount) : '-'}
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Remarks</label>
                  <textarea 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    rows={3}
                    placeholder="Add any additional notes here..."
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
                <ActionButton variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</ActionButton>
                <ActionButton variant="primary" onClick={handleSaveCommission}>Save Commission</ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
