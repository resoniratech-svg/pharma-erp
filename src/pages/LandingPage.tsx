import { Link } from 'react-router';
import { motion } from 'framer-motion';
import mjLogo from '../assets/logo/mj-healthcare-logo.svg';
import {
  ArrowRight, CheckCircle2, Package, Warehouse, Receipt, Users, 
  Navigation, Zap, Globe2, Activity, Star, ShieldCheck,
  Calculator, Building2, Server, Database, LineChart,
  ClipboardList, Truck, Factory, User, ShoppingCart, FileCheck
} from 'lucide-react';

/* ─── Motion helpers ─────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.65, delay },
});

/* ═══════════════════════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════════════════════ */
const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm shadow-slate-100/50 transition-all">
    <div className="max-w-7xl mx-auto px-6 h-[80px] flex items-center justify-between">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3">
        <img src={mjLogo} alt="MJ Healthcare" className="h-14 object-contain" />
      </Link>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-8">
        {['Platform', 'Workflow', 'Modules', 'Analytics'].map((item) => (
          <a key={item} href={`#${item.toLowerCase()}`}
            className="text-sm font-medium text-slate-600 hover:text-primary transition-colors duration-200 relative group">
            {item}
            <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary rounded-full transition-all duration-200 group-hover:w-full" />
          </a>
        ))}
      </div>

      {/* CTA */}
      <Link to="/workspace"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all duration-200 shadow-lg hover:-translate-y-0.5 hover:shadow-xl"
        style={{ background: 'linear-gradient(135deg, #1F2937, #374151)' }}>
        Sign In <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  </nav>
);

