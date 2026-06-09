import { type ReactNode } from 'react';
import { Search, Download } from 'lucide-react';
import { GlowCard } from '../../../components/ui/GlowCard';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
}

const badgeStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  purple: 'bg-violet-50 text-violet-700 border-violet-200',
};

export function Badge({ variant, children }: { variant: BadgeVariant; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyles[variant]}`}>
      {children}
    </span>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…' }: { value: string; onChange: (v: string) => void; placeholder?: string; }) {
  return (
    <div className="relative flex-1 min-w-[200px] max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
      />
    </div>
  );
}

export function SelectFilter({ value, onChange, options, placeholder = 'All' }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[]; placeholder?: string; }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function ActionButton({ onClick, variant = 'primary', children, icon, className = '' }: { onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost'; children: ReactNode; icon?: ReactNode; className?: string; }) {
  const styles = {
    primary: 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-200',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600',
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 ${styles[variant]} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

export function DataTable<T extends { id: string | number }>({ columns, data, onRowClick, emptyMessage = 'No records found.' }: { columns: Column<T>[]; data: T[]; onRowClick?: (row: T) => void; emptyMessage?: string; }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Search className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-slate-500 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200">
            {columns.map((col) => (
              <th key={String(col.key)} className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{ width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row) => (
            <tr key={row.id} onClick={() => onRowClick?.(row)} className={`transition-colors hover:bg-violet-50/40 ${onRowClick ? 'cursor-pointer' : ''}`}>
              {columns.map((col) => (
                <td key={String(col.key)} className="py-3.5 px-4 text-sm text-slate-700 whitespace-nowrap">
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[String(col.key)] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PageHeader({ title, subtitle, breadcrumb = [], actions }: { title: string; subtitle?: string; breadcrumb?: { label: string; path?: string }[]; actions?: ReactNode; }) {
  return (
    <div className="mb-6">
      {breadcrumb.length > 0 && (
        <nav className="flex text-sm text-slate-500 mb-2">
          {breadcrumb.map((item, index) => (
            <span key={item.label} className="flex items-center">
              {item.path ? <a href={item.path} className="hover:text-violet-600 transition-colors">{item.label}</a> : <span className="text-slate-700 font-medium">{item.label}</span>}
              {index < breadcrumb.length - 1 && <span className="mx-2">/</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50/60 border border-slate-200 rounded-xl mb-5">{children}</div>;
}

export function TableCard({ children }: { children: ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">{children}</div>;
}

const getGlowProps = (colorClass: string) => {
  if (colorClass.includes('emerald')) return { glowColor: 'rgba(16, 185, 129, 0.55)', glowColorIdle: 'rgba(16, 185, 129, 0.25)', borderGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)' };
  if (colorClass.includes('violet')) return { glowColor: 'rgba(124, 58, 237, 0.55)', glowColorIdle: 'rgba(124, 58, 237, 0.22)', borderGradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #ddd6fe 100%)' };
  if (colorClass.includes('blue') || colorClass.includes('cyan')) return { glowColor: 'rgba(59, 130, 246, 0.55)', glowColorIdle: 'rgba(59, 130, 246, 0.22)', borderGradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #bfdbfe 100%)' };
  if (colorClass.includes('rose') || colorClass.includes('amber')) return { glowColor: 'rgba(244, 63, 94, 0.50)', glowColorIdle: 'rgba(244, 63, 94, 0.20)', borderGradient: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 50%, #fecdd3 100%)' };
  return { glowColor: 'rgba(148, 163, 184, 0.50)', glowColorIdle: 'rgba(148, 163, 184, 0.20)', borderGradient: 'linear-gradient(135deg, #94a3b8 0%, #cbd5e1 50%, #f1f5f9 100%)' };
};

export function SummaryCard({ title, value, subtitle, icon, colorClass, bgClass }: { title: string; value: string; subtitle?: string; icon: ReactNode; colorClass: string; bgClass: string; }) {
  const glowProps = getGlowProps(colorClass);
  return (
    <GlowCard
      borderGradient={glowProps.borderGradient}
      glowColor={glowProps.glowColor}
      glowColorIdle={glowProps.glowColorIdle}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgClass}`}>
          <div className={colorClass}>{icon}</div>
        </div>
      </div>
      <div>
        <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        {subtitle && <p className="text-xs font-medium mt-2 text-slate-400">{subtitle}</p>}
      </div>
    </GlowCard>
  );
}

export function ExportButton() {
  return (
    <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>
      Export CSV
    </ActionButton>
  );
}
