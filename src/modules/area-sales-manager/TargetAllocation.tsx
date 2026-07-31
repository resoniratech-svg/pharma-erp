import React, { useState, useEffect } from 'react';
import { PageHeader, FilterBar, SearchInput, SelectFilter, TableCard, DataTable, Badge, ActionButton, DrawerField } from './components/shared';
import { Share2, AlertCircle, Plus, Trash2, Search, FileEdit, X, Eye } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { asmService } from '../../services/asmService';
import type { ASMTargetSummary } from '../../services/asmService';
import type { Employee } from '../super-admin/sales-organization/types';
import type { TargetAllocationRecord } from '../../services/targetAllocationService';

export default function TargetAllocation() {
  const [summaries, setSummaries] = useState<ASMTargetSummary[]>([]);
  const [mrs, setMrs] = useState<Employee[]>([]);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<TargetAllocationRecord | null>(null);
  const [editAllocationId, setEditAllocationId] = useState<string | null>(null);
  
  const selectedSummary = summaries.find(s => s.parentAllocation.id === selectedRowId) || null;
  const currentAllocations = selectedSummary ? selectedSummary.allocations : [];

  const [allocationRows, setAllocationRows] = useState<{ mrId: string; amount: string; financialYear: string; allocationPeriod: string; startDate: string; endDate: string; remarks: string }[]>([]);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    try {
      setSummaries(asmService.getTargetSummaries());
      setMrs(asmService.getReportingMRs());
    } catch (e) {
      console.warn("Failed to load targets", e);
    }
  };

  const filteredTargets = summaries.filter(s => {
    const row = s.parentAllocation;
    const codeMatches = row.id?.toLowerCase().includes(search.toLowerCase());
    
    let allocStatus = 'Pending Allocation';
    if (s.remainingAmount === 0 && row.targetAmount > 0) allocStatus = 'Fully Allocated';
    else if (s.allocatedAmount > 0) allocStatus = 'Partially Allocated';

    const statusMatches = statusFilter ? allocStatus === statusFilter : true;
    return codeMatches && statusMatches;
  });

  const handleRowClick = (row: any) => {
    setSelectedRowId(row.parentAllocation.id);
  };

  const handleOpenAllocate = () => {
    if (!selectedSummary) return;
    setEditAllocationId(null);
    setAllocationRows([{ mrId: '', amount: '', financialYear: selectedSummary.parentAllocation.financialYear || '', allocationPeriod: '', startDate: '', endDate: '', remarks: '' }]);
    setDrawerOpen(true);
  };

  const handleAddAllocationRow = () => {
    setAllocationRows([...allocationRows, { mrId: '', amount: '', financialYear: selectedSummary?.parentAllocation.financialYear || '', allocationPeriod: '', startDate: '', endDate: '', remarks: '' }]);
  };

  const handleRemoveAllocationRow = (index: number) => {
    setAllocationRows(allocationRows.filter((_, i) => i !== index));
  };

  const handleAllocationChange = (index: number, field: string, value: string) => {
    const updated = [...allocationRows];
    (updated[index] as any)[field] = value;
    setAllocationRows(updated);
  };

  const handleViewAllocation = (alloc: TargetAllocationRecord) => {
    setSelectedAllocation(alloc);
    setViewDrawerOpen(true);
  };

  const handleEditAllocation = (alloc: TargetAllocationRecord) => {
    if (!selectedSummary) return;
    setAllocationRows([{ 
      mrId: alloc.allocatedToEmployeeId, 
      amount: alloc.targetAmount.toString(),
      financialYear: alloc.financialYear || '',
      allocationPeriod: alloc.allocationPeriod || '',
      startDate: alloc.startDate || '',
      endDate: alloc.endDate || '',
      remarks: alloc.remarks || ''
    }]);
    setEditAllocationId(alloc.id);
    setDrawerOpen(true);
  };

  const handleCancelAllocation = (allocId: string) => {
    if (window.confirm('Are you sure you want to cancel this allocation?')) {
      try {
        asmService.cancelAllocation(allocId);
        refreshData();
      } catch (err: any) {
        alert(err.message || 'Error canceling allocation');
      }
    }
  };

  // Live validation calculations
  const totalNewAllocation = allocationRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  
  let originalEditAmount = 0;
  if (editAllocationId && selectedSummary) {
    const originalAlloc = currentAllocations.find(a => a.id === editAllocationId);
    if (originalAlloc) originalEditAmount = originalAlloc.targetAmount;
  }
  
  const remainingAfterAllocation = (selectedSummary?.remainingAmount || 0) + originalEditAmount - totalNewAllocation;
  const isOverAllocated = remainingAfterAllocation < 0;

  const handleSaveAllocation = () => {
    if (!selectedSummary || isOverAllocated) return;
    
    try {
      if (editAllocationId) {
        const row = allocationRows[0];
        if (!row.mrId || Number(row.amount) <= 0) {
          throw new Error("Please select an MR and enter a valid amount greater than zero.");
        }
        asmService.updateAllocation(editAllocationId, Number(row.amount), row.mrId);
      } else {
        for (const r of allocationRows) {
          if (!r.mrId || Number(r.amount) <= 0) {
            throw new Error("Please select an MR and enter a valid amount greater than zero.");
          }
          if (!r.financialYear || !r.allocationPeriod || !r.startDate || !r.endDate) {
            throw new Error("Financial Year, Allocation Period, Start Date, and End Date are required.");
          }
          asmService.allocateToMR(
            selectedSummary.parentAllocation.id, 
            r.mrId, 
            Number(r.amount), 
            r.financialYear,
            r.allocationPeriod,
            r.startDate, 
            r.endDate,
            r.remarks
          );
        }
      }
      refreshData();
      setDrawerOpen(false);
    } catch (e: any) {
      alert(e.message || "An error occurred while saving the allocation.");
    }
  };

  const targetColumns = [
    { 
      key: 'select', 
      label: '', 
      width: '40px',
      render: (row: ASMTargetSummary) => (
        <input 
          type="radio" 
          name="targetSelection"
          checked={selectedRowId === row.parentAllocation.id} 
          onChange={() => handleRowClick(row)}
          className="w-4 h-4 text-[#163c78] focus:ring-[#163c78] cursor-pointer"
        />
      )
    },
    { 
      key: 'parentAllocation.id', 
      label: 'Received Allocation ID',
      render: (row: ASMTargetSummary) => <span className="font-medium text-slate-800">{(row.parentAllocation as any).id || (row.parentAllocation as any).allocationId || 'N/A'}</span>
    },
    { 
      key: 'parentAllocation.financialYear', 
      label: 'Financial Year',
      render: (row: ASMTargetSummary) => row.parentAllocation.financialYear || '2026-2027'
    },
    { 
      key: 'parentAllocation.targetAmount', 
      label: 'Assigned Target',
      render: (row: ASMTargetSummary) => `₹${(row.parentAllocation.targetAmount / 100000).toFixed(2)} L`
    },
    { 
      key: 'allocatedAmount', 
      label: 'Allocated',
      render: (row: ASMTargetSummary) => `₹${(row.allocatedAmount / 100000).toFixed(2)} L`
    },
    { 
      key: 'remainingAmount', 
      label: 'Remaining',
      render: (row: ASMTargetSummary) => (
        <span className={row.remainingAmount > 0 ? 'text-amber-600 font-semibold' : 'text-slate-600'}>
          ₹{(row.remainingAmount / 100000).toFixed(2)} L
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (row: ASMTargetSummary) => {
        let allocStatus = 'Pending Allocation';
        let variant: any = 'danger';
        if (row.remainingAmount === 0 && row.parentAllocation.targetAmount > 0) {
          allocStatus = 'Fully Allocated';
          variant = 'success';
        } else if (row.allocatedAmount > 0) {
          allocStatus = 'Partially Allocated';
          variant = 'warning';
        }
        return <Badge variant={variant}>{allocStatus}</Badge>;
      }
    }
  ];

  const allocationColumns = [
    { key: 'id', label: 'Allocation ID' },
    { key: 'allocatedToEmployeeName', label: 'Medical Representative' },
    { key: 'allocationPeriod', label: 'Period' },
    { 
      key: 'targetAmount', 
      label: 'Allocated Amount',
      render: (row: TargetAllocationRecord) => <span className="font-semibold text-slate-800">₹{(row.targetAmount / 100000).toFixed(2)} L</span>
    },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    { 
      key: 'status', 
      label: 'Status',
      render: (row: TargetAllocationRecord) => <Badge variant={row.status === 'Active' ? 'success' : row.status === 'Cancelled' ? 'danger' : 'neutral'}>{row.status}</Badge>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: TargetAllocationRecord) => (
        <div className="flex gap-2">
          <button onClick={() => handleViewAllocation(row)} className="p-1 text-slate-400 hover:text-[#163c78] transition-colors" title="View Allocation"><Eye className="w-4 h-4" /></button>
          {row.status === 'Active' && (
            <>
              <button onClick={() => handleEditAllocation(row)} className="p-1 text-slate-400 hover:text-emerald-600 transition-colors" title="Edit Allocation"><FileEdit className="w-4 h-4" /></button>
              <button onClick={() => handleCancelAllocation(row.id)} className="p-1 text-slate-400 hover:text-rose-600 transition-colors" title="Cancel Allocation"><X className="w-4 h-4" /></button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="Target Allocation" 
        subtitle="Allocate Area Targets to Medical Representatives."
        actions={
          <ActionButton 
            variant="primary" 
            icon={<Share2 className="w-4 h-4" />} 
            onClick={handleOpenAllocate}
            className={!selectedSummary ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
          >
            Allocate Target
          </ActionButton>
        }
      />

      <div className="mb-6 bg-blue-50/50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-blue-800">Allocation Workflow</h4>
          <p className="text-sm text-blue-600 mt-1">
            Select an Assigned Target from the list below to view its details or allocate it to Medical Representatives. Total allocation cannot exceed the Assigned Target.
          </p>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Assigned Targets (Received from RSM)</h2>
        </div>
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search Received Allocation ID..." />
          <SelectFilter 
            value={statusFilter} 
            onChange={setStatusFilter} 
            placeholder="All Statuses"
            options={[
              { label: 'Pending Allocation', value: 'Pending Allocation' },
              { label: 'Partially Allocated', value: 'Partially Allocated' },
              { label: 'Fully Allocated', value: 'Fully Allocated' }
            ]}
          />
        </FilterBar>

        <TableCard>
          <DataTable 
            columns={targetColumns} 
            data={filteredTargets} 
            emptyMessage="No targets have been assigned to you yet." 
            onRowClick={handleRowClick}
          />
        </TableCard>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">
            Allocation Details 
            {selectedSummary && <span className="text-slate-500 font-normal ml-2">for {selectedSummary.parentAllocation.id}</span>}
          </h2>
        </div>
        
        {selectedRowId ? (
          <TableCard>
            <DataTable 
              columns={allocationColumns} 
              data={currentAllocations} 
              emptyMessage="No allocations have been made for this target yet." 
            />
          </TableCard>
        ) : (
           <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 rounded-2xl border-dashed">
             <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
               <Search className="w-8 h-8 text-slate-400" />
             </div>
             <p className="text-slate-500 font-medium text-center">Select an Assigned Target from the master table<br/>to view its allocation details.</p>
           </div>
        )}
      </div>

      {/* Allocate / Edit Modal */}
      <Modal 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        title={editAllocationId ? "Edit Allocation" : "Allocate Target to Medical Representatives"}
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setDrawerOpen(false)}>Cancel</ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={handleSaveAllocation} 
              className={isOverAllocated || allocationRows.length === 0 ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''}
            >
              Save {editAllocationId ? "Changes" : "Allocation"}
            </ActionButton>
          </>
        }
      >
        {selectedSummary && (
          <div className="space-y-6 flex flex-col h-[70vh]">
            {/* Live Validation Banner */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 flex-shrink-0 ${isOverAllocated ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
              <AlertCircle className={`w-5 h-5 flex-shrink-0 ${isOverAllocated ? 'text-rose-600' : 'text-slate-500'}`} />
              <div className="w-full">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Assigned Target</span>
                  <span className="text-sm font-bold text-slate-800">₹{(selectedSummary.parentAllocation.targetAmount / 100000).toFixed(2)} L</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Already Allocated</span>
                  <span className="text-sm font-bold text-slate-800">₹{(selectedSummary.allocatedAmount / 100000).toFixed(2)} L</span>
                </div>
                {editAllocationId && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Original Amount (Freed)</span>
                    <span className="text-sm font-bold text-slate-800">+₹{(originalEditAmount / 100000).toFixed(2)} L</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Remaining Target</span>
                  <span className={`text-sm font-bold ${isOverAllocated ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{(remainingAfterAllocation / 100000).toFixed(2)} L
                  </span>
                </div>
                {isOverAllocated && (
                  <p className="text-xs text-rose-600 mt-2 font-medium">Error: Allocation exceeds the remaining assigned target.</p>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 pb-4">
              <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 py-2">
                <h3 className="text-sm font-bold text-slate-800">{editAllocationId ? "Edit Row" : "MR Allocations"}</h3>
                {!editAllocationId && (
                  <ActionButton variant="secondary" onClick={handleAddAllocationRow} icon={<Plus className="w-4 h-4" />} className="!py-1.5 !px-3 !text-xs">
                    Add Row
                  </ActionButton>
                )}
              </div>

              <div className="space-y-4">
                {allocationRows.map((row, index) => (
                  <div key={index} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative">
                    {!editAllocationId && (
                      <button 
                        onClick={() => handleRemoveAllocationRow(index)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    <div className="grid gap-4 pr-6">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Select Medical Representative *</label>
                        <select 
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#163c78]/30"
                          value={row.mrId}
                          onChange={(e) => handleAllocationChange(index, 'mrId', e.target.value)}
                        >
                          <option value="">-- Select MR --</option>
                          {mrs.map(r => (
                            <option key={r.id} value={r.id}>{r.employeeName} ({r.designation})</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Financial Year *</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-700 cursor-not-allowed"
                            value={row.financialYear}
                            disabled
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Allocation Period *</label>
                          <select
                            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#163c78]/30"
                            value={row.allocationPeriod}
                            onChange={(e) => handleAllocationChange(index, 'allocationPeriod', e.target.value)}
                          >
                            <option value="">-- Select Period --</option>
                            <option value="Annual">Annual</option>
                            <option value="Half-Yearly">Half-Yearly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Monthly">Monthly</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Start Date *</label>
                          <input 
                            type="date"
                            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#163c78]/30"
                            value={row.startDate}
                            onChange={(e) => handleAllocationChange(index, 'startDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">End Date *</label>
                          <input 
                            type="date"
                            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#163c78]/30"
                            value={row.endDate}
                            onChange={(e) => handleAllocationChange(index, 'endDate', e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Allocation Amount (₹) *</label>
                        <input 
                          type="number"
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#163c78]/30"
                          placeholder="e.g. 1500000"
                          value={row.amount}
                          onChange={(e) => handleAllocationChange(index, 'amount', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Remarks (Optional)</label>
                        <input 
                          type="text"
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#163c78]/30"
                          placeholder="Enter remarks..."
                          value={row.remarks}
                          onChange={(e) => handleAllocationChange(index, 'remarks', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* View Allocation Modal */}
      <Modal 
        isOpen={viewDrawerOpen} 
        onClose={() => setViewDrawerOpen(false)} 
        title="Allocation Summary"
        footer={
          <ActionButton variant="secondary" onClick={() => setViewDrawerOpen(false)}>Close</ActionButton>
        }
      >
        {selectedAllocation && selectedSummary && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Parent Target Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <DrawerField label="Received Allocation ID" value={selectedSummary.parentAllocation.id} />
                <DrawerField label="Financial Year" value={selectedSummary.parentAllocation.financialYear} />
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Allocation Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <DrawerField label="Allocation ID" value={selectedAllocation.id} />
                <DrawerField label="Medical Representative" value={selectedAllocation.allocatedToEmployeeName} />
                <DrawerField label="Allocation Period" value={selectedAllocation.allocationPeriod} />
                <DrawerField label="Start Date" value={selectedAllocation.startDate} />
                <DrawerField label="End Date" value={selectedAllocation.endDate} />
                <DrawerField label="Allocated Amount" value={`₹${(selectedAllocation.targetAmount / 100000).toFixed(2)} L`} />
                <DrawerField label="Allocated By" value={selectedAllocation.allocatedByEmployeeId} />
                <DrawerField label="Status" value={<Badge variant={selectedAllocation.status === 'Active' ? 'success' : selectedAllocation.status === 'Cancelled' ? 'danger' : 'neutral'}>{selectedAllocation.status}</Badge>} />
              </div>
              {selectedAllocation.remarks && (
                <div className="mt-4">
                  <DrawerField label="Remarks" value={selectedAllocation.remarks} />
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
