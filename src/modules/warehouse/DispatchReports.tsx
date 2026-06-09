import {
  Download,
  TrendingUp,
  Package,
  Truck,
  AlertTriangle,
} from 'lucide-react';

import {
  PageHeader,
  ActionButton,
  SummaryCard,
  TableCard,
} from './components/shared';

const dispatchVolumeData = [
  { month: 'Jan', value: 920 },
  { month: 'Feb', value: 1040 },
  { month: 'Mar', value: 1130 },
  { month: 'Apr', value: 1185 },
  { month: 'May', value: 1210 },
  { month: 'Jun', value: 1284 },
];

const transporterPerformanceData = [
  {
    transporter: 'BlueDart',
    success: 97,
  },
  {
    transporter: 'Delhivery',
    success: 97.4,
  },
  {
    transporter: 'DTDC',
    success: 97.5,
  },
  {
    transporter: 'XpressBees',
    success: 96.6,
  },
];

const transporterTable = [
  {
    transporter: 'BlueDart',
    shipments: 350,
    delivered: 340,
    delayed: 10,
    success: '97%',
  },
  {
    transporter: 'Delhivery',
    shipments: 420,
    delivered: 409,
    delayed: 11,
    success: '97.4%',
  },
  {
    transporter: 'DTDC',
    shipments: 280,
    delivered: 273,
    delayed: 7,
    success: '97.5%',
  },
  {
    transporter: 'XpressBees',
    shipments: 234,
    delivered: 226,
    delayed: 8,
    success: '96.6%',
  },
];

export default function DispatchReports() {
  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Dispatch & Logistics Reports"
        subtitle="Analytics and performance metrics for warehouse operations."
        actions={
          <ActionButton
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
          >
            Download PDF
          </ActionButton>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Dispatches"
          value="1,284"
          subtitle="This Month"
          icon={<Package className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />

        <SummaryCard
          title="On-Time Delivery"
          value="98.2%"
          subtitle="+1.2% from last month"
          icon={<TrendingUp className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />

        <SummaryCard
          title="Active Transporters"
          value="12"
          subtitle="Across 3 regions"
          icon={<Truck className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />

        <SummaryCard
          title="Delayed Shipments"
          value="24"
          subtitle="Requires Attention"
          icon={<AlertTriangle className="w-6 h-6" />}
          colorClass="text-red-600"
          bgClass="bg-red-50"
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Dispatch Volume Trend */}
        <TableCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Dispatch Volume Trend
            </h3>

            <div className="space-y-4">
              {dispatchVolumeData.map((item) => (
                <div key={item.month}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">
                      {item.month}
                    </span>

                    <span className="font-medium text-slate-900">
                      {item.value}
                    </span>
                  </div>

                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-600 rounded-full"
                      style={{
                        width: `${(item.value / 1300) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TableCard>

        {/* Transporter Performance */}
        <TableCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Transporter Performance
            </h3>

            <div className="space-y-4">
              {transporterPerformanceData.map((item) => (
                <div key={item.transporter}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">
                      {item.transporter}
                    </span>

                    <span className="font-medium text-slate-900">
                      {item.success}%
                    </span>
                  </div>

                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${item.success}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TableCard>
      </div>

      {/* Performance Summary Table */}
<TableCard>
  <div>
    <div className="px-6 py-5 border-b border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900">
        Transporter Performance Summary
      </h3>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              Transporter
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              Shipments
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              Delivered
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              Delayed
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              Success Rate
            </th>
          </tr>
        </thead>

        <tbody>
          {transporterTable.map((item, index) => (
            <tr
              key={index}
              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <td className="px-6 py-4 font-medium text-slate-900">
                {item.transporter}
              </td>

              <td className="px-6 py-4 text-slate-600">
                {item.shipments}
              </td>

              <td className="px-6 py-4">
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {item.delivered}
                </span>
              </td>

              <td className="px-6 py-4">
                <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                  {item.delayed}
                </span>
              </td>

              <td className="px-6 py-4">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {item.success}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</TableCard>
    </div>
  );
}