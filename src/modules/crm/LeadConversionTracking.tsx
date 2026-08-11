import { useState, useEffect } from 'react';
import { Download, Filter, Target, TrendingUp, IndianRupee, Trophy, Eye, RefreshCw } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
  Drawer,
  DrawerField
} from './components/shared';
import { type Column } from './components/shared';
import { leadService, type Lead } from '../../services/leadService';
import { followUpService } from '../../services/followUpService';
import { employeeService } from '../../services/employeeService';

interface ConversionRow {
  id: string;
  leadId: string;
  leadName: string;
  conversionDate: string;
  assignedEmployee: string;
  territory: string;
  revenueValue: string;
  conversionStatus: string;
  rawLead: Lead;
}

export default function LeadConversionTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  
  const [conversionDate, setConversionDate] = useState(new Date().toISOString().split('T')[0]);
  const [convertedBy, setConvertedBy] = useState('');
  const [convertedTo, setConvertedTo] = useState('Distributor');
  const [convertError, setConvertError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const activeRole = localStorage.getItem('activeRole');
      const authUserStr = localStorage.getItem('authUser');
      const authUser = authUserStr ? JSON.parse(authUserStr) : null;
      const allEmployees = employeeService.getLocalEmployees();
      
      let currentRole = 'Super Admin';
      let currentName = 'Super Admin';
      let currentEmpId = '';

      if (authUser) {
        currentRole = authUser.roleId || authUser.role || 'SUPER_ADMIN';
        currentName = authUser.fullName || authUser.name || authUser.adminName || 'Super Admin';
        currentEmpId = authUser.employeeId || '';
      } else if (activeRole) {
        currentRole = activeRole;
        if (activeRole === 'SUPER_ADMIN') {
          currentName = 'Super Admin';
        } else {
          let targetDesignation = '';
          if (activeRole === 'NATIONAL_SALES_HEAD') targetDesignation = 'National Sales Head';
          else if (activeRole === 'REGIONAL_SALES_MANAGER') targetDesignation = 'Regional Sales Manager';
          else if (activeRole === 'AREA_SALES_MANAGER') targetDesignation = 'Area Sales Manager';
          else if (activeRole === 'MEDICAL_REPRESENTATIVE') targetDesignation = 'Medical Representative';
          
          if (targetDesignation) {
            const mockEmp = allEmployees.find(e => e.designation === targetDesignation && e.status === 'Active');
            if (mockEmp) {
              currentName = mockEmp.employeeName;
              currentEmpId = mockEmp.id;
            }
          }
        }
      }

      if (!currentEmpId && currentName !== 'Super Admin') {
         const loggedInEmp = allEmployees.find(e => e.employeeName === currentName);
         if (loggedInEmp) currentEmpId = loggedInEmp.id;
      }

      const isSuperAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'Super Admin';
      const subordinates = await employeeService.getAllSubordinates(currentEmpId, currentName, isSuperAdmin);
      const subNames = subordinates.map(s => s.employeeName);
      const subIds = subordinates.map(s => s.id);

      const apiLeads = await leadService.getAll();

      let visibleLeads = apiLeads;
      if (!isSuperAdmin) {
           visibleLeads = apiLeads.filter(l => {
             const createdMatch = (l.createdByEmpId && (l.createdByEmpId === currentEmpId || subIds.includes(l.createdByEmpId))) || 
                                  (!l.createdByEmpId && (l.assignedMrName === currentName || subNames.includes(l.assignedMrName)));
             const assignedMatchReal = l.assignedMrName && (l.assignedMrName === currentName || subNames.includes(l.assignedMrName));
             return createdMatch || assignedMatchReal;
           });
      }

      setLeads(visibleLeads);
    } catch (e) {
      console.error("Failed to load conversion data", e);
    }
  };

  const getConversionStatus = (status?: string) => {
    if (status === 'CONVERTED') return 'Converted';
    if (status === 'LOST') return 'Lost';
    return 'Pending';
  };

  const getRawRevenue = (val: any) => {
    if (!val) return 0;
    const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : val;
    return isNaN(num) ? 0 : num;
  };

  const formatCurrency = (val: string | number | undefined) => {
    const num = getRawRevenue(val);
    if (num === 0) return '₹ 0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
  };

  const formatLakhs = (val: number) => {
    if (val === 0) return '₹ 0';
    if (val >= 100000) {
      return `₹ ${(val / 100000).toFixed(2)} L`;
    }
    return formatCurrency(val);
  };

  const handleConvertClick = (lead: Lead) => {
    setConvertLead(lead);
    setConvertError('');
    setConversionDate(new Date().toISOString().split('T')[0]);
    
    const authUserStr = localStorage.getItem('authUser');
    if (authUserStr) {
      try {
        const user = JSON.parse(authUserStr);
        setConvertedBy(user.name || user.employeeName || user.email || 'Current User');
      } catch {
        setConvertedBy(authUserStr);
      }
    } else {
        setConvertedBy('Current User');
    }
  };

  const handleConvertSubmit = async () => {
    setConvertError('');
    if (!convertLead) return;

    if (!conversionDate) {
      setConvertError('Conversion Date is required.');
      return;
    }
    if (!convertedBy) {
      setConvertError('Converted By is required.');
      return;
    }
    if (!convertedTo) {
      setConvertError('Converted To is required.');
      return;
    }

    try {
      // 1. Check current status
      const currentLead = await leadService.getById(convertLead.id);
      if (currentLead?.status === 'CONVERTED') {
        setConvertError('Lead is already converted.');
        return;
      }

      // 2. Check follow-ups
      const followUps = await followUpService.getAll();
      const hasFollowUp = followUps.some(f => String(f.leadId) === String(convertLead.id));
      if (!hasFollowUp) {
        setConvertError('At least one follow-up is required before converting this lead.');
        return;
      }

      // 3. Convert lead
      await leadService.update(convertLead.id, {
        status: 'CONVERTED',
        conversionDate,
        convertedBy,
        convertedTo
      });

      setConvertLead(null);
      await loadData();
      alert('Lead converted successfully.');
    } catch (e) {
      setConvertError('Failed to convert lead.');
    }
  };

  // KPI Calculations
  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.status === 'CONVERTED').length;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0.0';
  
  const totalRevenue = leads
    .filter(l => l.status === 'CONVERTED')
    .reduce((sum, l) => sum + getRawRevenue((l as any).revenue || (l as any).dealValue || 0), 0);

  // Convert raw DB Leads into Table Rows
  const tableData: ConversionRow[] = leads.map(l => {
    const cStatus = getConversionStatus(l.status);
    const val = getRawRevenue((l as any).revenue || (l as any).dealValue || 0);
    return {
      id: l.id,
      leadId: l.leadCode || l.id,
      leadName: l.name,
      conversionDate: cStatus === 'Converted' ? (l.conversionDate || l.createdAt || '21-Jul-2026') : 'Expected Q3',
      assignedEmployee: l.assignedMrName || 'Unassigned',
      territory: l.territory || 'Unassigned',
      revenueValue: val > 0 ? (cStatus === 'Converted' ? formatCurrency(val) : `${formatCurrency(val)} (Est.)`) : '—',
      conversionStatus: cStatus,
      rawLead: l,
    };
  });

  const columns: Column<ConversionRow>[] = [
    { key: 'leadId', label: 'Lead ID', render: (row) => <span className="font-semibold text-slate-900">{row.leadId}</span> },
    { key: 'leadName', label: 'Lead Name', render: (row) => <span className="font-medium text-slate-800">{row.leadName}</span> },
    { key: 'conversionDate', label: 'Conversion Date' },
    { key: 'assignedEmployee', label: 'Assigned Employee' },
    { key: 'territory', label: 'Territory' },
    { key: 'revenueValue', label: 'Revenue Value', render: (row) => <span className="font-bold text-emerald-600">{row.revenueValue}</span> },
    {
      key: 'conversionStatus',
      label: 'Conversion Status',
      render: (row) => {
        let variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'purple' = 'neutral';
        if (row.conversionStatus === 'Converted') variant = 'success';
        else if (row.conversionStatus === 'Pending') variant = 'warning';
        else if (row.conversionStatus === 'Lost') variant = 'danger';
        return <Badge variant={variant}>{row.conversionStatus}</Badge>;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-3">
          <button onClick={() => setViewLead(row.rawLead)} className="text-slate-500 hover:text-blue-600 transition-colors" title="View">
            <Eye className="w-4 h-4" />
          </button>
          {row.conversionStatus !== 'Converted' && (
            <button onClick={() => handleConvertClick(row.rawLead)} className="text-slate-500 hover:text-emerald-600 transition-colors" title="Convert">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];
  
  const filteredData = tableData.filter((item) => {
    const term = search.toLowerCase();
    const matchSearch = item.leadName.toLowerCase().includes(term) || 
                        item.assignedEmployee.toLowerCase().includes(term) ||
                        item.leadId.toLowerCase().includes(term) ||
                        item.territory.toLowerCase().includes(term);
    const matchStatus = statusFilter ? item.conversionStatus === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const handleExport = () => {
    if (tableData.length === 0) return alert("No data to export!");
    const headers = ['Lead ID', 'Lead Name', 'Conversion Date', 'Assigned Employee', 'Territory', 'Revenue Value', 'Conversion Status'];
    const rows = filteredData.map(l => [
      l.leadId, `"${l.leadName}"`, l.conversionDate, `"${l.assignedEmployee}"`, `"${l.territory}"`, `"${l.revenueValue}"`, l.conversionStatus
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Conversion_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Lead Conversion"
        subtitle="Track lead-to-customer conversion metrics and sales effectiveness."
        actions={
          <ActionButton onClick={handleExport} variant="secondary" icon={<Download className="w-4 h-4" />}>Export Analytics</ActionButton>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Leads"
          value={totalLeads.toString()}
          subtitle="Cumulative total"
          icon={<Target className="w-6 h-6" />}
          colorClass="text-[#163c78]"
          bgClass="bg-[#163c78]/10"
        />
        <SummaryCard
          title="Converted Leads"
          value={convertedLeads.toString()}
          subtitle="Successfully closed"
          icon={<Trophy className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          subtitle="Of total pipeline"
          icon={<TrendingUp className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Revenue Generated"
          value={formatLakhs(totalRevenue)}
          subtitle="From converted leads"
          icon={<IndianRupee className="w-6 h-6" />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search ID, name, employee, or territory..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Converted', value: 'Converted' },
            { label: 'Pending', value: 'Pending' },
            { label: 'Lost', value: 'Lost' },
          ]}
          placeholder="Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No conversion records available. Lead conversions will appear here after leads are marked as Converted."
        />
      </TableCard>

      <Drawer open={!!viewLead} onClose={() => setViewLead(null)} title="Lead Details">
        {viewLead && (
          <div className="space-y-4">
            <DrawerField label="Lead Code" value={viewLead.leadCode || viewLead.id} />
            <DrawerField label="Lead Name" value={viewLead.name} />
            <DrawerField label="Contact Person" value={viewLead.contactPerson} />
            <DrawerField label="Type" value={viewLead.type} />
            <DrawerField label="Mobile" value={viewLead.mobile} />
            <DrawerField label="Email" value={viewLead.email} />
            <DrawerField label="Territory" value={viewLead.territory} />
            <DrawerField label="Assigned To" value={viewLead.assignedMrName} />
            <DrawerField label="Status" value={viewLead.status} />
            {viewLead.status === 'CONVERTED' && (
              <>
                <DrawerField label="Conversion Date" value={viewLead.conversionDate} />
                <DrawerField label="Converted By" value={viewLead.convertedBy} />
              </>
            )}
          </div>
        )}
      </Drawer>

      <Drawer open={!!convertLead} onClose={() => setConvertLead(null)} title="Convert Lead">
        {convertLead && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Lead Information</h3>
              <p className="text-sm text-slate-600"><span className="font-medium">Name:</span> {convertLead.name}</p>
              <p className="text-sm text-slate-600"><span className="font-medium">Code:</span> {convertLead.leadCode || convertLead.id}</p>
            </div>

            {convertError && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm border border-rose-200 font-medium">
                {convertError}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Conversion Date *</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
                value={conversionDate}
                onChange={(e) => setConversionDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Converted By *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                value={convertedBy}
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Converted To *</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
                value={convertedTo}
                onChange={(e) => setConvertedTo(e.target.value)}
              >
                <option value="Distributor">Distributor</option>
                <option value="Retailer">Retailer</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <ActionButton variant="ghost" onClick={() => setConvertLead(null)}>Cancel</ActionButton>
              <ActionButton variant="primary" onClick={handleConvertSubmit}>Convert Lead</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}