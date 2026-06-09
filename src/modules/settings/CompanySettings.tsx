import { Building2, Save } from 'lucide-react';
import { PageHeader, ActionButton } from './components/shared';

export default function CompanySettings() {
  return (
    <div className="animate-in fade-in duration-500 max-w-4xl">
      <PageHeader
        title="Company Settings"
        subtitle="Manage your primary company profile and statutory details."
        actions={
          <ActionButton variant="primary" icon={<Save className="w-4 h-4" />}>Save Changes</ActionButton>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-violet-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Basic Information</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
            <input type="text" defaultValue="PharmaTech Distributors Pvt Ltd" className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input type="email" defaultValue="admin@pharmatech.com" className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
            <input type="text" defaultValue="+91 9876543210" className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Registered Address</label>
            <textarea rows={3} defaultValue="123, Healthcare IT Park, Andheri East, Mumbai - 400069, Maharashtra, India" className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800">Statutory Details</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">GSTIN</label>
            <input type="text" defaultValue="27AADCP1234E1Z5" className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 uppercase" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">PAN</label>
            <input type="text" defaultValue="AADCP1234E" className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 uppercase" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Drug License No. (Form 20B)</label>
            <input type="text" defaultValue="MH-MZ4-123456" className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 uppercase" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Drug License No. (Form 21B)</label>
            <input type="text" defaultValue="MH-MZ4-123457" className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 uppercase" />
          </div>
        </div>
      </div>
    </div>
  );
}
