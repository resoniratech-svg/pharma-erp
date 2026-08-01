import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff, ChevronLeft,
  ArrowRight, CheckCircle2, ShieldCheck,
  Package, ShoppingCart, ClipboardCheck, Users,
  Dna, Network, Pill, Activity
} from 'lucide-react';
import { ROLES } from '../constants/roles';
import authService from '../services/authService';
import activityLogService from '../services/activityLogService';
import { permissionService } from '../services/permissionService';
import { seedUsers } from '../data/seedUsers';
import mjLogo from '../assets/logo/pharmaLOGO.png';

const MolecularNetwork = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="15" fill="currentColor" opacity="0.8"/>
    <circle cx="50" cy="50" r="10" fill="currentColor" opacity="0.6"/>
    <circle cx="150" cy="40" r="8" fill="currentColor" opacity="0.5"/>
    <circle cx="170" cy="120" r="12" fill="currentColor" opacity="0.7"/>
    <circle cx="60" cy="150" r="9" fill="currentColor" opacity="0.6"/>
    <path d="M100 100 L50 50 M100 100 L150 40 M100 100 L170 120 M100 100 L60 150 M50 50 L150 40 M170 120 L60 150" stroke="currentColor" strokeWidth="2" opacity="0.4"/>
    <circle cx="20" cy="100" r="6" fill="currentColor" opacity="0.5"/>
    <path d="M50 50 L20 100 M60 150 L20 100" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
  </svg>
);

const DNAHelix = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M20 20 Q50 60 80 100 T20 180 T80 260" stroke="currentColor" strokeWidth="4" opacity="0.6" fill="none"/>
    <path d="M80 20 Q50 60 20 100 T80 180 T20 260" stroke="currentColor" strokeWidth="4" opacity="0.4" fill="none"/>
    <path d="M30 35 L70 35 M20 60 L80 60 M20 80 L80 80 M30 110 L70 110 M20 140 L80 140 M20 160 L80 160 M30 190 L70 190 M20 220 L80 220" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
  </svg>
);

