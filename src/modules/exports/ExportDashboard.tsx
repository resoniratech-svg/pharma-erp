import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Globe, DollarSign, Package, Users } from 'lucide-react';
import { apiRequest } from '../../services/apiClient';

const ExportDashboard = () => {
  const [data, setData] = useState({
    totalRevenue: 0,
    activeShipments: 0,
    totalCustomers: 0,
    countriesReached: 0,
    recentShipments: []
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await apiRequest<{success: boolean, data: any}>('/exports/dashboard-stats');
      if (res.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const stats = [
    { label: 'Total Export Revenue (INR)', value: `₹${data.totalRevenue.toLocaleString()}`, icon: DollarSign, trend: '' },
    { label: 'Active Shipments', value: data.activeShipments.toString(), icon: Package, trend: '' },
    { label: 'International Customers', value: data.totalCustomers.toString(), icon: Users, trend: '' },
    { label: 'Countries Reached', value: data.countriesReached.toString(), icon: Globe, trend: '' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Export Dashboard</h1>
        <p className="text-slate-500">Overview of global operations and export metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                  <span className={`text-xs font-medium ${stat.trend.startsWith('+') ? 'text-green-600' : 'text-slate-400'}`}>
                    {stat.trend}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Chart Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Revenue by Country</h3>
          </div>
          <div className="p-6 h-64 flex items-center justify-center text-slate-400 bg-slate-50 m-6 rounded border border-dashed border-slate-200">
            Chart Integration Pending
          </div>
        </Card>
        <Card>
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Recent Shipments</h3>
          </div>
          <div className="p-6">
             <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-2 px-2 font-semibold text-sm text-slate-600">Order No</th>
                      <th className="py-2 px-2 font-semibold text-sm text-slate-600">Destination</th>
                      <th className="py-2 px-2 font-semibold text-sm text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentShipments.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-500 text-sm">No recent shipments</td>
                      </tr>
                    ) : (
                      data.recentShipments.map((s: any) => (
                        <tr key={s.id} className="border-b border-slate-50">
                          <td className="py-2 px-2 text-sm text-slate-800">{s.orderNumber}</td>
                          <td className="py-2 px-2 text-sm text-slate-600">{s.destinationPort || 'N/A'}</td>
                          <td className="py-2 px-2 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${s.status === 'Draft' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700'}`}>
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ExportDashboard;
