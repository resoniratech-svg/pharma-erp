import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, ChevronLeft } from 'lucide-react';
import { ROLES, type Role } from '../constants/roles';
import mjLogo from '../assets/logo/mj-healthcare-logo.svg';

/* ── Role Card ──────────────────────────────────────────────────── */
const RoleCard = ({ role, index }: { role: Role; index: number }) => {
  const navigate = useNavigate();

  const goToLogin = () =>
    navigate('/login', { state: { roleId: role.id } });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07 }}
      onClick={goToLogin}
      className="group bg-white rounded-[16px] border border-[#E2E8F0] shadow-[0_4px_12px_rgba(15,23,42,0.06)] hover:shadow-[0_12px_24px_rgba(15,23,42,0.10)] transition-all duration-300 hover:-translate-y-[2px] cursor-pointer overflow-hidden flex flex-col"
    >
      <div className="p-6 flex-1 flex flex-col">
        {/* Icon */}
        <div className="mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
            style={{
              background: 'rgba(20,184,166,0.12)',
            }}
          >
            <role.Icon className="w-6 h-6 text-[#14B8A6]" />
          </div>
        </div>

        {/* Role info */}
        <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug">
          {role.title}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-4">
          {role.description}
        </p>

         {/* Capabilities List */}
        {/* <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50/60 p-4 mb-5">
          <ul className="space-y-2.5">
            {role.capabilities?.map((cap, idx) => (
              <li key={idx} className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#14B8A6' }} />
                <span className="truncate">{cap}</span>
              </li>
            ))}
          </ul>
        </div>  */}

        {/* Continue */}
        <button
          className="w-full flex items-center justify-center gap-2 py-3 mt-auto rounded-xl text-sm font-bold text-white bg-[#14B8A6] hover:bg-[#0F9F8D] transition-colors duration-200 shadow-sm"
          onClick={(e) => { e.stopPropagation(); goToLogin(); }}
        >
          Enter Workspace
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

/* ── Page ───────────────────────────────────────────────────────── */
export default function WorkspaceSelection() {
  return (
    <div
      className="min-h-screen font-sans selection:bg-primary/20"
      style={{
        background:
          'linear-gradient(160deg, #e8fdf6 0%, #e0f9fb 35%, #f0fdfa 65%, #ffffff 100%)',
      }}
    >
      {/* Header */}
      <header className="w-full px-8 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={mjLogo} alt="MJ Healthcare" className="h-14 object-contain" />
        </Link>

        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Site
        </Link>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Secure badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-slate-200 shadow-sm text-sm text-slate-600 font-medium">
            <Lock className="w-3.5 h-3.5 text-primary" />
            Secure workspace launcher
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-3 tracking-tight">
            Choose Your Workspace
          </h1>
          <p className="text-slate-500 text-base max-w-2xl mx-auto">
            Select your role-based workspace to access pharmaceutical operations, analytics, reporting, and management tools.
          </p>
        </motion.div>

        {/* Role grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ROLES.filter(role => role.id !== 'TRANSPORT_STAFF').map((role, i) => (
            <RoleCard key={role.id} role={role} index={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