const HospitalCross = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M35 15 H65 V35 H85 V65 H65 V85 H35 V65 H15 V35 H35 V15 Z" fill="currentColor" opacity="0.8"/>
  </svg>
);

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
      className="flex items-center gap-3 bg-white border rounded-[10px] h-[50px] px-4 transition-all duration-200 shadow-sm focus-within:ring-2 focus-within:ring-[#163C78]/20 focus-within:border-[#163C78]"
      style={{
        borderColor: error ? 'var(--color-brand-danger)' : undefined,
        boxShadow: error ? '0 0 0 3px rgba(220, 38, 38, 0.10)' : undefined,
      }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: value ? '#163C78' : '#94A3B8' }} />
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

  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('users');
      let users = storedUsers ? JSON.parse(storedUsers) : [];
      let updated = false;

      if (!Array.isArray(users) || users.length === 0) {
        users = [...seedUsers];
        updated = true;
      } else {
        for (const su of seedUsers) {
          const existingIndex = users.findIndex(
            (u: any) => u && u.email && u.email.toLowerCase() === su.email.toLowerCase()
          );
          if (existingIndex !== -1) {
            // Update existing user if id or name drifted from seed
            const existing = users[existingIndex];
            if (existing.id !== su.id || existing.name !== su.name) {
              users[existingIndex] = { ...existing, id: su.id, name: su.name };
              updated = true;
            }
          } else {
            users.push(su);
            updated = true;
          }
        }
      }

      if (updated) {
        localStorage.setItem('users', JSON.stringify(users));
      }
    } catch (e) {
      console.error('Error syncing seed users:', e);
      localStorage.setItem('users', JSON.stringify(seedUsers));
    }
  }, []);

  /* Validation helpers */
  const validate = () => {
    let ok = true;
    if (!email || !email.trim()) {
      setEmailErr('Email address or Username is required.');
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

  /* Submit — authenticate against authService */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const userRecord = await authService.login(email, password);

      // Verify role match if card role is specified (allowing fallback if navigating directly)
      if (role.id && role.id !== 'SUPER_ADMIN' && userRecord.roleId !== role.id) {
        setTimeout(() => {
          setLoading(false);
          setEmailErr(`Invalid credentials for ${role.title} workspace.`);
          setPasswordErr('');
        }, 500);
        return;
      }

      // Authentication successful
      setTimeout(() => {
        setLoading(false);
        setSuccess(true);
      
        // Set workspace role explicitly
        localStorage.setItem('workspaceRole', role.id);
        
        // Initialize permission service
        permissionService.initialize(userRecord.roleId);
        
        activityLogService.addLog({
          userId: userRecord.id,
          userName: userRecord.fullName,
          action: "Login",
          module: "Authentication",
        });

        if (userRecord.roleId === 'NATIONAL_SALES_HEAD') {
          navigate("/workspace/national-sales-head");
        } else if (userRecord.roleId === 'ZONAL_SALES_MANAGER') {
          navigate("/workspace/zonal-sales-manager");
        } else if (userRecord.roleId === 'REGIONAL_SALES_MANAGER') {
          navigate("/workspace/regional-sales-manager");
        } else if (userRecord.roleId === 'AREA_SALES_MANAGER') {
          navigate("/workspace/area-sales-manager");
        } else if (userRecord.roleId === 'MEDICAL_REPRESENTATIVE') {
          navigate("/workspace/medical-representative");
        } else {
          navigate("/workspace/dashboard");
        }
      }, 500);
    } catch (err: any) {
      setTimeout(() => {
        setLoading(false);
        setEmailErr(err.message || 'Invalid email or password.');
        setPasswordErr(err.message === 'Your account is not active.' ? '' : 'Invalid email or password.');
      }, 500);
    }
  };

  return (
    <>
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>
      <div className="min-h-screen flex font-sans bg-brand-light">
      {/* ── Left Brand Panel (Desktop Only) ─────────────────────── */}
      <div className="hidden lg:flex w-[40%] relative flex-col justify-between p-12 overflow-hidden"
           style={{ backgroundColor: '#3b82f6' }}>
        {/* Abstract Background Elements */}
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div 
          animate={{ x: [0, 30, 0], scale: [1, 1.1, 1] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-10 w-80 h-80 bg-brand-accent/30 rounded-full blur-3xl pointer-events-none"
        />
        
        {/* Particles */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz4KPC9zdmc+')] opacity-30 pointer-events-none" />

        {/* Animated Healthcare Graphics */}
        <motion.div 
          animate={{ y: [0, -40, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-[-5%] opacity-15 text-white pointer-events-none z-0"
        >
          <MolecularNetwork className="w-[500px] h-[500px]" />
        </motion.div>
        
        <motion.div 
          animate={{ y: [0, 40, 0], rotate: [0, -15, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-10%] right-10 opacity-15 text-white pointer-events-none z-0"
        >
          <DNAHelix className="w-[400px] h-[400px]" />
        </motion.div>

        <motion.div 
          animate={{ y: [0, -30, 0], x: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/2 left-20 opacity-15 text-white pointer-events-none z-0"
        >
          <HospitalCross className="w-48 h-48" />
        </motion.div>

        <motion.div 
          animate={{ y: [0, 30, 0], x: [0, -30, 0], rotate: [45, 90, 45] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-1/3 left-1/3 opacity-15 text-white pointer-events-none z-0"
        >
          <Pill className="w-32 h-32" strokeWidth={1} />
        </motion.div>

        <div className="absolute top-8 left-8 z-20">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <img src={mjLogo} alt="MJ Healthcare" className="h-50 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.9)]" />
          </Link>
        </div>

        <div className="relative z-10 mt-32 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl lg:text-5xl font-black text-[#163c78] mb-2 leading-tight tracking-tight">
              MJ Healthcare ERP
            </h1>
            <h2 className="text-xl font-bold text-[#163c78] opacity-90 mb-6">
              Enterprise Pharmaceutical Management Platform
            </h2>
            <p className="text-[#163c78] text-lg font-bold italic mb-4">
              Care. Innovate. Cure.
            </p>
            <p className="text-[#163c78] text-sm leading-relaxed max-w-md font-medium mb-9 opacity-100">
              Empowering pharmaceutical enterprises with integrated solutions for streamlined operations, data-driven insights, and regulatory adherence.
            </p>

            <div className="flex flex-col gap-3">
              {[
                { icon: Package, text: 'Inventory Management' },
                { icon: ShoppingCart, text: 'Sales & Billing' },
                { icon: ClipboardCheck, text: 'Purchase Management' },
                { icon: Users, text: 'Medical Representatives' },
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#163c78]/20 bg-white/50 text-[#163c78]">
                    <feature.icon className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-sm text-[#163c78]">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
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
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors bg-white/80 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-brand-border"
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
            className="w-full max-w-[450px] bg-white rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-brand-border p-10 lg:p-12 font-['Inter']"
          >
            {/* ── Role header ────────────────────────────────────── */}
            <div className="flex flex-col items-center mb-8 text-center">
              <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight mb-2">Welcome Back</h2>
              <p className="text-slate-500 mb-6 text-lg">Sign in to MJ Healthcare ERP</p>
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-100 text-slate-700 text-base font-semibold">
                <RoleIcon className="w-5 h-5" />
                {role.title}
              </div>
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
                placeholder="you@mjhealthcare.com"
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
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${rememberMe ? 'bg-brand-primary border-brand-primary' : 'border-slate-300 group-hover:border-brand-primary'}`}>
                    {rememberMe && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <input type="checkbox" className="hidden" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  <span className="text-sm font-medium text-slate-600">Remember Me</span>
                </label>
                <button
                  type="button"
                  className="text-sm font-semibold text-brand-primary hover:text-brand-secondary hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login button */}
              <button
                id="login-btn"
                type="submit"
                disabled={loading || success}
                className={`w-full flex items-center justify-center gap-2.5 h-[50px] rounded-[10px] font-bold text-white text-sm transition-all duration-200 disabled:opacity-80 disabled:cursor-not-allowed mt-4 shadow-sm hover:-translate-y-[2px] active:scale-[0.98] ${success ? 'bg-brand-success' : 'bg-[#163C78] hover:bg-[#0D2C5B]'}`}
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
               <img src={mjLogo} alt="MJ Healthcare" className="h-6 object-contain grayscale" />
               MJ Healthcare ERP
             </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}