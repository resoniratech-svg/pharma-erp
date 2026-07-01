// import { useState } from 'react';
// import { Download, Layers, Target, CheckCircle2, XCircle } from 'lucide-react';
// import {
//   PageHeader,
//   ActionButton,
//   TableCard,
//   DataTable,
//   Badge,
//   SummaryCard,
// } from './components/shared';
// import { type Column } from './components/shared';

// interface LeadPipeline {
//   id: string;
//   leadId: string;
//   leadName: string;
//   currentStage: string;
//   assignedTo: string;
//   lastActivity: string;
//   probability: string;
//   status: 'Active' | 'Won' | 'Lost';
// }

// const mockData: LeadPipeline[] = [
//   { id: '1', leadId: 'LD-1001', leadName: 'City Hospital', currentStage: 'Proposal Sent', assignedTo: 'Rahul Sharma', lastActivity: '2 hours ago', probability: '80%', status: 'Active' },
//   { id: '2', leadId: 'LD-1002', leadName: 'Dr. A.K. Singh', currentStage: 'New Lead', assignedTo: 'Unassigned', lastActivity: '1 day ago', probability: '10%', status: 'Active' },
//   { id: '3', leadId: 'LD-1003', leadName: 'Apollo Pharmacy', currentStage: 'Converted', assignedTo: 'Amit Kumar', lastActivity: '12-Oct-2024', probability: '100%', status: 'Won' },
//   { id: '4', leadId: 'LD-1004', leadName: 'Wellness Medicals', currentStage: 'Lost', assignedTo: 'Sanjay Patel', lastActivity: '10-Oct-2024', probability: '0%', status: 'Lost' },
// ];

// const stages = ['New Lead', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Converted', 'Lost'];

// export default function LeadPipelineTracking() {
//   const [viewMode, setViewMode] = useState<'kanban'|'table'>('kanban');

//   const columns: Column<LeadPipeline>[] = [
//     { key: 'leadId', label: 'Lead ID', render: (row) => <span className="font-semibold text-slate-900">{row.leadId}</span> },
//     { key: 'leadName', label: 'Lead Name', render: (row) => <span className="font-medium text-slate-800">{row.leadName}</span> },
//     { 
//       key: 'currentStage', 
//       label: 'Current Stage',
//       render: (row) => (
//         <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-slate-200">
//           {row.currentStage}
//         </span>
//       )
//     },
//     { key: 'assignedTo', label: 'Assigned To' },
//     { key: 'lastActivity', label: 'Last Activity' },
//     { 
//       key: 'probability', 
//       label: 'Probability %',
//       render: (row) => (
//         <div className="flex items-center gap-2">
//           <span className="w-8 text-right font-mono text-sm">{row.probability}</span>
//           <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
//             <div className={`h-full ${parseInt(row.probability) > 70 ? 'bg-emerald-500' : parseInt(row.probability) > 30 ? 'bg-amber-500' : 'bg-slate-300'}`} style={{ width: row.probability }}></div>
//           </div>
//         </div>
//       )
//     },
//     {
//       key: 'status',
//       label: 'Status',
//       render: (row) => {
//         let variant: any = 'default';
//         if (row.status === 'Won') variant = 'success';
//         else if (row.status === 'Active') variant = 'info';
//         else if (row.status === 'Lost') variant = 'danger';
//         return <Badge variant={variant}>{row.status}</Badge>;
//       },
//     },
//   ];

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Lead Pipeline Tracking"
//         subtitle="Monitor leads through every stage from creation to conversion."
//         actions={
//           <div className="flex gap-2">
//             <div className="bg-white border border-slate-200 p-1 rounded-lg flex mr-2">
//               <button onClick={() => setViewMode('kanban')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Kanban</button>
//               <button onClick={() => setViewMode('table')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Table</button>
//             </div>
//             <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Pipeline</ActionButton>
//           </div>
//         }
//       />

//       {/* KPI Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//         <SummaryCard
//           title="Total Leads"
//           value="450"
//           subtitle="Pipeline volume"
//           icon={<Layers className="w-6 h-6" />}
//           colorClass="text-violet-600"
//           bgClass="bg-violet-50"
//         />
//         <SummaryCard
//           title="Qualified Leads"
//           value="185"
//           subtitle="In progress"
//           icon={<Target className="w-6 h-6" />}
//           colorClass="text-blue-600"
//           bgClass="bg-blue-50"
//         />
//         <SummaryCard
//           title="Converted Leads"
//           value="112"
//           subtitle="Successfully won"
//           icon={<CheckCircle2 className="w-6 h-6" />}
//           colorClass="text-emerald-600"
//           bgClass="bg-emerald-50"
//         />
//         <SummaryCard
//           title="Lost Leads"
//           value="45"
//           subtitle="Dropped"
//           icon={<XCircle className="w-6 h-6" />}
//           colorClass="text-danger-600"
//           bgClass="bg-danger-50"
//         />
//       </div>

