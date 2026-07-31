import React, { useState, useEffect } from 'react';
import { PageHeader, FilterBar, SearchInput, SelectFilter, TableCard, DataTable, Badge, ActionButton, DrawerField } from './components/shared';
import { Eye, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { asmService } from '../../services/asmService';

export default function TourPlanReview() {
  const [plans, setPlans] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  useEffect(() => {
    try {
      setPlans(asmService.getPendingTourPlans());
    } catch (e) {
      console.warn("Failed to load tour plans", e);
    }
  }, []);
  
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const filteredData = plans.filter(row => 
    (row.mr.toLowerCase().includes(search.toLowerCase()) || row.territory.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter ? row.status === statusFilter : true)
  );

  const handleView = (row: any) => {
    setSelectedPlan(row);
    setViewModalOpen(true);
  };

  const handleAction = (id: string, newStatus: string) => {
    setPlans(plans.map(p => p.id === id ? { ...p, status: newStatus } : p));
    if (selectedPlan && selectedPlan.id === id) {
      setSelectedPlan({ ...selectedPlan, status: newStatus });
      setViewModalOpen(false);
    }
  };

  const columns = [
    { key: 'mr', label: 'MR Name', render: (row: any) => <span className="font-bold text-slate-800">{row.mr}</span> },
    { key: 'date', label: 'Tour Date' },
    { key: 'hq', label: 'Headquarters' },
    { key: 'territory', label: 'Territory' },
    { key: 'submittedDate', label: 'Submitted Date' },
    { 
      key: 'status', 
      label: 'Status',
      render: (row: any) => {
        let variant: any = 'neutral';
        if (row.status === 'Approved') variant = 'success';
        if (row.status === 'Pending') variant = 'warning';
        if (row.status === 'Rejected') variant = 'danger';
        if (row.status === 'Changes Requested') variant = 'info';
        return <Badge variant={variant}>{row.status}</Badge>;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <div className="flex gap-2">
          <button onClick={() => handleView(row)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View Tour Plan">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="Tour Plan Review" 
        subtitle="Review and approve Monthly Tour Plans submitted by Medical Representatives."
      />

      <div className="mb-6 bg-blue-50/50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-blue-800">Awaiting MR Execution Data</h4>
          <p className="text-sm text-blue-600 mt-1">
            Tour Plan reviews are deferred until the Medical Representative execution modules are implemented.
          </p>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by MR name or territory..." />
        <SelectFilter 
          value={statusFilter} 
          onChange={setStatusFilter} 
          placeholder="All Statuses"
          options={[
            { label: 'Pending', value: 'Pending' },
            { label: 'Approved', value: 'Approved' },
            { label: 'Changes Requested', value: 'Changes Requested' },
            { label: 'Rejected', value: 'Rejected' }
          ]}
        />
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No tour plans available for review." />
      </TableCard>

      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Tour Plan Details"
        footer={
          <div className="flex justify-between w-full">
             <ActionButton variant="secondary" onClick={() => setViewModalOpen(false)}>Close</ActionButton>
             {selectedPlan?.status === 'Pending' && (
                <div className="flex gap-2">
                   <ActionButton variant="danger" onClick={() => handleAction(selectedPlan.id, 'Rejected')}>Reject</ActionButton>
                   <ActionButton variant="secondary" onClick={() => handleAction(selectedPlan.id, 'Changes Requested')}>Request Changes</ActionButton>
                   <ActionButton variant="primary" onClick={() => handleAction(selectedPlan.id, 'Approved')}>Approve</ActionButton>
                </div>
             )}
          </div>
        }
      >
        {selectedPlan && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Plan Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <DrawerField label="Medical Representative" value={selectedPlan.mr} />
                <DrawerField label="Tour Date" value={selectedPlan.date} />
                <DrawerField label="Headquarters" value={selectedPlan.hq} />
                <DrawerField label="Territory" value={selectedPlan.territory} />
                <DrawerField label="Submitted Date" value={selectedPlan.submittedDate} />
                <DrawerField label="Current Status" value={
                   <Badge variant={
                      selectedPlan.status === 'Approved' ? 'success' : 
                      selectedPlan.status === 'Pending' ? 'warning' : 
                      selectedPlan.status === 'Rejected' ? 'danger' : 'info'
                   }>{selectedPlan.status}</Badge>
                } />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