const HeroFeatureGrid = () => (
  <div className="flex flex-col items-center justify-center w-full mt-10 lg:mt-0">
    <h3 className="text-2xl font-bold mb-12 tracking-tight text-center drop-shadow-sm text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#4F46E5]">
      India's No. 1 Trusted Pharma ERP
    </h3>
    <div className="grid grid-cols-3 gap-x-8 gap-y-10 w-full max-w-xl">
      {/* Row 1 */}
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 rounded-3xl bg-teal-50/80 flex items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
          <ClipboardList className="w-8 h-8 text-teal-500" />
        </div>
        <span className="text-sm font-bold text-slate-800 leading-tight">Inventory<br/>Management</span>
      </div>
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 rounded-3xl bg-blue-50/80 flex items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
          <Truck className="w-8 h-8 text-blue-500" />
        </div>
        <span className="text-sm font-bold text-slate-800 leading-tight">Sales &<br/>Distribution</span>
      </div>
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 rounded-3xl bg-indigo-50/80 flex items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
          <Factory className="w-8 h-8 text-indigo-500" />
        </div>
        <span className="text-sm font-bold text-slate-800 leading-tight">Manufacturing</span>
      </div>
      {/* Row 2 */}
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 rounded-3xl bg-violet-50/80 flex items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
          <User className="w-8 h-8 text-violet-500" />
        </div>
        <span className="text-sm font-bold text-slate-800 leading-tight">Medical<br/>Representative</span>
      </div>
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 rounded-3xl bg-green-50/80 flex items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
          <ShoppingCart className="w-8 h-8 text-green-500" />
        </div>
        <span className="text-sm font-bold text-slate-800 leading-tight">Purchase<br/>Management</span>
      </div>
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 rounded-3xl bg-amber-50/80 flex items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
          <FileCheck className="w-8 h-8 text-amber-500" />
        </div>
        <span className="text-sm font-bold text-slate-800 leading-tight">GST Billing &<br/>Compliance</span>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════════════════════ */
const Hero = () => (
  <section className="relative min-h-screen flex items-center pt-[80px] overflow-hidden">
    {/* Gradient background */}
    <div className="absolute inset-0"
      style={{
        background: 'radial-gradient(120% 120% at 50% -10%, #ffffff 0%, #f0f9ff 50%, #e0f2fe 100%)',
      }} />

    {/* Decorative blobs */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-32 right-0 w-[700px] h-[700px] rounded-full blur-[120px] opacity-30"
        style={{ background: 'radial-gradient(circle, #00BCD4 0%, transparent 70%)' }} />
      <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] rounded-full blur-[100px] opacity-20"
        style={{ background: 'radial-gradient(circle, #4F46E5 0%, transparent 70%)' }} />
    </div>

    <div className="max-w-7xl mx-auto px-6 w-full relative z-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center py-16">
      {/* Left — copy */}
      <motion.div {...{ initial: { opacity: 0, y: 36 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8 } }}>
        {/* Headline */}
        <h1 className="text-5xl lg:text-[72px] font-black leading-[1.05] mb-4 tracking-tight">
          <span className="text-[#0D1B3D]">MJ</span>{' '}
          <span className="text-[#5B6BC6]">Healthcare</span>
        </h1>
        <h2 className="text-3xl lg:text-4xl font-bold text-[#333333] mb-8 tracking-tight">
          Care. Innovate. Cure.
        </h2>

        {/* Sub-copy */}
        <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-[560px] font-medium">
          Products, inventory, warehouses, billing, CRM <br/>
          unified into a single, intelligent enterprise platform.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-5 mt-4">
          <Link to="/workspace"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-base font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/30"
            style={{
              background: 'linear-gradient(135deg, #00D9A3 0%, #00BCD4 50%, #4F46E5 100%)',
            }}>
            Enter Platform <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </motion.div>

      {/* Right — features */}
      <motion.div
        {...{ initial: { opacity: 0, scale: 0.85 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 1.2, delay: 0.3 } }}
        className="hidden lg:flex items-center justify-center relative w-full h-full"
        style={{ overflow: 'visible' }}>
        <HeroFeatureGrid />
      </motion.div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   TRUSTED BY
═══════════════════════════════════════════════════════════════════ */
const TrustedBy = () => (
  <div className="bg-white/50 backdrop-blur-sm border-y border-slate-200/50 py-8 relative z-20">
    <div className="max-w-7xl mx-auto px-6">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">
        Trusted by leading pharmaceutical enterprises
      </p>
      <div className="flex flex-wrap justify-center gap-14 items-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
        {['SunPharma', 'Cipla', 'Dr. Reddys', 'Lupin', 'Zydus', 'Alkem', 'Torrent'].map((b) => (
          <span key={b} className="text-sm font-black text-slate-700 tracking-tight">{b}</span>
        ))}
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   FEATURE HIGHLIGHTS (Compact)
═══════════════════════════════════════════════════════════════════ */
const featureHighlights = [
  {
    icon: Globe2, color: '#00D9A3', bg: '#e0fdf4',
    title: 'Unified Operations',
    desc: 'Eliminate silos with a single platform for all departments.',
  },
  {
    icon: Zap, color: '#4F46E5', bg: '#eef2ff',
    title: 'Intelligent Automation',
    desc: 'Automate approvals, GST, and smart reorder triggers.',
  },
  {
    icon: ShieldCheck, color: '#00BCD4', bg: '#e0f7fa',
    title: 'Enterprise Security',
    desc: 'Bank-grade security, RBAC, and strict regulatory compliance.',
  },
];

const FeatureHighlights = () => (
  <section id="platform" className="py-24 bg-white relative">
    <div className="max-w-7xl mx-auto px-6">
      <motion.div {...fadeUp()} className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-4">
          Built for Pharma Complexity
        </h2>
        <p className="text-slate-500 text-lg">
          Not a generic ERP. Engineered specifically for the pharmaceutical industry.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {featureHighlights.map((f, i) => (
          <motion.div key={i} {...fadeUp(i * 0.1)}
            className="group relative p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
              style={{ background: f.bg }}>
              <f.icon className="w-6 h-6" style={{ color: f.color }} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   BUSINESS WORKFLOW (Animated Flow)
═══════════════════════════════════════════════════════════════════ */
const workflowSteps = [
  { id: 'Product Management', icon: Package },
  { id: 'Inventory & Warehouse Management', icon: Database },
  { id: 'C&F Management', icon: Warehouse },
  { id: 'Wholesale Billing System', icon: Receipt },
  { id: 'Distributor/Stockist Portal', icon: Building2 },
  { id: 'Retailer Ordering System', icon: Server },
  { id: 'Analytics', icon: LineChart },
];

const BusinessWorkflow = () => (
  <section id="workflow" className="py-24 bg-slate-50 border-y border-slate-100 overflow-hidden relative">
    <div className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: 'linear-gradient(#00D9A3 1px,transparent 1px),linear-gradient(90deg,#00D9A3 1px,transparent 1px)',
        backgroundSize: '32px 32px',
      }} />
      
    <div className="max-w-7xl mx-auto px-6 relative z-10">
      <motion.div {...fadeUp()} className="text-center mb-20">
        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-4">
          Seamless Data Flow
        </h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          From product creation to retail analytics, experience a frictionless supply chain.
        </p>
      </motion.div>

      <div className="relative max-w-5xl mx-auto">
        {/* Connection Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-slate-200 rounded-full overflow-hidden hidden md:block">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#00D9A3] via-[#00BCD4] to-[#4F46E5]"
            initial={{ width: "0%" }}
            whileInView={{ width: "100%" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 md:gap-0 relative z-10">
          {workflowSteps.map((step, i) => (
            <motion.div 
              key={step.id} 
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.5 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-100 shadow-md flex items-center justify-center mb-4 relative group hover:border-[#00D9A3] transition-colors cursor-pointer">
                <step.icon className="w-6 h-6 text-slate-600 group-hover:text-[#00D9A3] transition-colors" />
                {/* Ping effect */}
                <div className="absolute inset-0 rounded-2xl border-2 border-[#00D9A3] opacity-0 group-hover:animate-ping" />
              </div>
              <span className="text-sm font-bold text-slate-700 bg-white/80 px-2 py-1 rounded backdrop-blur-sm">{step.id}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   CORE MODULES (Compact Icons)
═══════════════════════════════════════════════════════════════════ */
const coreModules = [
  { label: 'Product Management', icon: Package, color: '#00D9A3', bg: '#e0fdf4' },
  { label: 'Inventory & Warehouse Management', icon: Database, color: '#00BCD4', bg: '#e0f7fa' },
  { label: 'C&F Management', icon: Warehouse, color: '#3B82F6', bg: '#dbeafe' },
  { label: 'Wholesale Billing System', icon: Receipt, color: '#F59E0B', bg: '#fef3c7' },
  { label: 'Pre-Sales CRM', icon: Users, color: '#8B5CF6', bg: '#ede9fe' },
  { label: 'GPS & Location Tracking', icon: Navigation, color: '#EF4444', bg: '#fee2e2' },
  { label: 'Accounting & Finance', icon: Calculator, color: '#10B981', bg: '#d1fae5' },
  { label: 'Reports', icon: LineChart, color: '#6366F1', bg: '#eef2ff' },
];

const Modules = () => (
  <section id="modules" className="py-24 bg-white">
    <div className="max-w-5xl mx-auto px-6">
      <motion.div {...fadeUp()} className="text-center mb-16">
        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-4">
          Complete Module Ecosystem
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {coreModules.map((mod, i) => (
          <motion.div key={mod.label} {...fadeUp(i * 0.05)}
            className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all bg-white cursor-pointer">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: mod.bg }}>
              <mod.icon className="w-5 h-5" style={{ color: mod.color }} />
            </div>
            <span className="font-bold text-slate-800 text-sm">{mod.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD PREVIEW
═══════════════════════════════════════════════════════════════════ */
const DashboardPreview = () => (
  <section className="py-24 overflow-hidden relative"
    style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0c4a6e 100%)' }}>
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
    <div className="max-w-7xl mx-auto px-6 relative z-10">
      <motion.div {...fadeUp()} className="text-center mb-16">
        <h2 className="text-4xl lg:text-5xl font-black text-white mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
          Clarity at a Glance
        </h2>
        <p className="text-slate-300 text-lg max-w-xl mx-auto">
          Executive dashboards that give you real-time visibility across the entire pharmaceutical supply chain.
        </p>
      </motion.div>

      {/* Dashboard mockup with parallax & glow */}
      <motion.div 
        className="relative group perspective"
        initial={{ opacity: 0, y: 60 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true }} 
        transition={{ duration: 1 }}
      >
        <div className="absolute -inset-4 bg-gradient-to-r from-[#00D9A3] to-[#4F46E5] rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
        
        <motion.div 
          className="relative rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.8)] border border-white/20 bg-slate-900/90 backdrop-blur-xl transform-gpu transition-transform duration-700 hover:scale-[1.02]"
        >
          {/* Window chrome */}
          <div className="bg-white/5 px-5 py-3.5 flex items-center gap-2 border-b border-white/10">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
            <div className="w-3 h-3 rounded-full bg-green-400/80" />
            <div className="flex-1 mx-4 h-6 bg-black/20 rounded-md flex items-center px-3">
              <span className="text-[11px] text-slate-400 font-mono">pharmaerp.app/dashboard</span>
            </div>
          </div>

          {/* Dashboard body */}
          <div className="flex bg-slate-950/50" style={{ minHeight: 600 }}>
            {/* Sidebar */}
            <div className="hidden md:flex w-56 border-r border-white/5 p-5 flex-col gap-1 flex-shrink-0 bg-slate-900/50">
              <div className="flex items-center gap-2.5 mb-8">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
                  style={{ background: 'linear-gradient(135deg,#00D9A3,#00BCD4)' }}>
                  <span className="text-white font-black text-sm">P</span>
                </div>
                <span className="text-white font-bold text-sm tracking-wide">Pharma ERP</span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3 ml-2">Main Menu</p>
              {[
                { icon: Activity, label: 'Dashboard', active: true },
                { icon: Package, label: 'Product Management', active: false },
                { icon: Warehouse, label: 'Inventory & Warehouse Management', active: false },
                { icon: Receipt, label: 'Wholesale Billing System', active: false },
                { icon: Users, label: 'Pre-Sales CRM', active: false },
              ].map((item) => (
                <div key={item.label}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    item.active
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  style={item.active ? { background: 'rgba(0,217,163,0.15)', border: '1px solid rgba(0,217,163,0.3)' } : {}}>
                  <item.icon className="w-4 h-4 flex-shrink-0" style={item.active ? { color: '#00D9A3' } : {}} />
                  {item.label}
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 p-6 overflow-hidden flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-xl">Command Center</h3>
                  <p className="text-slate-400 text-xs mt-1">Real-time enterprise overview</p>
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 font-medium">Last 30 Days</div>
                  <div className="w-8 h-8 rounded-lg bg-[#00D9A3]/20 border border-[#00D9A3]/30 flex items-center justify-center">
                    <span className="flex h-2 w-2 rounded-full bg-[#00D9A3] animate-pulse"></span>
                  </div>
                </div>
              </div>

              {/* KPI cards - 6 items */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { label: 'Total Revenue', val: '₹14.8M', change: '+12%', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
                  { label: 'Orders Today', val: '1,284', change: '+8%', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
                  { label: 'Inventory Health', val: '98.7%', change: 'Optimal', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
                  { label: 'Pending Collections', val: '₹2.1M', change: '-5%', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
                  { label: 'Active MRs', val: '142', change: '96% online', color: '#00BCD4', bg: 'rgba(0, 188, 212, 0.1)' },
                  { label: 'Critical Alerts', val: '3', change: 'Needs action', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-xl p-4 border border-white/5 bg-slate-800/40 backdrop-blur-sm hover:bg-slate-800/60 transition-colors">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2 truncate">{kpi.label}</p>
                    <p className="text-lg font-black text-white mb-1">{kpi.val}</p>
                    <p className="text-[11px] font-semibold" style={{ color: kpi.color }}>{kpi.change}</p>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-2 rounded-xl border border-white/5 bg-slate-800/40 p-5 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-white font-semibold text-sm">Monthly Sales Trend</h4>
                    <span className="text-xs text-slate-400">₹ (Millions)</span>
                  </div>
                  <div className="flex-1 flex items-end gap-3 h-32">
                    {[45, 62, 48, 78, 55, 90, 68, 95, 72, 88, 76, 99].map((h, i) => (
                      <div key={i} className="flex-1 relative group cursor-pointer h-full flex items-end">
                        <div className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-80"
                          style={{
                            height: `${h}%`,
                            background: i === 11
                              ? 'linear-gradient(to top, #00D9A3, #4F46E5)'
                              : 'rgba(255,255,255,0.1)',
                          }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-3 text-[10px] text-slate-500 font-medium">
                    <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                    <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                  </div>
                </div>
                
                <div className="rounded-xl border border-white/5 bg-slate-800/40 p-5 flex flex-col">
                  <h4 className="text-white font-semibold text-sm mb-6">Product Category Performance</h4>
                  <div className="flex-1 flex flex-col justify-center gap-4">
                    {[
                      { name: 'Antibiotics', pct: 42, color: '#00D9A3' },
                      { name: 'Analgesics', pct: 28, color: '#4F46E5' },
                      { name: 'Vitamins', pct: 18, color: '#F59E0B' },
                      { name: 'Others', pct: 12, color: '#64748B' },
                    ].map(cat => (
                      <div key={cat.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 w-24">
                          <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                          <span className="text-slate-300">{cat.name}</span>
                        </div>
                        <div className="flex-1 mx-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${cat.pct}%`, background: cat.color }} />
                        </div>
                        <span className="text-slate-400 font-medium w-8 text-right">{cat.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Widgets row */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-white/5 bg-slate-800/40 p-4">
                  <h4 className="text-slate-300 font-semibold text-xs mb-3 flex items-center gap-2"><Package className="w-3.5 h-3.5 text-blue-400"/> Recent Orders</h4>
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex justify-between items-center bg-white/5 rounded p-2">
                        <div>
                          <div className="text-[10px] text-slate-400">ORD-2026-{990+i}</div>
                          <div className="text-xs text-slate-200">Apollo Pharmacy</div>
                        </div>
                        <div className="text-xs font-semibold text-[#00D9A3]">₹45K</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="rounded-xl border border-white/5 bg-slate-800/40 p-4">
                  <h4 className="text-slate-300 font-semibold text-xs mb-3 flex items-center gap-2"><Warehouse className="w-3.5 h-3.5 text-orange-400"/> Low Stock Alerts</h4>
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex justify-between items-center bg-white/5 rounded p-2 border-l-2 border-orange-500">
                        <div className="text-xs text-slate-200">Paracetamol 500mg</div>
                        <div className="text-[10px] font-semibold text-orange-400">40 units left</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="rounded-xl border border-white/5 bg-slate-800/40 p-4">
                  <h4 className="text-slate-300 font-semibold text-xs mb-3 flex items-center gap-2"><Users className="w-3.5 h-3.5 text-purple-400"/> MR Visits Today</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Completed</span>
                      <span className="text-white font-bold">482 / 650</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full w-full overflow-hidden">
                      <div className="h-full bg-purple-500 w-[74%] rounded-full"></div>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2 text-right">74% completion rate</div>
                  </div>
                </div>
                
                <div className="rounded-xl border border-white/5 bg-slate-800/40 p-4 flex flex-col justify-center text-center">
                  <h4 className="text-slate-300 font-semibold text-xs mb-2">Pending Payments</h4>
                  <p className="text-2xl font-black text-red-400 mb-1">₹8.4M</p>
                  <p className="text-[10px] text-slate-500">Across 42 distributors</p>
                  <button className="mt-4 text-[10px] uppercase font-bold text-white bg-white/10 hover:bg-white/20 py-1.5 rounded transition-colors">View Aging Report</button>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   ANALYTICS SECTION
═══════════════════════════════════════════════════════════════════ */
const AnalyticsSection = () => (
  <section id="analytics" className="py-24 bg-slate-50 border-t border-slate-200">
    <div className="max-w-7xl mx-auto px-6">
      <motion.div {...fadeUp()} className="text-center mb-16">
        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-4">
          Enterprise Analytics
        </h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Harness the power of business intelligence. Make data-driven decisions with deep insights across your entire pharmaceutical operation.
        </p>
      </motion.div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {[
          { title: 'Revenue Growth', val: '+24.8%', sub: 'vs last year', icon: LineChart, color: 'text-[#00D9A3]' },
          { title: 'Order Fulfillment Rate', val: '99.2%', sub: 'SLA compliant', icon: Package, color: 'text-[#00BCD4]' },
          { title: 'Inventory Turnover', val: '12.4x', sub: 'ratio / year', icon: Database, color: 'text-[#4F46E5]' },
          { title: 'Collection Efficiency', val: '94%', sub: 'within 30 days', icon: Receipt, color: 'text-[#F59E0B]' },
        ].map((kpi, i) => (
          <motion.div key={kpi.title} {...fadeUp(i * 0.1)} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <h4 className="text-sm font-semibold text-slate-600 leading-tight">{kpi.title}</h4>
            </div>
            <p className="text-3xl font-black text-slate-900 mb-1">{kpi.val}</p>
            <p className="text-xs text-slate-400 font-medium">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Analytics Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { title: 'Sales Analytics', desc: 'Track state-wise, territory-wise, and product-wise revenue performance.' },
          { title: 'Inventory Analytics', desc: 'Monitor stock aging, expiry risks, dead stock, and reorder levels.' },
          { title: 'Distributor Analytics', desc: 'Evaluate distributor performance, outstanding ledgers, and order fulfillment.' },
          { title: 'Retail Analytics', desc: 'Analyze scheme ROI, retail sales trends, and primary vs secondary sales.' },
          { title: 'CRM Analytics', desc: 'Measure MR productivity, doctor visit effectiveness, and lead conversion rates.' },
          { title: 'Finance Analytics', desc: 'Review profitability, pending collections, tax compliance, and cash flow.' },
        ].map((card, i) => (
          <motion.div key={card.title} {...fadeUp(0.3 + (i * 0.1))} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm group hover:border-indigo-100 hover:shadow-lg transition-all cursor-pointer">
            <h4 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{card.title}</h4>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">{card.desc}</p>
            <div className="flex items-center text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform duration-300">
              View Reports <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   CTA BANNER
═══════════════════════════════════════════════════════════════════ */
const CTABanner = () => (
  <section className="py-24 relative overflow-hidden bg-white border-t border-slate-100">
    <div className="absolute inset-0 pointer-events-none opacity-50">
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
        style={{ background: '#00D9A3' }} />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-15"
        style={{ background: '#4F46E5' }} />
    </div>

    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
      <motion.div {...fadeUp()}>
        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
          Ready to digitize your <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D9A3] to-[#4F46E5]">pharmaceutical operations?</span>
        </h2>
        <p className="text-slate-500 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Join leading enterprises optimizing products, inventory, billing, and CRM in a single unified platform.
        </p>
        <div className="flex justify-center items-center gap-4">
          <Link to="/workspace"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #00D9A3, #4F46E5)',
              boxShadow: '0 8px 32px rgba(0,217,163,0.3)',
            }}>
            Enter Platform <ArrowRight className="w-5 h-5" />
          </Link>
          <a href="#" className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all duration-300 shadow-sm hover:shadow-md">
            Book Demo
          </a>
        </div>
      </motion.div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════════════════ */
const Footer = () => (
  <footer className="bg-slate-950 pt-20 pb-10 border-t border-slate-900">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
        
        {/* Column 1 - Brand */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #00D9A3, #00BCD4)' }}>
              <span className="text-white font-black text-sm">P</span>
            </div>
            <span className="text-lg font-extrabold text-white tracking-tight">Pharma ERP</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            The intelligent operating system engineered specifically for modern pharmaceutical enterprises.
          </p>
          <div className="space-y-2">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-300"><CheckCircle2 className="w-3.5 h-3.5 text-[#00D9A3]" /> GST Compliant</span>
            <span className="flex items-center gap-2 text-xs font-bold text-slate-300"><CheckCircle2 className="w-3.5 h-3.5 text-[#00D9A3]" /> CDSCO Ready</span>
            <span className="flex items-center gap-2 text-xs font-bold text-slate-300"><CheckCircle2 className="w-3.5 h-3.5 text-[#00D9A3]" /> FDA 21 CFR Ready</span>
          </div>
        </div>

        {/* Column 2 - Platform */}
        <div>
          <h4 className="text-white font-bold mb-6 tracking-wide">Platform</h4>
          <ul className="space-y-3 text-sm text-slate-400">
            <li><a href="#" className="hover:text-white transition-colors">Dashboard</a></li>
            <li><a href="#workflow" className="hover:text-white transition-colors">Workflow</a></li>
            <li><a href="#analytics" className="hover:text-white transition-colors">Analytics</a></li>
            <li><a href="#modules" className="hover:text-white transition-colors">Modules</a></li>
            <li><a href="#" className="hover:text-white transition-colors font-semibold text-[#00D9A3]">Book Demo</a></li>
          </ul>
        </div>

        {/* Column 3 - Modules */}
        <div>
          <h4 className="text-white font-bold mb-6 tracking-wide">Modules</h4>
          <ul className="space-y-3 text-sm text-slate-400">
            <li><a href="#" className="hover:text-white transition-colors">Product Management</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Inventory & Warehouse Management</a></li>
            <li><a href="#" className="hover:text-white transition-colors">C&F Management</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Wholesale Billing System</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Pre-Sales CRM</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Accounting & Finance</a></li>
            <li><a href="#" className="hover:text-white transition-colors">GPS & Location Tracking</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Alerts & Notifications</a></li>
          </ul>
        </div>

        {/* Column 4 - User Roles */}
        <div>
          <h4 className="text-white font-bold mb-6 tracking-wide">User Roles</h4>
          <ul className="space-y-3 text-sm text-slate-400">
            <li><a href="#" className="hover:text-white transition-colors">Super Admin</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Warehouse Manager</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Distributor</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Retailer</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Medical Representative</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Accountant</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Transport Staff</a></li>
          </ul>
        </div>

        {/* Column 5 - Support & Legal */}
        <div>
          <h4 className="text-white font-bold mb-6 tracking-wide">Support & Legal</h4>
          <ul className="space-y-3 text-sm text-slate-400">
            <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-white transition-colors flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#00BCD4]"/> Security</a></li>
          </ul>
        </div>

      </div>

      <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500">
        <p>&copy; {new Date().getFullYear()} Pharma ERP Technologies Pvt. Ltd. All rights reserved.</p>
        <div className="flex gap-6 items-center">
           <span className="flex items-center gap-1.5"><Globe2 className="w-3.5 h-3.5" /> Made for Enterprise Scale</span>
        </div>
      </div>
    </div>
  </footer>
);

/* ═══════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans selection:bg-primary/20 selection:text-slate-900">
      <Navbar />
      <Hero />
      <TrustedBy />
      <FeatureHighlights />
      <BusinessWorkflow />
      <DashboardPreview />
      <Modules />
      <AnalyticsSection />
      <CTABanner />
      <Footer />
    </div>
  );
}
