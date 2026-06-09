import { motion } from 'framer-motion';
import {
  Package, Warehouse, Receipt, Users, BarChart3,
  Navigation, Calculator, Building2,
} from 'lucide-react';

/* ── Layout constants ──────────────────────────────────────────── */
const ORB  = 460;           // container size (px)
const R1   = 220;           // outer decorative ring radius
const R2   = 185;           // module orbit ring radius
const R3   = 130;           // inner glow ring radius
const C    = ORB / 2;       // centre point
const ICON = 50;            // icon circle diameter
const DUR  = 60;            // rotation duration (seconds)

/* ── Module definitions ────────────────────────────────────────── */
const MODULES = [
  { name: 'Product Management',      icon: Package,    color: '#00D9A3', bg: '#CCFBF1', angle: -45  },
  { name: 'Inventory & Warehouse Management',     icon: Warehouse,  color: '#00BCD4', bg: '#E0F7FA', angle: 0    },
  { name: 'C&F Management',     icon: Building2,  color: '#3B82F6', bg: '#DBEAFE', angle: 45   },
  { name: 'Wholesale Billing System',       icon: Receipt,    color: '#F59E0B', bg: '#FEF3C7', angle: 90   },
  { name: 'Pre-Sales CRM',           icon: Users,      color: '#8B5CF6', bg: '#EDE9FE', angle: 135  },
  { name: 'GPS & Location Tracking',           icon: Navigation, color: '#EF4444', bg: '#FEE2E2', angle: 180  },
  { name: 'Analytics',     icon: BarChart3,  color: '#6366F1', bg: '#EEF2FF', angle: 225  },
  { name: 'Accounting & Finance',       icon: Calculator, color: '#10B981', bg: '#D1FAE5', angle: 270  },
];

