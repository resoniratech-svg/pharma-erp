import React, { useState, useEffect } from 'react';
import { PageHeader, FilterBar, SearchInput, SelectFilter, TableCard, DataTable, Badge, ActionButton, DrawerField } from './components/shared';
import { Eye, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { asmService } from '../../services/asmService';

export default function DCRReview() {
  const [dcrs, setDcrs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  useEffect(() => {
    try {
      setDcrs(asmService.getPendingDCRs());
    } catch (e) {
      console.warn("Failed to load DCRs", e);
    }
  }, []);
  
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedDcr, setSelectedDcr] = useState<any>(null);

  const filteredData = dcrs.filter(row => 
    (row.mr.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter ? row.status === statusFilter : true)
  );

  const handleView = (row: any) => {
    setSelectedDcr(row);
    setViewModalOpen(true);
  };

  const handleAction = (id: string, newStatus: string) => {
    setDcrs(dcrs.map(d => d.id === id ? { ...d, status: newStatus } : d));
    if (selectedDcr && selectedDcr.id === id) {
      setSelectedDcr({ ...selectedDcr, status: newStatus });
      setViewModalOpen(false);
    }
  };

  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'mr', label: 'Medical Representative', render: (row: any) => <span className="font-bold text-slate-800">{row.mr}</span> },
    { key: 'docVisited', label: 'Doctors Visited', render: (row: any) => <span className="font-semibold text-blue-600">{row.docVisited}</span> },
    { key: 'chemVisited', label: 'Chemists Visited', render: (row: any) => <span className="font-semibold text-violet-600">{row.chemVisited}</span> },
    { key: 'ordersBooked', label: 'Orders Booked', render: (row: any) => <span className="font-semibold text-emerald-600">{row.ordersBooked}</span> },
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
          <button onClick={() => handleView(row)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View DCR">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="Daily Call Reports (DCR Review)" 
        subtitle="Review and approve daily field activity reports submitted by Medical Representatives."
      />

      <div className="mb-6 bg-blue-50/50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-blue-800">Awaiting MR Execution Data</h4>
          <p className="text-sm text-blue-600 mt-1">
            DCR reviews are deferred until the Medical Representative execution modules are implemented.
          </p>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by MR name..." />
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
        <DataTable columns={columns} data={filteredData} emptyMessage="No DCRs available for review." />
      </TableCard>

      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="DCR Details"
        footer={
          <div className="flex justify-between w-full">
             <ActionButton variant="secondary" onClick={() => setViewModalOpen(false)}>Close</ActionButton>
             {selectedDcr?.status === 'Pending' && (
                <div className="flex gap-2">
                   <ActionButton variant="danger" onClick={() => handleAction(selectedDcr.id, 'Rejected')}>Reject</ActionButton>
                   <ActionButton variant="secondary" onClick={() => handleAction(selectedDcr.id, 'Changes Requested')}>Request Changes</ActionButton>
                   <ActionButton variant="primary" onClick={() => handleAction(selectedDcr.id, 'Approved')}>Approve</ActionButton>
                </div>
             )}
          </div>
        }
      >
        {selectedDcr && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Report Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <DrawerField label="Medical Representative" value={selectedDcr.mr} />
                <DrawerField label="Date" value={selectedDcr.date} />
                <DrawerField label="Doctors Visited" value={selectedDcr.docVisited} />
                <DrawerField label="Chemists Visited" value={selectedDcr.chemVisited} />
                <DrawerField label="Orders Booked" value={selectedDcr.ordersBooked} />
                <DrawerField label="Current Status" value={
                   <Badge variant={
                      selectedDcr.status === 'Approved' ? 'success' : 
                      selectedDcr.status === 'Pending' ? 'warning' : 
                      selectedDcr.status === 'Rejected' ? 'danger' : 'info'
                   }>{selectedDcr.status}</Badge>
                } />
              </div>
            </div>
            
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-sm text-blue-700 text-center">
              This screen is for review and approval only. Data cannot be edited directly by the ASM.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
