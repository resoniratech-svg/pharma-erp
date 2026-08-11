import { useState, useEffect } from 'react';
import { Download, Layers, Target, CheckCircle2, XCircle } from 'lucide-react';
import {
  PageHeader,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
} from './components/shared';
import { type Column } from './components/shared';
import { employeeService } from '../../services/employeeService';
import { leadService } from '../../services/leadService';

// ✅ Enhancement 3: Proper TypeScript Interface instead of 'any'
interface CRMLead {
  id: string;
  name: string;
  status?: string;
  assignedTo?: string;
  probability?: string;
  updatedAt?: string;
}

// Standardized Pipeline Stages for the CRM
const PIPELINE_STAGES = ['New', 'Assigned', 'Contacted', 'Qualified', 'Proposal Sent', 'Converted', 'Lost'];

export default function LeadPipelineTracking() {
  const [leads, setLeads] = useState<CRMLead[]>([]); // ✅ Applied interface

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
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
        currentEmpId = authUser.id || authUser.employeeId || '';
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

      const mapped = visibleLeads.map(l => ({
          id: String(l.id),
          name: l.name,
          status: l.status,
          assignedTo: l.assignedMrName,
          probability: '',
          updatedAt: l.createdAt
      }));
      setLeads(mapped);
    } catch (e) {
      console.error("Failed to load leads", e);
    }
  };

  const getManagerName = () => {
    const authUserStr = localStorage.getItem('authUser');
    const authUser = authUserStr ? JSON.parse(authUserStr) : null;
    return authUser?.fullName || authUser?.name || authUser?.username || 'Admin';
  };

  const updateLeadStage = (leadId: string, newStage: string) => {
    // ✅ Enhancement 1: Double-check safeguard to prevent unnecessary database writes
    const leadToUpdate = leads.find(l => l.id === leadId);
    if (leadToUpdate?.status === newStage) return;

    const updated = leads.map(l => {
      if (l.id === leadId) {
        return { ...l, status: newStage };
      }
      return l;
    });
    setLeads(updated);
    localStorage.setItem('crm_leads', JSON.stringify(updated));

    // Log pipeline movement to Master CRM Activity Log
    try {
      const managerName = getManagerName();
      const existingActivities = JSON.parse(localStorage.getItem('crm_activities') || '[]');
      const newActivity = {
        id: `ACT-${Date.now()}`,
        type: 'Pipeline Update',
        description: `Moved lead ${leadId} to stage: ${newStage}`,
        date: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        user: managerName
      };
      localStorage.setItem('crm_activities', JSON.stringify([newActivity, ...existingActivities]));
    } catch(e) { console.error("Failed to log pipeline activity", e); }
  };


  // Auto-Probability Calculation
  const getProbability = (stage: string) => {
    switch (stage) {
      case 'New': return '10%';
      case 'Assigned': return '20%';
      case 'Contacted': return '40%';
      case 'Qualified': return '60%';
      case 'Proposal Sent': return '80%';
      case 'Converted': return '100%';
      case 'Lost': return '0%';
      default: return '10%';
    }
  };

  const getStatusType = (stage: string) => {
    if (stage === 'Converted') return 'Won';
    if (stage === 'Lost') return 'Lost';
    return 'Active';
  };

  const handleExport = () => {
    if (leads.length === 0) return alert("No data to export!");
    const headers = ['Lead ID', 'Lead Name', 'Stage', 'Assigned To', 'Probability', 'Status'];
    const rows = leads.map(l => [
      l.id, `"${l.name}"`, l.status || 'New', `"${l.assignedTo || 'Unassigned'}"`, getProbability(l.status || 'New'), getStatusType(l.status || 'New')
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Pipeline_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Dynamic KPI Calculations
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => l.status === 'Qualified' || l.status === 'Proposal Sent').length;
  const convertedLeads = leads.filter(l => l.status === 'Converted').length;
  const lostLeads = leads.filter(l => l.status === 'Lost').length;

  const tableData = leads.map(l => ({
    leadId: l.id,
    leadName: l.name,
    currentStage: l.status || 'New',
    assignedTo: l.assignedTo || 'Unassigned',
    probability: getProbability(l.status || 'New'),
    status: getStatusType(l.status || 'New')
  }));

  const columns: Column<any>[] = [
    { key: 'leadId', label: 'Lead ID', render: (row) => <span className="font-semibold text-slate-900">{row.leadId}</span> },
    { key: 'leadName', label: 'Lead Name', render: (row) => <span className="font-medium text-slate-800">{row.leadName}</span> },
    { 
      key: 'currentStage', 
      label: 'Current Stage',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-slate-200">
          {row.currentStage}
        </span>
      )
    },
    { key: 'assignedTo', label: 'Assigned To', render: (row) => <span className="text-slate-600">{row.assignedTo}</span> },
    { 
      key: 'probability', 
      label: 'Probability %',
      render: (row) => {
        const probVal = parseInt(row.probability);
        return (
          <div className="flex items-center gap-2">
            <span className="w-8 text-right font-mono text-sm">{row.probability}</span>
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full ${probVal > 70 ? 'bg-emerald-500' : probVal > 30 ? 'bg-amber-500' : 'bg-slate-300'}`} style={{ width: row.probability }}></div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'purple' = 'neutral';
        if (row.status === 'Won') variant = 'success';
        else if (row.status === 'Active') variant = 'info';
        else if (row.status === 'Lost') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  return (
    <div className="animate-in fade-in duration-500 min-h-[calc(100vh-140px)] flex flex-col">
      <PageHeader
        title="Lead Pipeline Tracking"
        subtitle="Monitor and drag-and-drop leads through every stage from creation to conversion."
        actions={
          <div className="flex gap-2">
            <ActionButton onClick={handleExport} variant="secondary" icon={<Download className="w-4 h-4" />}>Export Pipeline</ActionButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Leads"
          value={totalLeads.toString()}
          subtitle="Pipeline volume"
          icon={<Layers className="w-6 h-6" />}
          colorClass="text-[#163c78]"
          bgClass="bg-[#163c78]/10"
        />
        <SummaryCard
          title="Qualified / Proposal"
          value={qualifiedLeads.toString()}
          subtitle="In progress"
          icon={<Target className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Converted Leads"
          value={convertedLeads.toString()}
          subtitle="Successfully won"
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Lost Leads"
          value={lostLeads.toString()}
          subtitle="Dropped"
          icon={<XCircle className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <TableCard>
          <DataTable
            columns={columns}
            data={tableData}
            emptyMessage="No pipeline data found."
          />
        </TableCard>
      </div>
    </div>
  );
}