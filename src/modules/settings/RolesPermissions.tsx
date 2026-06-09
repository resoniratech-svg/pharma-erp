import { Shield, Save } from 'lucide-react';
import { PageHeader, ActionButton } from './components/shared';

export default function RolesPermissions() {
  return (
    <div className="animate-in fade-in duration-500 max-w-5xl">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Configure granular access control for different modules."
        actions={
          <ActionButton variant="primary" icon={<Save className="w-4 h-4" />}>Save Policies</ActionButton>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-violet-50 text-violet-700 font-semibold px-4 py-3 rounded-lg border border-violet-200 cursor-pointer">Super Admin</div>
          <div className="hover:bg-slate-50 text-slate-700 font-medium px-4 py-3 rounded-lg border border-transparent hover:border-slate-200 cursor-pointer transition-colors">Inventory Manager</div>
          <div className="hover:bg-slate-50 text-slate-700 font-medium px-4 py-3 rounded-lg border border-transparent hover:border-slate-200 cursor-pointer transition-colors">Billing Executive</div>
          <div className="hover:bg-slate-50 text-slate-700 font-medium px-4 py-3 rounded-lg border border-transparent hover:border-slate-200 cursor-pointer transition-colors">Medical Rep (MR)</div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-violet-600" />
              <h2 className="text-lg font-semibold text-slate-800">Super Admin Permissions</h2>
            </div>
          </div>
          
          <div className="divide-y divide-slate-100">
            {['Products & Master', 'Inventory Management', 'Billing & Invoicing', 'Finance & Ledgers'].map((module) => (
              <div key={module} className="p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4">{module}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['View', 'Create', 'Edit', 'Delete'].map((action) => (
                    <label key={action} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500" />
                      <span className="text-sm text-slate-700">{action}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
