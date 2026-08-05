import { useState } from 'react';
import { Users, GitFork } from 'lucide-react';
import { PageHeader } from '../components/shared';
import EmployeesTab from './EmployeesTab';
import OrganizationTab from './OrganizationTab';

type TabType = 'employees' | 'organization';

export default function SalesOrganization() {
  const [activeTab, setActiveTab] = useState<TabType>('employees');

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'employees', label: 'Employees', icon: <Users className="w-4 h-4" /> },
    { id: 'organization', label: 'Organization Hierarchy', icon: <GitFork className="w-4 h-4" /> },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      {/* Page Header */}
      <PageHeader
        title="Sales Organization"
        subtitle="Manage sales hierarchy, employees, territories, and sales target allocations."
        breadcrumb={[{ label: 'Super Admin' }, { label: 'Sales Organization' }]}
      />

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-2 overflow-x-auto pb-px" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-[#163c78] text-[#163c78] bg-slate-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'employees' && <EmployeesTab />}
        {activeTab === 'organization' && <OrganizationTab />}
      </div>
    </div>
  );
}