/* ── Component ─────────────────────────────────────────────────── */
export const OrbitalSystem = () => (
  <div
    className="relative flex-shrink-0 group"
    style={{ width: ORB, height: ORB }}
  >
    {/* ── Background Floating Particles ───────────────────────────── */}
    <motion.div 
      className="absolute inset-0"
      animate={{ rotate: 360 }}
      transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
    >
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            background: i % 2 === 0 ? '#00D9A3' : '#00BCD4',
            top: C + (Math.random() * R1 - R1/2) * 1.5,
            left: C + (Math.random() * R1 - R1/2) * 1.5,
            opacity: 0.6,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </motion.div>

    {/* ── Connection Lines ─────────────────────────────────────── */}
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: DUR, repeat: Infinity, ease: 'linear' }}
      className="absolute inset-0"
    >
       <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {MODULES.map((mod, i) => {
          const rad = (mod.angle * Math.PI) / 180;
          const x = C + R2 * Math.cos(rad);
          const y = C + R2 * Math.sin(rad);
          return (
            <line
              key={i}
              x1={C} y1={C} x2={x} y2={y}
              stroke="url(#lineGradient)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.3"
            />
          );
        })}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D9A3" />
            <stop offset="100%" stopColor="#00BCD4" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>

    {/* ── Outer decorative ring ────────────────────────────────── */}
    <div
      className="absolute inset-0 rounded-full"
      style={{
        border: '1px dashed rgba(148,163,184,0.30)',
        boxShadow: 'inset 0 0 60px rgba(0,217,163,0.04)',
      }}
    />

    {/* ── Second ring (very subtle) ────────────────────────────── */}
    <div
      className="absolute rounded-full backdrop-blur-[1px]"
      style={{
        top:    C - R1 + 18,
        left:   C - R1 + 18,
        width:  (R1 - 18) * 2,
        height: (R1 - 18) * 2,
        border: '1px solid rgba(148,163,184,0.15)',
      }}
    />

    {/* ── Module orbit ring ────────────────────────────────────── */}
    <div
      className="absolute rounded-full backdrop-blur-[2px]"
      style={{
        top:    C - R2,
        left:   C - R2,
        width:  R2 * 2,
        height: R2 * 2,
        border: '1.5px dashed rgba(0,217,163,0.30)',
      }}
    />

    {/* ── Inner glow ring ──────────────────────────────────────── */}
    <div
      className="absolute rounded-full backdrop-blur-sm"
      style={{
        top:       C - R3,
        left:      C - R3,
        width:     R3 * 2,
        height:    R3 * 2,
        border:    '1px solid rgba(0,217,163,0.22)',
        background:'radial-gradient(circle, rgba(0,217,163,0.08) 0%, transparent 70%)',
      }}
    />

    {/* ── Ambient glow behind center ───────────────────────────── */}
    <motion.div
      animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.8, 0.6] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute rounded-full"
      style={{
        top:       C - 80,
        left:      C - 80,
        width:     160,
        height:    160,
        background:'radial-gradient(circle, rgba(0,217,163,0.30) 0%, transparent 70%)',
        filter:    'blur(12px)',
      }}
    />

    {/* ── Rotating module ring ─────────────────────────────────── */}
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: DUR, repeat: Infinity, ease: 'linear' }}
      className="absolute inset-0"
    >
      {MODULES.map((mod) => {
        const rad = (mod.angle * Math.PI) / 180;
        const x   = C + R2 * Math.cos(rad);
        const y   = C + R2 * Math.sin(rad);

        // Label offset: push text outward along the radial direction
        const LO  = 40;  // label distance from icon center
        const lx  = Math.cos(rad) * LO;
        const ly  = Math.sin(rad) * LO;

        return (
          <div
            key={mod.name}
            className="absolute group/module"
            style={{ left: x - ICON / 2, top: y - ICON / 2, width: ICON, height: ICON }}
          >
            {/* Icon — counter-rotates so it stays upright */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: DUR, repeat: Infinity, ease: 'linear' }}
              className="w-full h-full rounded-full flex items-center justify-center shadow-lg relative cursor-pointer"
              whileHover={{ 
                scale: 1.15,
                boxShadow: `0 0 20px ${mod.color}80`
              }}
              style={{
                background: mod.bg,
                border: `2px solid ${mod.color}50`,
                boxShadow: `0 4px 14px ${mod.color}30`,
              }}
            >
              <mod.icon className="w-5 h-5 relative z-10" style={{ color: mod.color }} />
              <div className="absolute inset-0 rounded-full opacity-0 group-hover/module:opacity-100 transition-opacity" style={{ background: mod.color, filter: 'blur(8px)' }} />
            </motion.div>

            {/* Label — rotates WITH the ring */}
            <div
              className="absolute pointer-events-none"
              style={{
                top:       ICON / 2 + ly - 8,
                left:      ICON / 2 + lx,
                transform: `translate(-50%, -50%) rotate(${mod.angle}deg)`,
                whiteSpace:'nowrap',
              }}
            >
              <span
                className="text-[10px] font-bold tracking-wide transition-colors group-hover/module:text-slate-900"
                style={{ color: '#64748B' }}
              >
                {mod.name}
              </span>
            </div>
          </div>
        );
      })}
    </motion.div>

    {/* ── Centre hub ───────────────────────────────────────────── */}
    <motion.div
      className="absolute flex flex-col items-center justify-center z-10 cursor-pointer"
      whileHover={{ scale: 1.05 }}
      style={{
        width:     120,
        height:    120,
        top:       '50%',
        left:      '50%',
        transform: 'translate(-50%,-50%)',
        background:'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.8) 100%)',
        backdropFilter: 'blur(12px)',
        borderRadius: '50%',
        border:    '1px solid rgba(255,255,255,0.5)',
        boxShadow: `
          0 20px 40px rgba(0,0,0,0.1),
          inset 0 0 0 2px rgba(255,255,255,0.5),
          0 0 0 8px rgba(0,217,163,0.15),
          0 0 0 16px rgba(0,217,163,0.05)
        `,
        color: '#0F172A',
      }}
    >
      <motion.div 
        animate={{ scale: [1, 1.05, 1] }} 
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#00D9A3]/10 to-[#00BCD4]/10 pointer-events-none"
      />
      {/* Pill SVG */}
      <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: 'linear-gradient(135deg, #00D9A3, #00BCD4)' }}>
        <svg width="22" height="11" viewBox="0 0 34 17" fill="none" aria-hidden>
          <rect x="1" y="1" width="32" height="15" rx="7.5"
            stroke="white" strokeWidth="2" />
          <line x1="17" y1="1" x2="17" y2="16"
            stroke="rgba(255,255,255,0.50)" strokeWidth="1.5" />
          <rect x="18" y="2" width="14" height="13" rx="6.5"
            fill="rgba(255,255,255,0.4)" />
        </svg>
      </div>
      <span className="text-[10px] font-black tracking-widest leading-none bg-clip-text text-transparent bg-gradient-to-r from-[#00D9A3] to-[#4F46E5]">
        PHARMA ERP
      </span>
      <span className="text-[9.5px] font-bold tracking-wider opacity-75 mt-1 text-slate-500">
        CORE
      </span>
    </motion.div>

    {/* ── Rotating tick marks on outer ring ────────────────────── */}
    <motion.div
      animate={{ rotate: -360 }}
      transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
      className="absolute inset-0 rounded-full pointer-events-none"
    >
      {Array.from({ length: 36 }).map((_, i) => {
        const a   = (i * 10 * Math.PI) / 180;
        const tx  = C + (R1 - 4) * Math.cos(a);
        const ty  = C + (R1 - 4) * Math.sin(a);
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{ 
              width: i % 3 === 0 ? 4 : 2, 
              height: i % 3 === 0 ? 4 : 2, 
              left: tx - (i % 3 === 0 ? 2 : 1), 
              top: ty - (i % 3 === 0 ? 2 : 1),
              background: i % 3 === 0 ? '#00D9A3' : 'rgba(148,163,184,0.4)',
              boxShadow: i % 3 === 0 ? '0 0 6px #00D9A3' : 'none'
            }}
          />
        );
      })}
    </motion.div>

  </div>
);
