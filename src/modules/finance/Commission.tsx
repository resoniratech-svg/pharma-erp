import { useState, useMemo, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, Eye, Plus, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import { financeService } from '../../services/financeService';

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

// Reference Data for Dropdowns
const roles = ['MR', 'Distributor', 'Stockist', 'Retailer', 'Sales Executive', 'Area Manager', 'Regional Manager'];

const mockPersonsByRole: Record<string, { code: string, name: string, baseSales: number }> = {
  'MR': [
    { code: '1', name: 'Rahul Verma', baseSales: 845000 },
    { code: '2', name: 'Sanjay Kumar', baseSales: 450000 },
    { code: '3', name: 'Vikas Shah', baseSales: 620000 },
  ],
  'Distributor': [
    { code: '101', name: 'Apex Distributors', baseSales: 950000 },
    { code: '102', name: 'Global Pharma Logistics', baseSales: 1500000 },
  ],
  'Stockist': [
    { code: '201', name: 'SuperStockist Inc.', baseSales: 3000000 },
  ],
  'Retailer': [
    { code: '301', name: 'Apollo Pharmacy', baseSales: 120000 },
    { code: '302', name: 'MedPlus Store', baseSales: 85000 },
  ],
  'Sales Executive': [
    { code: '401', name: 'Rajesh Mehta', baseSales: 550000 },
  ],
  'Area Manager': [
    { code: '501', name: 'Amit Singh', baseSales: 1200000 },
  ],
  'Regional Manager': [
    { code: '601', name: 'Priya Desai', baseSales: 1550000 },
  ]
} as any;

const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const yearsList = ['2026', '2025', '2024'];

export default function Commission() {
  const [data, setData] = useState<CommissionEntry[]>([]);
  const [loading, setLoading] = useState(true);
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
    fetchData();
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const commissions = await financeService.getCommissions();
      
      const mapped = commissions.map(c => {
        // Try to reverse map the name and role based on repId
        let foundName = 'Unknown User';
        let foundRole = 'Unknown Role';
        for (const r of Object.keys(mockPersonsByRole)) {
          const list = mockPersonsByRole[r] as unknown as { code: string, name: string }[];
          const p = list.find(p => p.code === String(c.repId));
          if (p) {
            foundName = p.name;
            foundRole = r;
            break;
          }
        }

        return {
          id: String(c.id),
          repCode: String(c.repId),
          role: foundRole,
          repName: foundName,
          month: c.month,
          salesAchieved: c.salesAchieved,
          commissionRate: c.commissionRate,
          commissionAmount: c.commissionAmount,
          status: c.status as CommissionStatus,
          territory: c.territory || 'Unassigned',
          commissionFormula: `Sales Achieved * ${c.commissionRate}%`,
          createdBy: 'System',
          createdDate: new Date().toLocaleString(),
          lastUpdated: new Date().toLocaleString(),
        };
      });
      
      setData(mapped);
    } catch (error) {
      console.error("Error fetching commissions", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Derived Form Data & Handlers ---
  useEffect(() => {
    setFormPersonCode('');
  }, [formRole]);

  const personsOptions = formRole ? ((mockPersonsByRole[formRole] || []) as unknown as any[]) : [];
  const selectedPersonObj = personsOptions.find(p => p.code === formPersonCode);

  const formSalesAchieved = selectedPersonObj ? selectedPersonObj.baseSales : 0;
  const parsedRate = parseFloat(formRate) || 0;
  const formCommissionAmount = (formSalesAchieved * parsedRate) / 100;

  const handleSaveCommission = async () => {
    if (!formRole || !formPersonCode || !formMonth || !formYear || parsedRate <= 0) {
      alert("Please fill all mandatory fields.");
      return;
    }
    
    try {
      await financeService.createCommission({
        repId: parseInt(formPersonCode),
        month: `${formMonth} ${formYear}`,
        salesAchieved: formSalesAchieved,
        commissionRate: parsedRate,
        commissionAmount: formCommissionAmount,
        territory: 'HQ'
      });
      
      setShowCreateModal(false);
      setFormRole('');
      setFormPersonCode('');
      setFormMonth('Oct');
      setFormYear('2026');
      setFormRate('');
      setFormRemarks('');
      
      fetchData(); // Refresh list
    } catch (error) {
      alert("Failed to save commission.");
      console.error(error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await financeService.updateCommissionStatus(id, 'Approved');
      fetchData();
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusBadgeVariant = (status: CommissionStatus): BadgeVariant => {
    switch (status) {
      case 'Calculated': return 'warning';
      case 'Approved': return 'info';
      case 'Paid': return 'success';
      default: return 'secondary';
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = item.repName.toLowerCase().includes(search.toLowerCase()) ||
                          item.repCode.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter ? item.role === roleFilter : true;
      const matchMonth = monthFilter ? item.month.includes(monthFilter) : true;
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      return matchSearch && matchRole && matchMonth && matchStatus;
    });
  }, [data, search, roleFilter, monthFilter, statusFilter]);

  const totalCommission = useMemo(() => filteredData.reduce((acc, curr) => acc + curr.commissionAmount, 0), [filteredData]);

  // Export functions (Stubbed for brevity)
  const exportToPDF = () => { alert("PDF Export triggered"); };
  const exportToExcel = () => { alert("Excel Export triggered"); };

  const columns: Column<CommissionEntry>[] = [
    { key: 'repName', label: 'Rep Name (Code)', render: (row) => 
        <div><div className="font-medium text-slate-800">{row.repName}</div><div className="text-xs text-slate-500">{row.repCode}</div></div> 
    },
    { key: 'role', label: 'Role', render: (row) => <span className="text-slate-600">{row.role}</span> },
    { key: 'month', label: 'Month', render: (row) => <span className="text-slate-600">{row.month}</span> },
    { key: 'salesAchieved', label: 'Sales Achieved', render: (row) => <span className="text-slate-700">{formatCurrency(row.salesAchieved)}</span> },
    { key: 'commissionRate', label: 'Rate (%)', render: (row) => <span className="text-slate-700">{row.commissionRate}%</span> },
    { key: 'commissionAmount', label: 'Commission', render: (row) => <span className="font-semibold text-emerald-700">{formatCurrency(row.commissionAmount)}</span> },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={getStatusBadgeVariant(row.status)}>{row.status}</Badge> },
    { key: 'actions', label: 'Actions', render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === 'Calculated' && (
             <button onClick={() => handleApprove(row.id)} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-medium">Approve</button>
          )}
          <button onClick={() => setSelectedRep(row)} className="p-1 text-slate-400 hover:text-[#163c78]" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader 
        title="Commission System" 
        subtitle="Calculate, approve and track commissions"
        actions={
          <div className="flex items-center gap-3 relative">
            <ActionButton icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
              Calculate New
            </ActionButton>
            
            <div ref={exportMenuRef}>
              <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />} onClick={() => setShowExportMenu(!showExportMenu)}>
                Export <ChevronDown className="w-4 h-4 ml-1" />
              </ActionButton>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 animate-in slide-in-from-top-2">
                  <button onClick={() => { exportToPDF(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-500" /> Export as PDF
                  </button>
                  <button onClick={() => { exportToExcel(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-500" /> Export as Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Total Commission (Filtered)</h3>
          <p className="text-2xl font-bold text-[#163c78]">{formatCurrency(totalCommission)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Total Records</h3>
          <p className="text-2xl font-bold text-slate-800">{filteredData.length}</p>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or code..." />
        <SelectFilter value={roleFilter} onChange={setRoleFilter} options={roles} placeholder="All Roles" />
        <SelectFilter value={monthFilter} onChange={setMonthFilter} options={monthsList} placeholder="All Months" />
        <SelectFilter value={statusFilter} onChange={setStatusFilter} options={['Calculated', 'Approved', 'Paid']} placeholder="All Statuses" />
      </FilterBar>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
         {loading ? (
             <div className="p-8 text-center text-slate-500">Loading commissions...</div>
          ) : (
            <DataTable columns={columns} data={filteredData} emptyMessage="No commissions found matching the criteria." />
          )}
      </div>

      {/* Drawer */}
      <Drawer open={!!selectedRep} onClose={() => setSelectedRep(null)} title="Commission Details">
        {selectedRep && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{selectedRep.repName}</h3>
              <p className="text-sm text-slate-500">{selectedRep.role} | Code: {selectedRep.repCode}</p>
              <div className="mt-2">
                <Badge variant={getStatusBadgeVariant(selectedRep.status)}>{selectedRep.status}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Calculation Details</h4>
              <DrawerField label="Month" value={selectedRep.month} />
              <DrawerField label="Sales Achieved" value={formatCurrency(selectedRep.salesAchieved)} />
              <DrawerField label="Commission Rate" value={`${selectedRep.commissionRate}%`} />
              <DrawerField label="Formula" value={selectedRep.commissionFormula} />
              <div className="pt-2 border-t border-slate-100">
                <DrawerField label="Commission Amount" value={<span className="font-bold text-emerald-700 text-lg">{formatCurrency(selectedRep.commissionAmount)}</span>} />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Additional Info</h4>
              <DrawerField label="Territory" value={selectedRep.territory} />
              <DrawerField label="Created By" value={selectedRep.createdBy} />
              <DrawerField label="Created On" value={selectedRep.createdDate} />
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                 Calculate New Commission
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" value={formRole} onChange={e => setFormRole(e.target.value)}>
                    <option value="">Select Role</option>
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Person *</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" value={formPersonCode} onChange={e => setFormPersonCode(e.target.value)} disabled={!formRole}>
                    <option value="">Select Person</option>
                    {personsOptions.map((p: any) => <option key={p.code} value={p.code}>{p.name} ({p.code})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Month *</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" value={formMonth} onChange={e => setFormMonth(e.target.value)}>
                    {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year *</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" value={formYear} onChange={e => setFormYear(e.target.value)}>
                    {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-600">Sales Achieved</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(formSalesAchieved)}</span>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Commission Rate (%) *</label>
                    <input type="number" step="0.1" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" placeholder="e.g. 5" value={formRate} onChange={e => setFormRate(e.target.value)} />
                  </div>
                  <div className="flex-[2] flex flex-col justify-end">
                     <label className="block text-xs font-medium text-slate-500 mb-1">Calculated Amount</label>
                     <div className="px-3 py-2 bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-100 text-lg">
                       {formatCurrency(formCommissionAmount)}
                     </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" placeholder="Optional remarks" value={formRemarks} onChange={e => setFormRemarks(e.target.value)} />
              </div>

            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveCommission}>Save Commission</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
