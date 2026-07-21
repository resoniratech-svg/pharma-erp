import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, ChevronLeft } from 'lucide-react';
import { ROLES, type Role } from '../constants/roles';
import mjLogo from '../assets/logo/pharmaLOGO.png';

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
      className="group bg-white rounded-[16px] border border-[#E2E8F0] shadow-[0_4px_12px_rgba(15,23,42,0.06)] hover:shadow-[0_12px_24px_rgba(13,44,91,0.15)] hover:border-[#0D2C5B]/30 transition-all duration-300 hover:-translate-y-[2px] cursor-pointer overflow-hidden flex flex-col"
    >
      <div className="p-6 flex-1 flex flex-col">
        {/* Icon */}
        <div className="mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
            style={{
              background: 'rgba(13,44,91,0.08)',
            }}
          >
            <role.Icon className="w-6 h-6 text-[#0D2C5B]" />
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
          className="w-full flex items-center justify-center gap-2 py-3 mt-auto rounded-xl text-sm font-bold text-white bg-[#3b82f6] hover:bg-[#105ede] transition-colors duration-200 shadow-sm"
          onClick={(e) => { e.stopPropagation(); goToLogin(); }}
        >
          Enter Workspace
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

const HealthcareNodesBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <style>{`
        @keyframes subtleDrift {
          0% { transform: translate(0px, 0px); }
          50% { transform: translate(-15px, 15px); }
          100% { transform: translate(0px, 0px); }
        }
        .bg-network {
          animation: subtleDrift 25s ease-in-out infinite;
          width: 110%;
          height: 110%;
          position: absolute;
          top: -5%;
          left: -5%;
        }
      `}</style>
      <svg className="bg-network" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="networkPattern" x="0" y="0" width="800" height="800" patternUnits="userSpaceOnUse">
            <g stroke="#0D2C5B" fill="none" opacity="0.18">
              {/* Lines */}
              <line x1="100" y1="100" x2="350" y2="250" strokeWidth="1" />
              <line x1="350" y1="250" x2="600" y2="150" strokeWidth="1" />
              <line x1="600" y1="150" x2="700" y2="450" strokeWidth="1" />
              <line x1="700" y1="450" x2="450" y2="600" strokeWidth="1" />
              <line x1="450" y1="600" x2="150" y2="550" strokeWidth="1" />
              <line x1="150" y1="550" x2="100" y2="100" strokeWidth="1" />
              <line x1="350" y1="250" x2="450" y2="600" strokeWidth="1" />
              <line x1="150" y1="550" x2="600" y2="150" strokeWidth="1" />
              
              <line x1="600" y1="150" x2="800" y2="50" strokeWidth="1" />
              <line x1="700" y1="450" x2="800" y2="700" strokeWidth="1" />
              <line x1="450" y1="600" x2="300" y2="800" strokeWidth="1" />
              <line x1="150" y1="550" x2="0" y2="700" strokeWidth="1" />
              <line x1="100" y1="100" x2="0" y2="300" strokeWidth="1" />
              <line x1="350" y1="250" x2="400" y2="0" strokeWidth="1" />
              
              {/* Nodes */}
              {/* Cross */}
              <g transform="translate(100,100)">
                <circle cx="0" cy="0" r="28" fill="#e2e8f0" opacity="0.4" stroke="none" />
                <circle cx="0" cy="0" r="24" fill="#fff" strokeWidth="1.5" />
                <path d="M-8 0 h16 M0 -8 v16" strokeWidth="2.5" strokeLinecap="round" />
              </g>
              
              {/* Hospital/Building */}
              <g transform="translate(350,250)">
                <circle cx="0" cy="0" r="34" fill="#e2e8f0" opacity="0.4" stroke="none" />
                <circle cx="0" cy="0" r="28" fill="#fff" strokeWidth="1.5" />
                <path d="M-10 10 v-20 h20 v20 z M-4 -4 h8 M-4 2 h8 M0 10 v-6 h-4" strokeWidth="1.5" strokeLinejoin="round" />
              </g>
              
              {/* Capsule */}
              <g transform="translate(600,150)">
                <circle cx="0" cy="0" r="26" fill="#e2e8f0" opacity="0.4" stroke="none" />
                <circle cx="0" cy="0" r="22" fill="#fff" strokeWidth="1.5" />
                <rect x="-6" y="-12" width="12" height="24" rx="6" strokeWidth="1.5" transform="rotate(45)" />
                <line x1="-8.5" y1="0" x2="8.5" y2="0" strokeWidth="1.5" transform="rotate(45)" />
              </g>

              {/* Person */}
              <g transform="translate(700,450)">
                <circle cx="0" cy="0" r="24" fill="#e2e8f0" opacity="0.4" stroke="none" />
                <circle cx="0" cy="0" r="20" fill="#fff" strokeWidth="1.5" />
                <circle cx="0" cy="-4" r="5" strokeWidth="1.5" />
                <path d="M-9 10 c 0 -6 18 -6 18 0" strokeWidth="1.5" />
              </g>

              {/* Warehouse/Box */}
              <g transform="translate(450,600)">
                <circle cx="0" cy="0" r="28" fill="#e2e8f0" opacity="0.4" stroke="none" />
                <circle cx="0" cy="0" r="24" fill="#fff" strokeWidth="1.5" />
                <path d="M-10 -6 L0 -12 L10 -6 L10 6 L0 12 L-10 6 Z" strokeWidth="1.5" />
                <path d="M-10 -6 L0 0 L10 -6 M0 0 L0 12" strokeWidth="1.5" />
              </g>

              {/* Distribution/Truck */}
              <g transform="translate(150,550)">
                <circle cx="0" cy="0" r="26" fill="#e2e8f0" opacity="0.4" stroke="none" />
                <circle cx="0" cy="0" r="22" fill="#fff" strokeWidth="1.5" />
                <path d="M-10 6 h14 M-10 -4 h10 l4 4 v6 h-14 z" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="-6" cy="6" r="2.5" strokeWidth="1.5" />
                <circle cx="2" cy="6" r="2.5" strokeWidth="1.5" />
              </g>
              
              {/* Extra Connection Nodes (Small) */}
              <circle cx="225" cy="175" r="4" fill="#0D2C5B" />
              <circle cx="475" cy="200" r="5" fill="#fff" strokeWidth="1.5" />
              <circle cx="650" cy="300" r="4" fill="#0D2C5B" />
              <circle cx="575" cy="525" r="5" fill="#fff" strokeWidth="1.5" />
              <circle cx="300" cy="575" r="4" fill="#0D2C5B" />
              <circle cx="125" cy="325" r="5" fill="#fff" strokeWidth="1.5" />
              <circle cx="250" cy="400" r="6" fill="#fff" strokeWidth="2" />
              
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#networkPattern)" />
      </svg>
    </div>
  );
};

/* ── Page ───────────────────────────────────────────────────────── */
export default function WorkspaceSelection() {
  return (
    <div
      className="min-h-screen font-sans selection:bg-primary/20 relative overflow-hidden"
      style={{
        backgroundColor: '#f7fafc',
      }}
    >
      <HealthcareNodesBackground />
      {/* Header */}
      <header className="w-full px-8 py-0 flex items-center justify-between relative z-10">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={mjLogo} alt="MJ Healthcare" className="h-50 object-contain" />
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
      <main className="max-w-6xl mx-auto px-6 py-10 relative z-10">
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
