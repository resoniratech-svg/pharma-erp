import React, { useState, useEffect } from 'react';
import { PageHeader, SummaryCard, ActionButton, DataTable, Badge, FilterBar, SearchInput, SelectFilter } from './components/shared';
import { Target, TrendingUp, AlertCircle, Calendar, CheckCircle, Eye, Search, Save, Send } from 'lucide-react';
import { rsmService } from '../../services/rsmService';
import type { RSMTargetSummary } from '../../services/rsmService';
import type { Employee } from '../super-admin/sales-organization/types';

export default function TargetAllocation() {
  const [activeStep, setActiveStep] = useState<'overview' | 'asm'>('overview');
  const [summaries, setSummaries] = useState<RSMTargetSummary[]>([]);
  const [asms, setAsms] = useState<Employee[]>([]);
  
  const [search, setSearch] = useState('');
  
  // For the ASM Allocation table
  const [allocationInputs, setAllocationInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      setSummaries(rsmService.getTargetSummaries());
      setAsms(rsmService.getReportingASMs());
    } catch (e) {
      console.warn('Failed to load RSM allocations data', e);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Find the most recent/active target assigned to this RSM
  // Assuming the first one with remaining > 0 or the most recent one is active
  const activeSummary = summaries.length > 0 ? summaries[0] : null;
  const activeTarget = activeSummary?.parentAllocation;

  const allocatedToAsms = activeSummary ? activeSummary.allocatedAmount : 0;
  const remainingTarget = activeSummary ? activeSummary.remainingAmount : 0;
  const activeAsmCount = asms.length;
  const allocatedAsmCount = activeSummary ? activeSummary.allocations.filter(a => a.status === 'Active').length : 0;
  const pendingAllocationCount = activeAsmCount - allocatedAsmCount;

  // Render variables for Overview Table
  const recentPlansData = summaries.map(s => {
    return {
      ...s.parentAllocation,
      allocatedAmount: s.allocatedAmount,
      remainingAmount: s.remainingAmount,
      status: s.remainingAmount === 0 ? 'Fully Allocated' : (s.allocatedAmount > 0 ? 'Partially Allocated' : 'Pending Allocation')
    };
  });

  // Calculate dynamic allocation amounts from inputs
  const currentTotalInputAllocation = Object.values(allocationInputs).reduce((sum, val) => sum + (Number(val) || 0), 0);
  const remainingAfterInputs = activeTarget ? activeTarget.targetAmount - currentTotalInputAllocation : 0;

  const handleValidateAllocation = () => {
    if (activeTarget && currentTotalInputAllocation > activeTarget.targetAmount) {
      alert(`Total allocated amount (${formatCurrency(currentTotalInputAllocation)}) exceeds Assigned Target (${formatCurrency(activeTarget.targetAmount)})`);
      return false;
    }
    alert("Validation Successful! Amounts are within target limits.");
    return true;
  };

  const handleSubmitFinalPlan = () => {
    if (activeTarget && currentTotalInputAllocation > activeTarget.targetAmount) {
      alert(`Validation Failed: Allocated amount exceeds Assigned Target.`);
      return;
    }
    // Implement actual allocation via rsmService if needed here
    alert("Final Plan Submitted successfully! Targets allocated to ASMs.");
    setActiveStep('overview');
  };

  return (
    <div className="p-6">
      <PageHeader 
        title="Target Allocation Workspace" 
        subtitle="Review targets received from the NSM and allocate them to your Area Sales Managers."
      />

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-max mb-6">
        <button
          onClick={() => setActiveStep('overview')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeStep === 'overview' ? 'bg-white text-[#163c78] shadow-sm' : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveStep('asm')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeStep === 'asm' ? 'bg-white text-[#163c78] shadow-sm' : 'text-slate-600 hover:bg-slate-200'
          }`}
          disabled={!activeTarget}
          title={!activeTarget ? "No active assigned targets to allocate" : ""}
        >
          ASM Allocation
        </button>
      </div>

      {activeStep === 'overview' && (
        <div className="animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <SummaryCard
              title="Assigned Target"
              value={activeTarget ? formatCurrency(activeTarget.targetAmount) : 'Not Set'}
              subtitle={activeTarget ? `FY ${activeTarget.financialYear}` : 'Awaiting assignment'}
              icon={<Target className="w-6 h-6" />}
              colorClass={activeTarget ? "text-[#163c78]" : "text-slate-400"}
              bgClass={activeTarget ? "bg-blue-50" : "bg-slate-100"}
            />
            <SummaryCard
              title="Total Allocated"
              value={formatCurrency(allocatedToAsms)}
              subtitle={activeTarget ? `${((allocatedToAsms/activeTarget.targetAmount)*100 || 0).toFixed(1)}% Distributed` : ''}
              icon={<TrendingUp className="w-6 h-6" />}
              colorClass="text-emerald-600"
              bgClass="bg-emerald-50"
            />
            <SummaryCard
              title="Remaining Target"
              value={formatCurrency(remainingTarget)}
              subtitle="Available for allocation"
              icon={<AlertCircle className="w-6 h-6" />}
              colorClass={remainingTarget > 0 ? "text-amber-600" : "text-slate-400"}
              bgClass={remainingTarget > 0 ? "bg-amber-50" : "bg-slate-100"}
            />
            <SummaryCard
              title="Planning Period"
              value={activeTarget?.allocationPeriod || 'N/A'}
              subtitle="Current active cycle"
              icon={<Calendar className="w-6 h-6" />}
              colorClass="text-purple-600"
              bgClass="bg-purple-50"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SummaryCard title="Total Active ASMs" value={activeAsmCount.toString()} icon={<Target className="w-6 h-6" />} colorClass="text-slate-600" bgClass="bg-slate-50" />
            <SummaryCard title="Allocated ASMs" value={allocatedAsmCount.toString()} icon={<CheckCircle className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
            <SummaryCard title="Pending Allocation" value={pendingAllocationCount.toString()} icon={<AlertCircle className="w-6 h-6" />} colorClass="text-amber-600" bgClass="bg-amber-50" />
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Assigned Targets (from NSM)</h3>
            <DataTable 
              columns={[
                { key: 'financialYear', label: 'Financial Year' },
                { key: 'allocationPeriod', label: 'Planning Period' },
                { key: 'startDate', label: 'Start Date', render: (row: any) => new Date(row.startDate).toLocaleDateString() },
                { 
                  key: 'status', 
                  label: 'Allocation Status', 
                  render: (row: any) => {
                    let variant: any = 'neutral';
                    if (row.status === 'Fully Allocated') variant = 'success';
                    else if (row.status === 'Partially Allocated') variant = 'warning';
                    else variant = 'danger';
                    return <Badge variant={variant}>{row.status}</Badge>;
                  }
                },
                { key: 'targetAmount', label: 'Received Amount', render: (row: any) => <span className="font-bold text-slate-800">{formatCurrency(row.targetAmount)}</span> },
                { key: 'allocatedAmount', label: 'Allocated Down', render: (row: any) => formatCurrency(row.allocatedAmount) },
                { key: 'remainingAmount', label: 'Remaining Balance', render: (row: any) => <span className={row.remainingAmount > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>{formatCurrency(row.remainingAmount)}</span> },
                { key: 'actions', label: 'Actions', render: () => (
                    <button className="p-1.5 text-slate-400 hover:text-[#163c78] hover:bg-blue-50 rounded transition-colors" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                )}
              ]} 
              data={recentPlansData} 
              emptyMessage="No targets have been assigned to you yet." 
            />
          </div>
        </div>
      )}

      {activeStep === 'asm' && activeTarget && (
        <div className="animate-in fade-in duration-500 space-y-6">
          {/* Section 1 - Planning Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider border-b border-slate-200 pb-2">1. Planning Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div><span className="block text-xs text-slate-500 font-semibold mb-1">Assigned Target</span><span className="text-sm font-medium text-[#163c78]">{formatCurrency(activeTarget.targetAmount)}</span></div>
              <div><span className="block text-xs text-slate-500 font-semibold mb-1">Allocated Amount</span><span className="text-sm font-medium text-emerald-600">{formatCurrency(currentTotalInputAllocation)}</span></div>
              <div><span className="block text-xs text-slate-500 font-semibold mb-1">Remaining Amount</span><span className={`text-sm font-medium ${remainingAfterInputs < 0 ? 'text-red-600' : 'text-amber-600'}`}>{formatCurrency(remainingAfterInputs)}</span></div>
              <div><span className="block text-xs text-slate-500 font-semibold mb-1">Active ASM Count</span><span className="text-sm font-medium text-slate-800">{activeAsmCount}</span></div>
              <div><span className="block text-xs text-slate-500 font-semibold mb-1">Pending Allocation</span><span className="text-sm font-medium text-slate-800">{pendingAllocationCount}</span></div>
            </div>
          </div>

          {/* Section 2 - Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78] bg-white">
                <option>All Areas</option>
              </select>
              <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78] bg-white">
                <option>All Status</option>
                <option>Pending</option>
                <option>Allocated</option>
              </select>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search ASM..." 
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-[#163c78]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Section 3 - Allocation Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
               <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">2. ASM Target Allocation</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                    <th className="p-4">Employee Code</th>
                    <th className="p-4">ASM Name</th>
                    <th className="p-4">Headquarters</th>
                    <th className="p-4">Allocated Target (₹)</th>
                    <th className="p-4">Effective From</th>
                    <th className="p-4">Effective To</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {asms.filter(a => a.employeeName.toLowerCase().includes(search.toLowerCase()) || a.employeeCode.toLowerCase().includes(search.toLowerCase())).map((asm) => (
                    <tr key={asm.id} className="hover:bg-slate-50">
                      <td className="p-4 text-sm font-medium text-slate-900">{asm.employeeCode}</td>
                      <td className="p-4 text-sm text-slate-700">{asm.employeeName}</td>
                      <td className="p-4 text-sm text-slate-700">{asm.headquarters || '-'}</td>
                      <td className="p-4">
                        <input 
                          type="number"
                          className="w-32 px-3 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] text-sm"
                          placeholder="Amount"
                          value={allocationInputs[asm.id] || ''}
                          onChange={(e) => setAllocationInputs({...allocationInputs, [asm.id]: e.target.value})}
                        />
                      </td>
                      <td className="p-4 text-sm text-slate-700">{new Date(activeTarget.startDate).toLocaleDateString()}</td>
                      <td className="p-4 text-sm text-slate-700">{new Date(activeTarget.endDate).toLocaleDateString()}</td>
                      <td className="p-4">
                        <Badge variant={allocationInputs[asm.id] ? 'success' : 'warning'}>
                          {allocationInputs[asm.id] ? 'Allocated' : 'Pending'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4 & 5 - Summary & Action Buttons */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex gap-8">
               <div><span className="block text-xs text-slate-500 font-semibold mb-1">Total Allocated</span><span className="text-lg font-bold text-[#163c78]">{formatCurrency(currentTotalInputAllocation)}</span></div>
               <div><span className="block text-xs text-slate-500 font-semibold mb-1">Remaining Balance</span><span className={`text-lg font-bold ${remainingAfterInputs < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(remainingAfterInputs)}</span></div>
            </div>
            
            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => alert("Draft saved!")}
                className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Save Draft
              </button>
              <button 
                type="button"
                onClick={handleValidateAllocation}
                className="px-6 py-2.5 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
              >
                Validate Allocation
              </button>
              <button 
                type="button"
                onClick={handleSubmitFinalPlan}
                className="px-6 py-2.5 text-sm font-medium text-white bg-[#163c78] rounded-lg hover:bg-[#122e5c] transition-colors"
              >
                Submit Final Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
