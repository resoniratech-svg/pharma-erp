import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff, ChevronLeft,
  ArrowRight, CheckCircle2, ShieldCheck,
  Activity, Dna,
} from 'lucide-react';
import { ROLES } from '../constants/roles';
import { USERS } from '../mock-data/mockUsers';
import activityLogService from '../services/activityLogService';
import mjLogo from '../assets/logo/mj-healthcare-logo1.svg';

/* ── Types ──────────────────────────────────────────────────────── */
interface LocationState {
  roleId?: string;
}

/* ── Input Field ────────────────────────────────────────────────── */
interface FieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  icon: React.ElementType;
  suffix?: React.ReactNode;
}

const Field = ({
  id, label, type, value, onChange, placeholder,
  error, icon: Icon, suffix,
}: FieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-sm font-semibold text-slate-700">
      {label}
    </label>
    <div
      className="flex items-center gap-3 bg-white border rounded-xl px-4 py-3 transition-all duration-200 shadow-sm"
      style={{
        borderColor: error ? '#EF4444' : value ? '#14B8A660' : '#E2E8F0',
        boxShadow: value && !error
          ? `0 0 0 3px #14B8A614`
          : error
          ? '0 0 0 3px rgba(239,68,68,0.10)'
          : undefined,
      }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: value ? '#14B8A6' : '#94A3B8' }} />
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 text-sm text-[#1A1A1A] placeholder:text-slate-400 bg-transparent outline-none"
      />
      {suffix}
    </div>
    {error && (
      <p className="text-xs text-red-500 font-medium flex items-center gap-1">
        <span>⚠</span> {error}
      </p>
    )}
  </div>
);

/* ── Page ───────────────────────────────────────────────────────── */
export default function LoginPage() {
  const navigate        = useNavigate();
  const location        = useLocation();
  const state           = (location.state ?? {}) as LocationState;

  /* Resolve role — fallback to Super Admin if nothing was passed */
  const role = ROLES.find((r) => r.id === state.roleId) ?? ROLES[0];
  const RoleIcon = role.Icon;

  /* Form state */
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPass,     setShowPass]     = useState(false);
  const [rememberMe,   setRememberMe]   = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [success,      setSuccess]      = useState(false);
  const [emailErr,     setEmailErr]     = useState('');
  const [passwordErr,  setPasswordErr]  = useState('');

  /* Validation helpers */
  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const validate = () => {
    let ok = true;
    if (!email) {
      setEmailErr('Email address is required.');
      ok = false;
    } else if (!isValidEmail(email)) {
      setEmailErr('Enter a valid email address.');
      ok = false;
    } else {
      setEmailErr('');
    }
    if (!password) {
      setPasswordErr('Password is required.');
      ok = false;
    } else if (password.length < 4) {
      setPasswordErr('Password must be at least 4 characters.');
      ok = false;
    } else {
      setPasswordErr('');
    }
    return ok;
  };

  /* Submit — login against mock user database */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    /* Simulate API delay */
    await new Promise((res) => setTimeout(res, 1600));

    const user = USERS.find(u => u.email === email && u.password === password);
    
    if (!user) {
      setLoading(false);
      setEmailErr('Invalid email or password.');
      setPasswordErr('Invalid email or password.');
      return;
    }

    if (user.roleId !== role.id) {
      setLoading(false);
      setEmailErr(`Invalid credentials for ${role.title} workspace.`);
      setPasswordErr('');
      return;
    }

    setLoading(false);
    setSuccess(true);

    await new Promise((res) => setTimeout(res, 700));
    localStorage.setItem("activeRole", user.roleId);
    localStorage.setItem("workspaceRole", role.id);
    localStorage.setItem("userId", user.id);
    localStorage.setItem("authUser", JSON.stringify(user));

    activityLogService.addLog({
      userId: user.id,
      userName: user.fullName,
      action: "Login",
      module: "Authentication",
    });

    navigate("/workspace/dashboard");
  };

  return (
    <div className="min-h-screen flex font-sans bg-[#F8FAFC]">
      {/* ── Left Brand Panel (Desktop Only) ─────────────────────── */}
      <div className="hidden lg:flex w-[40%] relative flex-col justify-between p-12 overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #06B6D4 50%, #4F46E5 100%)' }}>
        {/* Abstract Background Elements */}
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div 
          animate={{ x: [0, 30, 0], scale: [1, 1.1, 1] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-10 w-80 h-80 bg-[#4F46E5]/30 rounded-full blur-3xl pointer-events-none"
        />
        
        {/* Particles */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz4KPC9zdmc+')] opacity-30 pointer-events-none" />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <img src={mjLogo} alt="MJ Healthcare" className="h-20 object-contain" />
          </Link>
        </div>

        <div className="relative z-10 mt-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20 shadow-xl">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20 shadow-xl">
                <Dna className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white mb-6 leading-tight tracking-tight">
              Enterprise Pharmaceutical Management Platform
            </h1>
            <p className="text-white/80 text-lg leading-relaxed max-w-md">
              Streamline inventory, finance, billing, logistics, analytics and business operations through a unified ERP ecosystem.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-white/60 text-sm font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Secured connection · Role-based access control</span>
        </div>
      </div>

      {/* ── Right Login Panel ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        <div className="absolute top-6 left-6 z-10">
          <Link
            to="/workspace"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors bg-white/80 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-slate-100"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to workspace
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[440px] bg-white rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2E8F0] p-8 lg:p-10"
          >
            {/* ── Role header ────────────────────────────────────── */}
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#14B8A6]/10 flex items-center justify-center mb-4">
                <RoleIcon className="w-8 h-8 text-[#14B8A6]" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                Signing in as
              </p>
              <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight">{role.title}</h2>
            </div>

            {/* ── Form body ───────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email */}
              <Field
                id="email"
                label="Email Address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@pharmaerp.com"
                error={emailErr}
                icon={Mail}
              />

              {/* Password */}
              <Field
                id="password"
                label="Password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                error={passwordErr}
                icon={Lock}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${rememberMe ? 'bg-[#14B8A6] border-[#14B8A6]' : 'border-slate-300 group-hover:border-[#14B8A6]'}`}>
                    {rememberMe && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <input type="checkbox" className="hidden" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  <span className="text-sm font-medium text-slate-600">Remember Me</span>
                </label>
                <button
                  type="button"
                  className="text-sm font-semibold text-[#14B8A6] hover:text-[#0F9F8D] hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login button */}
              <button
                id="login-btn"
                type="submit"
                disabled={loading || success}
                className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-[12px] font-bold text-white text-sm transition-all duration-200 disabled:opacity-80 disabled:cursor-not-allowed mt-4 shadow-sm hover:-translate-y-[2px] active:scale-[0.98] ${success ? 'bg-[#10B981]' : 'bg-[#14B8A6] hover:bg-[#0F9F8D] hover:shadow-[0_4px_12px_rgba(20,184,166,0.25)]'}`}
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      {/* Spinner */}
                      <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                      </svg>
                      Authenticating…
                    </motion.span>
                  ) : success ? (
                    <motion.span
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Access Granted
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </form>
          </motion.div>

          {/* Mobile Footer branding */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center lg:hidden">
             <div className="flex items-center gap-2 opacity-50 text-xs text-slate-500 font-bold">
               <div className="w-5 h-5 bg-gradient-to-br from-[#14B8A6] to-[#06B6D4] rounded flex items-center justify-center text-white">P</div>
               Pharma ERP
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
