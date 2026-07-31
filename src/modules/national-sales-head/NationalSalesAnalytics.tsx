import React, { useState, useEffect } from 'react';
import { exportToPDF } from '../../utils/exportUtils';
import { PageHeader, FilterBar, SelectFilter, SummaryCard, TableCard, DataTable, ActionButton } from './components/shared';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Target, Map, Award, AlertTriangle, Users } from 'lucide-react';
import { nsmService } from '../../services/nsmService';

const COLORS = ['#163c78', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function NationalSalesAnalytics() {
  const [fy, setFy] = useState('FY 2026-27');
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

  useEffect(() => {
    try {
      const summaries = nsmService.getTargetSummaries();
      const zsmMap = new Map<string, number>();

      const chartData = summaries.map(s => {
        // Aggregate for pie chart
        s.allocations.forEach(a => {
          const current = zsmMap.get(a.allocatedToEmployeeName) || 0;
          zsmMap.set(a.allocatedToEmployeeName, current + a.targetAmount);
        });

        return {
          id: s.target.id,
          targetType: s.target.targetType,
          totalTarget: s.target.targetAmount,
          allocatedTarget: s.allocatedAmount,
          remainingTarget: s.remainingAmount
        };
      });

      setAnalyticsData(chartData);

      const pData = Array.from(zsmMap.entries()).map(([name, value]) => ({
        name,
        value
      }));
      setPieData(pData);
      
    } catch (e) {
      console.warn("Error loading analytics:", e);
    }
  }, []);

  const allocationColumns = [
    { key: 'id', label: 'Target ID' },
    { key: 'targetType', label: 'Type' },
    { key: 'totalTarget', label: 'Target', render: (row: any) => `₹${(row.totalTarget / 100000).toFixed(2)} L` },
    { key: 'allocatedTarget', label: 'Allocated', render: (row: any) => `₹${(row.allocatedTarget / 100000).toFixed(2)} L` },
    { key: 'remainingTarget', label: 'Remaining', render: (row: any) => (
      <span className={row.remainingTarget > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
        ₹{(row.remainingTarget / 100000).toFixed(2)} L
      </span>
    )}
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="Executive Sales Analytics" 
        subtitle="National level dashboard for strategic target monitoring."
        actions={
          <div className="flex gap-2">
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />} onClick={() => exportToPDF(analyticsData, allocationColumns as any, 'NSM_Analytics_2026-07-30.pdf', 'National Sales Analytics')}>
              Export PDF
            </ActionButton>
          </div>
        }
      />

      <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-slate-500 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-slate-700">Data Visibility Notice</h4>
          <p className="text-sm text-slate-600 mt-1">
            Revenue and Sales analytics are temporarily hidden until downstream Medical Representative transactions (Order Bookings, DCRs) begin generating live data. Currently displaying Allocation Analytics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#163c78]" />
            Target vs Allocation
          </h3>
          <div className="h-[300px]">
            {analyticsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="id" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                    tick={{ fontSize: 12 }}
                  />
                  <RechartsTooltip 
                    formatter={(value: number) => [`₹${(value / 100000).toFixed(2)} L`, 'Amount']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="totalTarget" name="Total Target" fill="#163c78" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="allocatedTarget" name="Allocated Target" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">No targets found</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#163c78]" />
            ZSM Allocation Distribution
          </h3>
          <div className="h-[300px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => [`₹${(value / 100000).toFixed(2)} L`, 'Allocated']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">No allocations found</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Map className="w-5 h-5 text-[#163c78]" />
              Target Allocation Breakdown
            </h3>
          </div>
          <TableCard>
            <DataTable columns={allocationColumns} data={analyticsData} emptyMessage="No targets available." />
          </TableCard>
        </div>
      </div>
    </div>
  );
}
