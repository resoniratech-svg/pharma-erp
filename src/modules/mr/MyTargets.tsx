import { useState, useEffect } from 'react';
import { Target, ShoppingBag, IndianRupee } from 'lucide-react';
import { PageHeader, SummaryCard, TableCard, DataTable, Badge, type Column } from './components/shared';
import { authService } from '../../services/authService';
import { targetAllocationService } from '../../services/targetAllocationService';
import type { TargetAllocationRecord } from '../../services/targetAllocationService';
import { retailerOrderService } from '../../services/retailerOrderService';
import type { RetailerOrderRecord } from '../../services/retailerOrderService';

const formatCurrency = (amount: number | string | undefined) => {
  if (amount === undefined || amount === null) return '₹0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num || 0);
};

export default function MyTargets() {
  const currentUser = authService.getCurrentUser();
  const mrIdStr = String(currentUser?.id || '');
  const mrIdNum = Number(mrIdStr.replace(/\D/g, '')) || 0; 

  const [allocations, setAllocations] = useState<TargetAllocationRecord[]>([]);
  const [orders, setOrders] = useState<RetailerOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Resolve internal Employee ID
        const empCode = currentUser?.employeeCode || currentUser?.id || '';
        const employees = (await import('../../services/employeeService')).employeeService.getEmployees();
        const employeeRecord = employees.find(e => 
          e.employeeCode === empCode || e.id === empCode || e.employeeName === currentUser?.fullName
        );
        const targetEmployeeId = employeeRecord ? employeeRecord.id : String(currentUser?.id || '');

        // Load allocations assigned to current user using internal ID
        const userAllocations = targetAllocationService.getAllocationsToEmployee(targetEmployeeId);
        setAllocations(Array.isArray(userAllocations) ? userAllocations : []);
        // Load Execution Data
        const allOrders = await retailerOrderService.getRetailerOrders();
        const safeOrders = Array.isArray(allOrders) ? allOrders : [];
        const myOrders = safeOrders.filter(o => {
            return o.mrId === undefined || o.mrId === null || o.mrId === mrIdNum || String(o.mrId) === mrIdStr;
        });
        setOrders(myOrders);

      } catch (err) {
        console.error("Error loading target data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [mrIdStr, mrIdNum]);

  // Active Allocations
  const activeAllocations = allocations.filter(a => a.status === 'Active');
  
  // Section 1: Assigned Sales Target (Current active target)
  // For simplicity, sum all active targets or display the latest active one
  const totalTargetAmount = activeAllocations.reduce((sum, a) => sum + (Number(a.targetAmount) || 0), 0);

  // Section 2: Achievement Summary
  const totalSalesAchieved = orders
    .filter(o => o.status !== 'Rejected' && o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const remainingAmount = Math.max(0, totalTargetAmount - totalSalesAchieved);
  const achievementPercent = totalTargetAmount > 0 
    ? Math.min(100, Math.round((totalSalesAchieved / totalTargetAmount) * 100)) 
    : (totalSalesAchieved > 0 ? 100 : 0);

  // Section 3: Allocation History
  const allocationColumns: Column<TargetAllocationRecord>[] = [
    { key: 'id', label: 'Allocation Number' },
    { key: 'financialYear', label: 'Financial Year' },
    { key: 'allocationPeriod', label: 'Period' },
    { key: 'allocatedByEmployeeId', label: 'Assigned By' },
    {
      key: 'allocationDate',
      label: 'Assigned Date',
      render: (row) => row.allocationDate ? new Date(row.allocationDate).toLocaleDateString() : 'N/A'
    },
    {
      key: 'targetAmount',
      label: 'Target Amount',
      render: (row) => formatCurrency(row.targetAmount)
    },
    {
      key: 'salesAchieved',
      label: 'Sales Achieved',
      render: () => formatCurrency(totalSalesAchieved)
    },
    {
      key: 'remainingTarget',
      label: 'Remaining Target',
      render: (row) => formatCurrency(Math.max(0, Number(row.targetAmount) - totalSalesAchieved))
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'Active' ? 'success' : row.status === 'Cancelled' ? 'danger' : 'neutral'}>
          {row.status}
        </Badge>
      )
    }
  ];

  if (loading) {
     return <div className="p-6">Loading Targets...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="My Targets"
        subtitle="View your allocated targets and track your performance."
      />

      {/* SECTION 1: Assigned Sales Target */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
           <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
             <Target className="w-5 h-5 text-primary" />
             Current Assigned Sales Targets
           </h3>
           <Badge variant="success">{activeAllocations.length} Active</Badge>
        </div>
        <div className="p-6">
           {activeAllocations.length > 0 ? (
             <div className="space-y-4">
               {activeAllocations.map(allocation => (
                 <div key={allocation.id} className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 border border-slate-100 rounded-lg bg-slate-50/50">
                    <div>
                       <div className="text-xs text-slate-500 mb-1">Financial Year</div>
                       <div className="font-medium text-slate-900">{allocation.financialYear}</div>
                    </div>
                    <div>
                       <div className="text-xs text-slate-500 mb-1">Allocation Period</div>
                       <div className="font-medium text-slate-900">{allocation.allocationPeriod}</div>
                    </div>
                    <div>
                       <div className="text-xs text-slate-500 mb-1">Assigned By</div>
                       <div className="font-medium text-slate-900">{allocation.allocatedByEmployeeId}</div>
                    </div>
                    <div>
                       <div className="text-xs text-slate-500 mb-1">Assigned Date</div>
                       <div className="font-medium text-slate-900">
                          {allocation.allocationDate ? new Date(allocation.allocationDate).toLocaleDateString() : 'N/A'}
                       </div>
                    </div>
                    <div>
                       <div className="text-xs text-slate-500 mb-1">Target Amount</div>
                       <div className="font-bold text-violet-700">{formatCurrency(allocation.targetAmount)}</div>
                    </div>
                    <div>
                       <div className="text-xs text-slate-500 mb-1">Status</div>
                       <Badge variant="success">{allocation.status}</Badge>
                    </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center py-8 text-slate-500">
                No active targets assigned.
             </div>
           )}
        </div>
      </div>

      {/* SECTION 2: Achievement Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Sales Target"
          value={formatCurrency(totalTargetAmount)}
          subtitle="Cumulative Active Target"
          icon={<Target className="text-blue-600" />}
          bgClass="bg-blue-50"
          colorClass="text-blue-700"
        />
        <SummaryCard
          title="Sales Achieved"
          value={formatCurrency(totalSalesAchieved)}
          subtitle="From Approved & Booked Orders"
          icon={<ShoppingBag className="text-green-600" />}
          bgClass="bg-green-50"
          colorClass="text-green-700"
        />
        <SummaryCard
          title="Remaining Target"
          value={formatCurrency(remainingAmount)}
          subtitle={`${achievementPercent}% Achieved`}
          icon={<IndianRupee className="text-orange-600" />}
          bgClass="bg-orange-50"
          colorClass="text-orange-700"
        />
      </div>

      {/* Progress Bar Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Target Achievement Progress</h3>
        <div className="mb-2 flex justify-between text-sm font-medium">
          <span className="text-emerald-700">{formatCurrency(totalSalesAchieved)} Achieved</span>
          <span className="text-slate-700">{formatCurrency(totalTargetAmount)} Target</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-4 relative overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${achievementPercent >= 100 ? 'bg-emerald-500' : 'bg-primary'}`} 
            style={{ width: `${Math.min(achievementPercent, 100)}%` }}
          />
        </div>
        <div className="mt-2 text-right text-xs font-bold text-slate-500">
          {achievementPercent}% Completed
        </div>
      </div>

      {/* SECTION 3: Allocation History */}
      <TableCard>
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Allocation History</h3>
        </div>
        <DataTable
          columns={allocationColumns}
          data={allocations}
          emptyMessage="No targets assigned yet."
        />
      </TableCard>

    </div>
  );
}