//       {viewMode === 'table' ? (
//         <TableCard>
//           <DataTable
//             columns={columns}
//             data={mockData}
//             emptyMessage="No pipeline data found."
//           />
//         </TableCard>
//       ) : (
//         <div className="flex gap-4 overflow-x-auto pb-4 h-[600px] snap-x">
//           {stages.map((stage, idx) => {
//             const stageLeads = mockData.filter(l => l.currentStage === stage);
//             return (
//               <div key={idx} className="min-w-[300px] w-[300px] bg-slate-50 border border-slate-200 rounded-xl flex flex-col h-full snap-start">
//                 <div className="p-3 border-b border-slate-200 bg-slate-100 rounded-t-xl flex justify-between items-center">
//                   <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
//                     {stage}
//                     <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{stageLeads.length}</span>
//                   </h3>
//                 </div>
//                 <div className="p-3 flex-1 overflow-y-auto space-y-3">
//                   {stageLeads.length > 0 ? stageLeads.map(lead => (
//                     <div key={lead.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm cursor-grab hover:border-primary/30 hover:shadow transition-all">
//                       <div className="flex justify-between items-start mb-2">
//                         <span className="text-xs font-semibold text-slate-500">{lead.leadId}</span>
//                         {lead.status === 'Won' ? <Badge variant="success">Won</Badge> : lead.status === 'Lost' ? <Badge variant="danger">Lost</Badge> : null}
//                       </div>
//                       <h4 className="font-semibold text-slate-900 text-sm mb-1">{lead.leadName}</h4>
//                       <p className="text-xs text-slate-500 mb-3 flex items-center justify-between">
//                         {lead.assignedTo}
//                         <span className="font-mono font-bold text-primary">{lead.probability}</span>
//                       </p>
//                     </div>
//                   )) : (
//                     <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs">
//                       Drop lead here
//                     </div>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }


/////////////////////////////////////////////////////////////



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
  const [viewMode, setViewMode] = useState<'kanban'|'table'>('kanban');
  const [leads, setLeads] = useState<CRMLead[]>([]); // ✅ Applied interface

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = () => {
    try {
      const storedLeads = localStorage.getItem('crm_leads');
      if (storedLeads) {
        setLeads(JSON.parse(storedLeads));
      }
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

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
  };

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      const lead = leads.find(l => l.id === leadId);
      if (lead && lead.status !== stage) {
        updateLeadStage(leadId, stage);
      }
    }
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
            <div className="bg-white border border-slate-200 p-1 rounded-lg flex mr-2">
              <button onClick={() => setViewMode('kanban')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Kanban</button>
              <button onClick={() => setViewMode('table')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Table</button>
            </div>
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
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
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
        {viewMode === 'table' ? (
          <TableCard>
            <DataTable
              columns={columns}
              data={tableData}
              emptyMessage="No pipeline data found."
            />
          </TableCard>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 h-full snap-x">
            {PIPELINE_STAGES.map((stage, idx) => {
              const stageLeads = leads.filter(l => (l.status || 'New') === stage);
              return (
                <div 
                  key={idx} 
                  className="min-w-[300px] w-[300px] bg-slate-50/50 border border-slate-200 rounded-xl flex flex-col h-full snap-start transition-colors hover:bg-slate-50"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage)}
                >
                  <div className="p-3 border-b border-slate-200 bg-slate-100 rounded-t-xl flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                      {stage}
                      <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{stageLeads.length}</span>
                    </h3>
                  </div>
                  <div className="p-3 flex-1 overflow-y-auto space-y-3">
                    {stageLeads.length > 0 ? stageLeads.map(lead => {
                      const prob = getProbability(lead.status || 'New');
                      const sType = getStatusType(lead.status || 'New');
                      
                      return (
                        <div 
                          key={lead.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm cursor-grab hover:border-violet-300 hover:shadow-md active:cursor-grabbing transition-all"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-semibold text-slate-500">{lead.id}</span>
                            {sType === 'Won' ? <Badge variant="success">Won</Badge> : sType === 'Lost' ? <Badge variant="danger">Lost</Badge> : null}
                          </div>
                          <h4 className="font-semibold text-slate-900 text-sm mb-1">{lead.name}</h4>
                          <p className="text-xs text-slate-500 mb-3 flex items-center justify-between">
                            {lead.assignedTo || 'Unassigned'}
                            <span className="font-mono font-bold text-violet-600">{prob}</span>
                          </p>
                        </div>
                      )
                    }) : (
                      <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs bg-slate-50/50">
                        Drop lead here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}