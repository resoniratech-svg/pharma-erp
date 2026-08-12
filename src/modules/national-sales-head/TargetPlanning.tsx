import React, { useState, useEffect } from 'react';
import { PageHeader, SummaryCard, ActionButton, DataTable, Badge } from './components/shared';
import { Target, TrendingUp, AlertCircle, Calendar, Save, Search, Send, Edit2, X, Eye, Loader2, CheckCircle } from 'lucide-react';
import { targetAllocationService } from '../../services/targetAllocationService';
import { employeeService } from '../../services/employeeService';
import { exportToCSV } from '../../utils/exportUtils';
import { validateCheckIn } from '../../utils/attendanceValidation';
import type { NationalTargetRecord, TargetAllocationRecord } from '../../services/targetAllocationService';

export default function TargetPlanning() {
  const [activeStep, setActiveStep] = useState<'overview' | 'national' | 'rsm'>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nationalTargets, setNationalTargets] = useState<NationalTargetRecord[]>([]);
  
  const [newNationalTarget, setNewNationalTarget] = useState({
    financialYear: '2026-27',
    planningPeriod: 'Annual' as 'Annual' | 'Quarterly' | 'Monthly',
    targetType: 'Sales Value' as 'Sales Value' | 'Sales Volume' | 'Both',
    targetAmount: '',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    remarks: ''
  });

  const [rsmAllocations, setRsmAllocations] = useState<TargetAllocationRecord[]>([]);
  const [rsmData, setRsmData] = useState<any[]>([]);
  const [allocationInputs, setAllocationInputs] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [editModal, setEditModal] = useState<{isOpen: boolean, rsm: any, amount: string, remarks: string, originalAmount: string} | null>(null);
  const [viewPlanModal, setViewPlanModal] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (newNationalTarget.financialYear && newNationalTarget.planningPeriod) {
      const yearStr = newNationalTarget.financialYear.substring(0, 4);
      const startYear = parseInt(yearStr, 10);
      const endYear = startYear + 1;
      
      let start = '';
      let end = '';
      
      if (newNationalTarget.planningPeriod === 'Annual') {
        start = `${startYear}-04-01`;
        end = `${endYear}-03-31`;
      } else if (newNationalTarget.planningPeriod === 'Quarterly') {
        start = `${startYear}-04-01`;
        end = `${startYear}-06-30`;
      } else if (newNationalTarget.planningPeriod === 'Monthly') {
        start = `${startYear}-04-01`;
        end = `${startYear}-04-30`;
      }
      
      setNewNationalTarget(prev => ({...prev, startDate: start, endDate: end}));
    }
  }, [newNationalTarget.financialYear, newNationalTarget.planningPeriod]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [targets, allocations, employees] = await Promise.all([
        targetAllocationService.getNationalTargets(),
        targetAllocationService.getAllocations(),
        employeeService.getEmployees({ designation: 'Regional Sales Manager', status: 'Active' })
      ]);

      setNationalTargets(targets);
      setRsmAllocations(allocations);

      const mappedRsms = employees.map(emp => ({
        id: emp.id,
        employeeCode: emp.employeeCode,
        name: emp.employeeName,
        state: (emp as any).states && (emp as any).states.length > 0 ? (emp as any).states.join(', ') : (emp.area || emp.region || '-'),
        prevTarget: 0,
        currAchievement: '0%'
      }));
      setRsmData(mappedRsms);

      const activeNT = targets.find(t => t.status === 'Active');
      if (activeNT) {
        const currentAllocations = allocations.filter(a => String(a.sourceTargetId) === String(activeNT.id) || String(a.nationalTargetId) === String(activeNT.id));
        const inputs: Record<string, string> = {};
        currentAllocations.forEach(a => {
          inputs[String(a.allocatedToEmployeeId)] = a.targetAmount.toString();
        });
        setAllocationInputs(inputs);
      }
    } catch (err: any) {
      console.error("Failed to load Target Planning data:", err);
      setError(err.message || "Failed to load Target Planning data from database.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNationalTarget = async (status: 'Draft' | 'Active') => {
    if (!validateCheckIn()) return;
    try {
      if (!newNationalTarget.targetAmount) throw new Error("Target Amount is required");
      setSaving(true);
      
      await targetAllocationService.createNationalTarget({
        financialYear: newNationalTarget.financialYear,
        planningPeriod: newNationalTarget.planningPeriod,
        targetType: newNationalTarget.targetType,
        targetAmount: Number(newNationalTarget.targetAmount),
        startDate: newNationalTarget.startDate,
        endDate: newNationalTarget.endDate,
        remarks: newNationalTarget.remarks,
        status: status
      });

      await loadData();
      setActiveStep(status === 'Active' ? 'rsm' : 'overview');
    } catch (err: any) {
      alert(err.message || "Failed to create National Target");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return '₹' + (amount / 10000000).toFixed(2) + ' Cr';
    } else if (amount >= 100000) {
      return '₹' + (amount / 100000).toFixed(2) + ' L';
    } else if (amount >= 1000) {
      return '₹' + (amount / 1000).toFixed(2) + ' K';
    } else {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amount);
    }
  };

  const activeNationalTarget = nationalTargets.find(t => t.status === 'Active');
  
  // Calculate allocated amount to RSMs
  const allocatedToRsms = activeNationalTarget ? 
    rsmAllocations
      .filter(a => (String(a.sourceTargetId) === String(activeNationalTarget.id) || String(a.nationalTargetId) === String(activeNationalTarget.id)) && (a.status === 'Active' || a.status === 'Allocated'))
      .reduce((sum, a) => sum + a.targetAmount, 0)
    : 0;

  const remainingNational = activeNationalTarget ? activeNationalTarget.targetAmount - allocatedToRsms : 0;
  const activeRsmCount = rsmData.length;
  const allocatedRsmCount = activeNationalTarget ? rsmAllocations.filter(a => (String(a.sourceTargetId) === String(activeNationalTarget.id) || String(a.nationalTargetId) === String(activeNationalTarget.id)) && (a.status === 'Active' || a.status === 'Allocated')).length : 0;
  const pendingAllocationCount = Math.max(0, activeRsmCount - allocatedRsmCount);

  // Render variables for Overview Table
  const recentPlansData = nationalTargets.map(t => {
    const allocationsForThis = rsmAllocations.filter(a => (String(a.sourceTargetId) === String(t.id) || String(a.nationalTargetId) === String(t.id)) && (a.status === 'Active' || a.status === 'Allocated'));
    const allocated = allocationsForThis.reduce((sum, a) => sum + a.targetAmount, 0);
    return {
      ...t,
      allocatedAmount: allocated,
      remainingAmount: t.targetAmount - allocated
    };
  });

  // Calculate dynamic allocation amounts from inputs
  const currentTotalInputAllocation = Object.values(allocationInputs).reduce((sum, val) => sum + (Number(val) || 0), 0);
  const remainingAfterInputs = activeNationalTarget ? activeNationalTarget.targetAmount - currentTotalInputAllocation : 0;

  const handleSaveDraft = async () => {
    if (!validateCheckIn()) return;
    if (!activeNationalTarget) return;
    try {
      setSaving(true);
      for (const [rsmId, amount] of Object.entries(allocationInputs)) {
        const numAmount = Number(amount);
        if (numAmount > 0) {
          const existing = rsmAllocations.find(a => String(a.allocatedToEmployeeId) === String(rsmId) && (String(a.sourceTargetId) === String(activeNationalTarget.id) || String(a.nationalTargetId) === String(activeNationalTarget.id)));
          if (existing) {
            await targetAllocationService.updateAllocation(existing.id, { targetAmount: numAmount, status: 'Draft' });
          } else {
            await targetAllocationService.allocateTarget({
              nationalTargetId: activeNationalTarget.id,
              financialYear: activeNationalTarget.financialYear,
              allocationPeriod: activeNationalTarget.planningPeriod || 'Annual',
              allocatedToEmployeeId: rsmId,
              targetAmount: numAmount,
              startDate: activeNationalTarget.startDate,
              endDate: activeNationalTarget.endDate,
              status: 'Draft'
            });
          }
        }
      }
      alert("Draft allocations saved successfully in DB!");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save draft allocations");
    } finally {
      setSaving(false);
    }
  };

  const handleValidateAllocation = () => {
    if (!validateCheckIn()) return false;
    if (activeNationalTarget && currentTotalInputAllocation > activeNationalTarget.targetAmount) {
      alert(`Total allocated amount (${formatCurrency(currentTotalInputAllocation)}) exceeds National Target (${formatCurrency(activeNationalTarget.targetAmount)})`);
      return false;
    }
    alert("Validation Successful! Total allocated amounts are within the National Target pool limit.");
    return true;
  };

  const handleSubmitFinalPlan = async () => {
    if (!validateCheckIn()) return;
    if (!activeNationalTarget) return;
    if (currentTotalInputAllocation > activeNationalTarget.targetAmount) {
      alert(`Validation Failed: Allocated amount exceeds National Target.`);
      return;
    }
    
    try {
      setSaving(true);
      for (const [rsmId, amount] of Object.entries(allocationInputs)) {
        const numAmount = Number(amount);
        if (numAmount > 0) {
          const existing = rsmAllocations.find(a => String(a.allocatedToEmployeeId) === String(rsmId) && (String(a.sourceTargetId) === String(activeNationalTarget.id) || String(a.nationalTargetId) === String(activeNationalTarget.id)));
          if (existing) {
            await targetAllocationService.updateAllocation(existing.id, { targetAmount: numAmount, status: 'Active' });
          } else {
            await targetAllocationService.allocateTarget({
              nationalTargetId: activeNationalTarget.id,
              financialYear: activeNationalTarget.financialYear,
              allocationPeriod: activeNationalTarget.planningPeriod || 'Annual',
              allocatedToEmployeeId: rsmId,
              targetAmount: numAmount,
              startDate: activeNationalTarget.startDate,
              endDate: activeNationalTarget.endDate,
              status: 'Active'
            });
          }
        }
      }

      alert("Final Plan Submitted successfully! Targets allocated to RSMs in database.");
      await loadData();
      setActiveStep('overview');
    } catch (err: any) {
      alert(err.message || "Failed to submit final target plan");
    } finally {
      setSaving(false);
    }
  };

  const getStatus = (rsmId: string) => {
    if (!activeNationalTarget) return 'Pending';
    const alloc = rsmAllocations.find(a => String(a.allocatedToEmployeeId) === String(rsmId) && (String(a.sourceTargetId) === String(activeNationalTarget.id) || String(a.nationalTargetId) === String(activeNationalTarget.id)));
    if (alloc) return alloc.status === 'Active' ? 'Allocated' : alloc.status;
    return 'Pending';
  };

  const handleOpenEdit = (rsm: any) => {
    setEditModal({
      isOpen: true,
      rsm,
      amount: allocationInputs[rsm.id] || '',
      remarks: '',
      originalAmount: allocationInputs[rsm.id] || ''
    });
  };

  const handleUpdateAllocation = async () => {
    if (!validateCheckIn()) return;
    if (!editModal || !activeNationalTarget) return;
    const numAmount = Number(editModal.amount);
    if (numAmount <= 0) {
      alert("Amount must be greater than zero.");
      return;
    }
    
    const oldAmount = Number(editModal.originalAmount) || 0;
    const difference = numAmount - oldAmount;
    
    if (currentTotalInputAllocation + difference > activeNationalTarget.targetAmount) {
      alert(`Validation Failed: Total allocated amount would exceed National Target pool.`);
      return;
    }

    try {
      setSaving(true);
      const existing = rsmAllocations.find(a => String(a.allocatedToEmployeeId) === String(editModal.rsm.id) && (String(a.sourceTargetId) === String(activeNationalTarget.id) || String(a.nationalTargetId) === String(activeNationalTarget.id)));
      if (existing) {
        await targetAllocationService.updateAllocation(existing.id, { targetAmount: numAmount, remarks: editModal.remarks });
      }
      
      setAllocationInputs(prev => ({...prev, [editModal.rsm.id]: editModal.amount}));
      alert("Allocation updated successfully in database!");
      setEditModal(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update allocation");
    } finally {
      setSaving(false);
    }
  };

  const filteredRsmData = rsmData.filter(rsm => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const allocVal = allocationInputs[rsm.id] || '';
    const status = getStatus(rsm.id).toLowerCase();

    return (
      rsm.id.toString().toLowerCase().includes(q) ||
      (rsm.employeeCode || '').toLowerCase().includes(q) ||
      rsm.name.toLowerCase().includes(q) ||
      rsm.state.toLowerCase().includes(q) ||
      allocVal.includes(q) ||
      status.includes(q)
    );
  });

  return (
    <div className="p-6">
      <PageHeader 
        title="Target Planning Workspace" 
        subtitle="Define National Targets and allocate to Regional Sales Managers (Database Integrated)."
      />

      {error && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
          {error}
        </div>
      )}

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
          onClick={() => setActiveStep('national')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeStep === 'national' ? 'bg-white text-[#163c78] shadow-sm' : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          Define National Target
        </button>
        <button
          onClick={() => setActiveStep('rsm')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeStep === 'rsm' ? 'bg-white text-[#163c78] shadow-sm' : 'text-slate-600 hover:bg-slate-200'
          }`}
          disabled={!activeNationalTarget}
          title={!activeNationalTarget ? "Please submit an active National Target first to unlock this tab" : ""}
        >
          RSM Allocation
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#163c78] mb-2" />
          <p className="text-sm">Loading target plans and live allocations from database...</p>
        </div>
      ) : (
        <>
          {activeStep === 'overview' && (
            <div className="animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <SummaryCard
                  title="National Target"
                  value={activeNationalTarget ? formatCurrency(activeNationalTarget.targetAmount) : 'Not Set'}
                  subtitle={activeNationalTarget ? `FY ${activeNationalTarget.financialYear}` : 'Please define a target'}
                  icon={<Target className="w-6 h-6" />}
                  colorClass={activeNationalTarget ? "text-[#163c78]" : "text-slate-400"}
                  bgClass={activeNationalTarget ? "bg-blue-50" : "bg-slate-100"}
                />
                <SummaryCard
                  title="Total Allocated"
                  value={formatCurrency(allocatedToRsms)}
                  subtitle={activeNationalTarget ? `${((allocatedToRsms/activeNationalTarget.targetAmount)*100).toFixed(1)}% Distributed` : ''}
                  icon={<TrendingUp className="w-6 h-6" />}
                  colorClass="text-emerald-600"
                  bgClass="bg-emerald-50"
                />
                <SummaryCard
                  title="Remaining Target"
                  value={formatCurrency(remainingNational)}
                  subtitle="Available for allocation"
                  icon={<AlertCircle className="w-6 h-6" />}
                  colorClass={remainingNational > 0 ? "text-amber-600" : "text-slate-400"}
                  bgClass={remainingNational > 0 ? "bg-amber-50" : "bg-slate-100"}
                />
                <SummaryCard
                  title="Planning Period"
                  value={activeNationalTarget?.planningPeriod || 'N/A'}
                  subtitle="Current active cycle"
                  icon={<Calendar className="w-6 h-6" />}
                  colorClass="text-purple-600"
                  bgClass="bg-purple-50"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <SummaryCard title="Total Active RSMs" value={activeRsmCount.toString()} icon={<Target className="w-6 h-6" />} colorClass="text-slate-600" bgClass="bg-slate-50" />
                <SummaryCard title="Allocated RSMs" value={allocatedRsmCount.toString()} icon={<CheckCircle className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
                <SummaryCard title="Pending Allocation" value={pendingAllocationCount.toString()} icon={<AlertCircle className="w-6 h-6" />} colorClass="text-amber-600" bgClass="bg-amber-50" />
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Target Plans (from Database)</h3>
                <DataTable 
                  columns={[
                    { key: 'financialYear', label: 'Financial Year' },
                    { key: 'planningPeriod', label: 'Planning Period' },
                    { key: 'startDate', label: 'Created Date' },
                    { key: 'status', label: 'Status', render: (row: any) => <Badge variant={row.status === 'Active' ? 'success' : row.status === 'Draft' ? 'warning' : 'neutral'}>{row.status}</Badge> },
                    { key: 'allocatedAmount', label: 'Allocated Amount', render: (row: any) => formatCurrency(row.allocatedAmount) },
                    { key: 'remainingAmount', label: 'Remaining Amount', render: (row: any) => formatCurrency(row.remainingAmount) },
                    { key: 'actions', label: 'Actions', render: (row: any) => (
                        <button 
                          onClick={() => setViewPlanModal(row)}
                          className="p-1.5 text-slate-400 hover:text-[#163c78] hover:bg-blue-50 rounded transition-colors" 
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                    )}
                  ]} 
                  data={recentPlansData} 
                  emptyMessage="No national targets defined yet in the database." 
                />
              </div>
            </div>
          )}

          {activeStep === 'national' && (
            <div className="animate-in fade-in duration-500 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-4xl">
              <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">Define New National Target</h3>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Financial Year *</label>
                    <select 
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]"
                      value={newNationalTarget.financialYear}
                      onChange={(e) => setNewNationalTarget({...newNationalTarget, financialYear: e.target.value})}
                      required
                    >
                      <option value="2025-26">2025-26</option>
                      <option value="2026-27">2026-27</option>
                      <option value="2027-28">2027-28</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Planning Period *</label>
                    <select 
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]"
                      value={newNationalTarget.planningPeriod}
                      onChange={(e) => setNewNationalTarget({...newNationalTarget, planningPeriod: e.target.value as any})}
                      required
                    >
                      <option value="Annual">Annual</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">National Sales Target (₹) *</label>
                    <input 
                      type="number"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]"
                      value={newNationalTarget.targetAmount}
                      onChange={(e) => setNewNationalTarget({...newNationalTarget, targetAmount: e.target.value})}
                      required
                      min="1"
                      placeholder="e.g. 150000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Currency</label>
                    <input 
                      type="text" 
                      value="₹ (INR)" 
                      disabled 
                      className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Start Date *</label>
                    <input 
                      type="date"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]"
                      value={newNationalTarget.startDate}
                      onChange={(e) => setNewNationalTarget({...newNationalTarget, startDate: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">End Date *</label>
                    <input 
                      type="date"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]"
                      value={newNationalTarget.endDate}
                      onChange={(e) => setNewNationalTarget({...newNationalTarget, endDate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Remarks (Optional)</label>
                    <textarea 
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] min-h-[100px]"
                      value={newNationalTarget.remarks}
                      onChange={(e) => setNewNationalTarget({...newNationalTarget, remarks: e.target.value})}
                      placeholder="Enter any planning context, special conditions..."
                    />
                  </div>
                </div>
                
                <div className="pt-6 border-t border-slate-200 flex justify-end gap-4">
                  <button 
                    type="button" 
                    disabled={saving}
                    onClick={() => handleCreateNationalTarget('Draft')}
                    className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Draft
                  </button>
                  <button 
                    type="button"
                    disabled={saving}
                    onClick={() => handleCreateNationalTarget('Active')}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-[#163c78] rounded-lg hover:bg-[#122e5c] transition-colors flex items-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit National Target
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeStep === 'rsm' && activeNationalTarget && (
            <div className="animate-in fade-in duration-500 space-y-6">
              {/* Section 1 - Planning Summary */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider border-b border-slate-200 pb-2">1. Planning Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <div><span className="block text-xs text-slate-500 font-semibold mb-1">National Target</span><span className="text-sm font-medium text-[#163c78]">{formatCurrency(activeNationalTarget.targetAmount)}</span></div>
                  <div><span className="block text-xs text-slate-500 font-semibold mb-1">Allocated Amount</span><span className="text-sm font-medium text-emerald-600">{formatCurrency(currentTotalInputAllocation)}</span></div>
                  <div><span className="block text-xs text-slate-500 font-semibold mb-1">Remaining Amount</span><span className={`text-sm font-medium ${remainingAfterInputs < 0 ? 'text-red-600' : 'text-amber-600'}`}>{formatCurrency(remainingAfterInputs)}</span></div>
                  <div><span className="block text-xs text-slate-500 font-semibold mb-1">Active RSM Count</span><span className="text-sm font-medium text-slate-800">{activeRsmCount}</span></div>
                  <div><span className="block text-xs text-slate-500 font-semibold mb-1">Pending Allocation</span><span className="text-sm font-medium text-slate-800">{pendingAllocationCount}</span></div>
                </div>
              </div>

              {/* Section 2 - Filters */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search RSM by name, code or state..." 
                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-72 focus:ring-2 focus:ring-[#163c78]" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Section 3 - Allocation Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                   <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">2. RSM Target Allocation</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                        <th className="p-4">Employee Code</th>
                        <th className="p-4">RSM Name</th>
                        <th className="p-4">State</th>
                        <th className="p-4">Allocated Target (₹)</th>
                        <th className="p-4">Effective From</th>
                        <th className="p-4">Effective To</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredRsmData.map((rsm) => (
                        <tr key={rsm.id} className="hover:bg-slate-50">
                          <td className="p-4 text-sm font-medium text-slate-900">{rsm.employeeCode || `EMP-${rsm.id}`}</td>
                          <td className="p-4 text-sm text-slate-700">{rsm.name}</td>
                          <td className="p-4 text-sm text-slate-700">{rsm.state}</td>
                          <td className="p-4">
                            <input 
                              type="number"
                              className="w-36 px-3 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] text-sm disabled:bg-slate-100 disabled:text-slate-500 cursor-not-allowed"
                              placeholder="Amount"
                              value={allocationInputs[rsm.id] || ''}
                              onChange={(e) => setAllocationInputs({...allocationInputs, [rsm.id]: e.target.value})}
                              disabled={getStatus(rsm.id) === 'Allocated'}
                            />
                          </td>
                          <td className="p-4 text-sm text-slate-700">{activeNationalTarget.startDate}</td>
                          <td className="p-4 text-sm text-slate-700">{activeNationalTarget.endDate}</td>
                          <td className="p-4">
                            <Badge variant={
                              getStatus(rsm.id) === 'Allocated' ? 'success' : 
                              getStatus(rsm.id) === 'Validated' ? 'success' : 
                              getStatus(rsm.id) === 'Draft' ? 'warning' : 'neutral'
                            }>
                              {getStatus(rsm.id)}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {getStatus(rsm.id) === 'Allocated' && (
                              <button 
                                onClick={() => handleOpenEdit(rsm)}
                                className="p-1.5 text-slate-400 hover:text-[#163c78] hover:bg-blue-50 rounded transition-colors" 
                                title="Edit Allocation"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary & Action Buttons */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex gap-8">
                   <div><span className="block text-xs text-slate-500 font-semibold mb-1">Total Allocated</span><span className="text-lg font-bold text-[#163c78]">{formatCurrency(currentTotalInputAllocation)}</span></div>
                   <div><span className="block text-xs text-slate-500 font-semibold mb-1">Remaining Balance</span><span className={`text-lg font-bold ${remainingAfterInputs < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(remainingAfterInputs)}</span></div>
                </div>
                
                <div className="flex gap-4">
                  <button 
                    type="button" 
                    disabled={saving}
                    onClick={handleSaveDraft}
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
                    disabled={saving}
                    onClick={handleSubmitFinalPlan}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-[#163c78] rounded-lg hover:bg-[#122e5c] transition-colors flex items-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Submit Final Plan
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {editModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Edit Allocation</h3>
                <p className="text-sm text-slate-500 mt-0.5">Update assigned target for {editModal.rsm.name}</p>
              </div>
              <button 
                onClick={() => setEditModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee Code</label>
                <input type="text" disabled value={editModal.rsm.employeeCode || `EMP-${editModal.rsm.id}`} className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed font-medium text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">RSM Name</label>
                  <input type="text" disabled value={editModal.rsm.name} className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed font-medium text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <input type="text" disabled value={editModal.rsm.state} className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed font-medium text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Allocated Target (₹) *</label>
                <input 
                  type="number" 
                  value={editModal.amount} 
                  onChange={(e) => setEditModal({...editModal, amount: e.target.value})}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] font-semibold text-[#163c78] text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks (Optional)</label>
                <textarea 
                  value={editModal.remarks} 
                  onChange={(e) => setEditModal({...editModal, remarks: e.target.value})}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] min-h-[80px] text-sm" 
                  placeholder="Enter context for this update..."
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setEditModal(null)}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={saving}
                onClick={handleUpdateAllocation}
                className="px-4 py-2.5 text-sm font-medium text-white bg-[#163c78] rounded-lg hover:bg-[#122e5c] transition-colors flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Update Allocation
              </button>
            </div>
          </div>
        </div>
      )}

      {viewPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Target Plan Details</h3>
                <p className="text-sm text-slate-500 mt-0.5">Audit and review mode (Database Record)</p>
              </div>
              <button 
                onClick={() => setViewPlanModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1 space-y-8">
              {/* Section 1 - Target Plan Information */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider border-b border-slate-200 pb-2">1. Plan Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <span className="block text-xs text-slate-500 font-semibold mb-1">Financial Year</span>
                    <span className="text-sm font-medium text-slate-900">{viewPlanModal.financialYear}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-semibold mb-1">Planning Period</span>
                    <span className="text-sm font-medium text-slate-900">{viewPlanModal.planningPeriod}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-semibold mb-1">Plan Status</span>
                    <div>
                      <Badge variant={viewPlanModal.status === 'Active' ? 'success' : viewPlanModal.status === 'Draft' ? 'warning' : 'neutral'}>{viewPlanModal.status}</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-semibold mb-1">Effective From</span>
                    <span className="text-sm font-medium text-slate-900">{viewPlanModal.startDate}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-semibold mb-1">Effective To</span>
                    <span className="text-sm font-medium text-slate-900">{viewPlanModal.endDate}</span>
                  </div>
                </div>
              </div>

              {/* Section 2 - Allocation Details */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider border-b border-slate-200 pb-2">2. Allocation Details</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                        <th className="p-4">Employee Code</th>
                        <th className="p-4">RSM Name</th>
                        <th className="p-4">State</th>
                        <th className="p-4">Allocated Target</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(() => {
                         const allocationsForPlan = rsmAllocations.filter(a => String(a.sourceTargetId) === String(viewPlanModal.id) || String(a.nationalTargetId) === String(viewPlanModal.id));
                         
                         if (allocationsForPlan.length === 0) {
                           return (
                             <tr>
                               <td colSpan={5} className="p-6 text-center text-sm text-slate-500">No allocations found for this plan in database.</td>
                             </tr>
                           );
                         }

                         return allocationsForPlan.map(alloc => {
                           const rsm = rsmData.find(r => String(r.id) === String(alloc.allocatedToEmployeeId));
                           return (
                             <tr key={alloc.id} className="hover:bg-slate-50">
                               <td className="p-4 text-sm font-medium text-slate-900">{alloc.employee?.employeeCode || rsm?.employeeCode || `EMP-${alloc.allocatedToEmployeeId}`}</td>
                               <td className="p-4 text-sm text-slate-700">{alloc.employee?.name || alloc.allocatedToEmployeeName || rsm?.name}</td>
                               <td className="p-4 text-sm text-slate-700">{rsm?.state || '-'}</td>
                               <td className="p-4 text-sm font-semibold text-[#163c78]">{formatCurrency(alloc.targetAmount)}</td>
                               <td className="p-4">
                                 <Badge variant={alloc.status === 'Active' ? 'success' : alloc.status === 'Validated' ? 'success' : alloc.status === 'Draft' ? 'warning' : 'neutral'}>
                                   {alloc.status === 'Active' ? 'Allocated' : alloc.status}
                                 </Badge>
                               </td>
                             </tr>
                           );
                         });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Summary Bottom */}
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <span className="block text-xs text-slate-500 font-semibold mb-1">Total National Target</span>
                  <span className="text-xl font-bold text-slate-800">{formatCurrency(viewPlanModal.targetAmount)}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 font-semibold mb-1">Total Allocated</span>
                  <span className="text-xl font-bold text-emerald-600">{formatCurrency(viewPlanModal.allocatedAmount)}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 font-semibold mb-1">Remaining Balance</span>
                  <span className="text-xl font-bold text-amber-600">{formatCurrency(viewPlanModal.remainingAmount)}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
              <button 
                onClick={() => setViewPlanModal(null)}
                className="px-6 py-2.5 text-sm font-medium text-white bg-[#163c78] rounded-lg hover:bg-[#122e5c] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
