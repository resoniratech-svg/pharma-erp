import { Outlet } from 'react-router';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { hasPermission } from '../../constants/permissions';
import { ROLE_SUPER_ADMIN } from '../../constants/roles';
import { Link } from 'react-router';

export function ProtectedRoute({ moduleLabel }: { moduleLabel: string }) {
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;

  if (!hasPermission(activeRole, moduleLabel)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-rose-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Access Denied</h2>
        <p className="text-slate-500 text-lg mb-8 max-w-md text-center">
          You don't have permission to view the <strong>{moduleLabel}</strong> module with your current role.
        </p>
        <Link 
          to="/workspace/dashboard" 
          className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-200 transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return <Outlet />;
}
