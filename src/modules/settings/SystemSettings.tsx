import { Server, Save, Database, HardDrive, RefreshCw } from 'lucide-react';
import { PageHeader, ActionButton } from './components/shared';

export default function SystemSettings() {
  return (
    <div className="animate-in fade-in duration-500 max-w-4xl">
      <PageHeader
        title="System Settings"
        subtitle="Global ERP configuration and technical parameters."
        actions={
          <ActionButton variant="primary" icon={<Save className="w-4 h-4" />}>Save Settings</ActionButton>
        }
      />

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <Server className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">General Preferences</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
              <select className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400">
                <option>Asia/Kolkata (IST)</option>
                <option>UTC</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Financial Year Start</label>
              <select className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400">
                <option>1st April</option>
                <option>1st January</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Currency Symbol</label>
              <input type="text" defaultValue="₹" className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <Database className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">Database & Backups</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <HardDrive className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Automated Daily Backups</h4>
                  <p className="text-sm text-slate-500">Last backup completed: Today, 02:00 AM</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
              </label>
            </div>
            <ActionButton variant="secondary" icon={<RefreshCw className="w-4 h-4" />}>Run Manual Backup Now</ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
